// El transporte Bluetooth BLE de la app: estado del adaptador + código/decodigo de
// los paquetes del protocolo y su emisión/escaneo (diseno-ble.md, ADR-016).
// Lo usan CU01 (ADR-012) y los flujos BLE de CU05/CU06 (la fase BLE).
// Regla: aquí vive el "idioma" entre teléfonos; la lógica de cada caso de uso
// (qué se hace con cada canal) queda en NEnrolamiento / NVinculacion.

import { BleManager, ScanMode, State } from '@sfourdrinier/react-native-ble-plx';
import type { Device } from '@sfourdrinier/react-native-ble-plx';
import BleAdvertise from 'react-native-ble-advertise';
import { AppState, PermissionsAndroid, Platform } from 'react-native';

// ─── Constantes del protocolo (ADR-016) ───
// Company ID propio de la app: 16 bits del fabricante del paquete publicitario.
export const COMPANY_ID_APP = 0xf8e2;
// Marcadores dentro de los 16 bytes "uuid" del iBeacon: distinguen los canales.
export const MARCADOR_MATERIA = 0xa2;
export const MARCADOR_META = 0xa3;
// Bit 15 del major: marca un paquete de RESPUESTA (los registros nunca lo usan).
export const BITS_RESPUESTA = 0x8000;
// Bytes útiles de texto que caben en un chunk META (16 del uuid menos el marcador).
export const TAMANO_CHUNK_META = 15;

// El administrador BLE (uno solo para toda la app)
const administradorBle = new BleManager();

// Company ID de la emisión: react-native-ble-advertise nace con companyId 0x0000 y
// broadcast() lo rechaza si no se configura antes (BleAdvertiseModule.java).
// Se fija una sola vez al cargar el módulo; sin esto el docente "emite" en falso.
if (Platform.OS !== 'web') {
    BleAdvertise.setCompanyId(COMPANY_ID_APP);
}

// ─── Canales del protocolo ───

// El docente emite esto para anunciar un grupo (el estudiante arma su tarjeta)
export type CanalMateria = { canal: 'MATERIA'; idGrupo: number };
// El docente emite esto para entregar nombre/extensión/semestre/año del grupo.
// Como el uuid admite solo 15 bytes de texto, el docente parte el texto en chunks
// (índice 0..n en los bits 0..14 del minor, bit 15 = es el último).
export type CanalMeta = {
    canal: 'META';
    idGrupo: number;
    indice: number;
    ultimo: boolean;
    texto: string;
};
// El estudiante emite su credencial [uuid del teléfono + registro de 1 a 9 dígitos]
export type CanalIdentidad = { canal: 'IDENTIDAD'; uuid: string; registro: number };
// El docente confirma (ACEPTADO/RECHAZADO) dirigiéndose al uuid de ese estudiante
export type CanalRespuesta = { canal: 'RESPUESTA'; uuid: string; aceptado: boolean };

export type CanalBLE = CanalMateria | CanalMeta | CanalIdentidad | CanalRespuesta;

// ─── Codificación ───

// Convierte 16 bytes en la cadena uuid que exige la librería (32 hexdígitos)
function bytesAUuid(bytes: number[]): string {
    const hex = bytes.map((byte) => byte.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

// Construye un uuid de 16 bytes a partir de bytes opcionales (con relleno fijo)
function uuidDeCanal(bytes: number[], relleno = 0): string {
    const completo = new Array<number>(16).fill(relleno);
    bytes.forEach((byte, i) => {
        completo[i] = byte;
    });
    return bytesAUuid(completo);
}

// El texto que viaja en los chunks META: nombre|extension|semestre|anio
export function textoMetaDeGrupo(grupo: {
    nombre: string;
    extension: string | null;
    semestre: string | null;
    anio: number | null;
}): string {
    return [grupo.nombre, grupo.extension ?? '', grupo.semestre ?? '', grupo.anio ?? ''].join('|');
}

// Parte el texto meta en chunks de TAMANO_CHUNK_META bytes (uno por broadcast)
export function chunksDeTextoMeta(texto: string, tamano = TAMANO_CHUNK_META): string[] {
    const chunks: string[] = [];
    for (let i = 0; i < texto.length; i += tamano) {
        chunks.push(texto.slice(i, i + tamano));
    }
    return chunks.length > 0 ? chunks : [''];
}

// Traduce un canal a lo que pide react-native-ble-advertise (uuid, major, minor)
function canalEnBytes(canal: CanalBLE): { uuid: string; major: number; minor: number } {
    if (canal.canal === 'MATERIA') {
        return { uuid: uuidDeCanal([MARCADOR_MATERIA]), major: canal.idGrupo, minor: 0 };
    }
    if (canal.canal === 'META') {
        const bytes = [MARCADOR_META, ...canal.texto.split('').map((letra) => letra.charCodeAt(0))];
        // minor: bit 0..14 = índice del chunk, bit 15 = es el último (permite ensamblar)
        const minor = canal.indice | (canal.ultimo ? BITS_RESPUESTA : 0);
        return { uuid: uuidDeCanal(bytes), major: canal.idGrupo, minor };
    }
    if (canal.canal === 'IDENTIDAD') {
        return {
            uuid: canal.uuid,
            major: Math.floor(canal.registro / 65536),
            minor: canal.registro % 65536,
        };
    }
    // RESPUESTA: eco del uuid del estudiante + resultado en el bit 15 del major
    return { uuid: canal.uuid, major: BITS_RESPUESTA | (canal.aceptado ? 1 : 0), minor: 0 };
}

// ─── Decodificación ───

// El manufacturerData que expone ble-plx empieza con: company id (2, LE) + 0x02 0x15
// + uuid (16) + major (2, BE) + minor (2, BE) + potencia. Devuelve null si no es nuestro.
function decodificarManufacturerData(bytes: Uint8Array): CanalBLE | null {
    if (bytes.length < 24) return null;
    const company = bytes[0] | (bytes[1] << 8);
    if (company !== COMPANY_ID_APP) return null;
    if (bytes[2] !== 0x02 || bytes[3] !== 0x15) return null;
    const uuidBytes = Array.from(bytes.slice(4, 20)) as number[];
    const major = (bytes[20] << 8) | bytes[21];
    const minor = (bytes[22] << 8) | bytes[23];

    if (uuidBytes[0] === MARCADOR_MATERIA) {
        return { canal: 'MATERIA', idGrupo: major };
    }
    if (uuidBytes[0] === MARCADOR_META) {
        const texto = uuidBytes
            .slice(1)
            .map((byte) => String.fromCharCode(byte))
            .join('');
        return {
            canal: 'META',
            idGrupo: major,
            texto: (minor & BITS_RESPUESTA) !== 0 ? texto.replace(/\u0000+$/, '') : texto,
            indice: minor & (BITS_RESPUESTA - 1),
            ultimo: (minor & BITS_RESPUESTA) !== 0,
        };
    }
    const uuid = bytesAUuid(uuidBytes);
    if ((major & BITS_RESPUESTA) !== 0) {
        return { canal: 'RESPUESTA', uuid, aceptado: (major & 1) === 1 };
    }
    // Sin marcador y sin flag de respuesta: solo puede ser una identidad [registro+uuid].
    // major+minor son 32 bits: alcanzan hasta 999 999 999 (nueve dígitos).
    const registro = major * 65536 + minor;
    if (registro < 1 || registro > 999999999) return null;
    return { canal: 'IDENTIDAD', uuid, registro };
}

// Desarma el base64 del manufacturerData en bytes
function base64ABytes(base64: string): Uint8Array | null {
    try {
        const cadena = atob(base64);
        const bytes = new Uint8Array(cadena.length);
        for (let i = 0; i < cadena.length; i++) {
            bytes[i] = cadena.charCodeAt(i);
        }
        return bytes;
    } catch {
        return null;
    }
}

function canalDeDispositivo(dispositivo: Device): CanalBLE | null {
    const base64 = dispositivo.manufacturerData;
    if (!base64) return null;
    const bytes = base64ABytes(base64);
    if (!bytes) return null;
    return decodificarManufacturerData(bytes);
}

// ─── Permisos (Android) ───

// Pide los permisos de Bluetooth una sola vez por tanda: las llamadas simultáneas
// esperan a la primera (evita que el diálogo salga dos veces al montar una vista).
let solicitudPermisos: Promise<boolean> | null = null;

function pedirPermisosBluetooth(): Promise<boolean> {
    if (solicitudPermisos) return solicitudPermisos;
    solicitudPermisos = solicitarPermisosBluetooth().finally(() => {
        solicitudPermisos = null;
    });
    return solicitudPermisos;
}

async function solicitarPermisosBluetooth(): Promise<boolean> {
    if (Platform.OS !== 'android') {
        return true;
    }
    if (Platform.Version >= 31) {
        const resultados = await PermissionsAndroid.requestMultiple([
            'android.permission.BLUETOOTH_SCAN',
            'android.permission.BLUETOOTH_CONNECT',
            'android.permission.BLUETOOTH_ADVERTISE',
        ]);
        return Object.values(resultados).every(
            (valor) => valor === PermissionsAndroid.RESULTS.GRANTED,
        );
    }
    // Android 11 y anteriores: la ubicación es necesaria para escanear
    const resultado = await PermissionsAndroid.request('android.permission.ACCESS_FINE_LOCATION');
    return resultado === PermissionsAndroid.RESULTS.GRANTED;
}

// ¿Están concedidos los permisos BLE para emitir/escuchar? Pide una vez si faltan;
// si el usuario ya respondió (otorgado o denegado), resuelve al instante sin volver
// a abrir el diálogo. Los flujos de CU05/CU06 lo usan para no arrancar "en falso".
export function permisosBluetoothBLE(): Promise<boolean> {
    return pedirPermisosBluetooth();
}

// ─── Estado del Bluetooth (vigilado en vivo, con auto-corrección) ───

// Cada cuánto se vuelve a preguntar el estado real del adaptador. La primera
// lectura suele llegar "apagado/desconocido" aunque esté encendido (Android lo
// entrega tarde); releer periódicamente corrige sola ese valor sin depender de
// que el usuario apague/encienda el Bluetooth.
const INTERVALO_ESTADO_MS = 3000;

// Un solo "vigía" compartido por todos los suscriptores.
let estadoSabido: boolean | null = null; // último valor definitivo (null = aún no se sabe)
const suscriptoresEstado = new Set<(encendido: boolean | null) => void>();
let intervaloEstado: ReturnType<typeof setInterval> | null = null;
let refrescando = false;

// Lee el estado del adaptador: true/false si es definitivo, null si es transitorio
// (Iniciando, Reiniciando, sin soporte...). Una lectura que falla NUNCA debe
// interpretarse como "Bluetooth apagado".
async function leerEstadoAdaptador(): Promise<boolean | null> {
    try {
        const estado = await administradorBle.state();
        if (estado === State.PoweredOn) return true;
        if (estado === State.PoweredOff) return false;
        return null;
    } catch {
        return null;
    }
}

// Avisa a los suscriptores SOLO cuando el valor definitivo cambia (evita re-renders
// en vano).
function notificarEstado(encendido: boolean | null): void {
    if (encendido === estadoSabido) return;
    estadoSabido = encendido;
    suscriptoresEstado.forEach((alCambiar) => alCambiar(encendido));
}

// Relee el estado real y lo difunde si cambió. Si aún no se sabe, conserva el
// último valor conocido para que la vista no parpadee entre estados.
async function refrescarEstado(): Promise<void> {
    if (refrescando) return;
    refrescando = true;
    try {
        const permisosOk = await pedirPermisosBluetooth();
        const encendido = permisosOk ? await leerEstadoAdaptador() : null;
        if (encendido === true || encendido === false) {
            notificarEstado(encendido);
        }
    } finally {
        refrescando = false;
    }
}

function arrancarVigilanciaEstado(): void {
    void refrescarEstado();
    intervaloEstado = setInterval(refrescarEstado, INTERVALO_ESTADO_MS);
}

function detenerVigilanciaEstado(): void {
    if (intervaloEstado != null) {
        clearInterval(intervaloEstado);
        intervaloEstado = null;
    }
}

// ¿Está el Bluetooth encendido? Pide permisos, lee y reintenta un par de veces si
// la respuesta aún no es definitiva (null = no se sabe todavía).
export async function obtenerEstadoBluetooth(): Promise<boolean | null> {
    const permisosOk = await pedirPermisosBluetooth();
    if (!permisosOk) return null;
    for (let intento = 0; intento < 3; intento++) {
        const encendido = await leerEstadoAdaptador();
        if (encendido !== null) return encendido;
        await new Promise((resolver) => setTimeout(resolver, 250));
    }
    return null;
}

// Avisa cada vez que el Bluetooth cambia de encendido a apagado (o al revés), y
// además se auto-corrige: cada INTERVALO_ESTADO_MS vuelve a preguntar el estado
// real (no depende solo de los eventos de cambio, que Android pierde cuando la
// app viene de segundo plano). Devuelve la función para dejar de escuchar.
export function escucharEstadoBluetooth(
    alCambiar: (encendido: boolean | null) => void,
): () => void {
    suscriptoresEstado.add(alCambiar);
    if (suscriptoresEstado.size === 1) {
        arrancarVigilanciaEstado();
    }

    // Cambios instantáneos del adaptador (encender/apagar el Bluetooth en caliente)
    const suscripcion = administradorBle.onStateChange((estado) => {
        if (estado === State.PoweredOn || estado === State.PoweredOff) {
            notificarEstado(estado === State.PoweredOn);
        }
    }, false);

    // Al volver de un segundo plano Android no avisa de nada: se relee al instante
    const suscripcionAppState = AppState.addEventListener('change', (estadoApp) => {
        if (estadoApp === 'active') {
            void refrescarEstado();
        }
    });

    // Entrega de una vez el último valor conocido (null si aún no se sabe)
    alCambiar(estadoSabido);

    return () => {
        suscriptoresEstado.delete(alCambiar);
        suscripcion.remove();
        suscripcionAppState.remove();
        if (suscriptoresEstado.size === 0) {
            detenerVigilanciaEstado();
        }
    };
}

// ─── Escaneo ───

// Las opciones de escaneo: ALL_MATCHES (repetir el mismo paquete) ya es el default
// nativo; el modo LOW_LATENCY sube la ventana de escucha para no perder las ráfagas
// del otro teléfono (el default LOW_POWER tiene ventanas mínimas y divide la emisión).
const OPCIONES_ESCANEO = { allowDuplicates: true, scanMode: ScanMode.LowLatency };

// Android limita los inicios de escaneo. Si uno falla no se debe reiniciar en un
// bucle corto: el sistema bloquea aún más intentos y se pierde toda la sesión BLE.
const PAUSA_REINTENTO_ESCANEO_MS = 30000;

// Empieza a escuchar los paquetes de la app y va entregando los canales decodificados
// con su fuerza de señal (rssi). Devuelve la función para detener el escaneo.
// Si Android mata el escáner (típico al anunciar y escanear a la vez), se avisa en
// consola y se reintenta solo; sin esto el escáner del docente moriría en silencio.
export function iniciarEscaneo(alRecibir: (canal: CanalBLE, rssi: number) => void): () => void {
    let activo = true;
    let reinicio: ReturnType<typeof setTimeout> | null = null;

    const callback = (error: unknown, dispositivo: Device | null) => {
        if (error) {
            const mensaje = error instanceof Error ? error.message : String(error);
            console.warn('[NBluetooth] error de escaneo, se reintenta en breve: ' + mensaje);
            if (activo && reinicio == null) {
                reinicio = setTimeout(() => {
                    reinicio = null;
                    if (activo) {
                        void administradorBle.startDeviceScan(null, OPCIONES_ESCANEO, callback);
                    }
                }, PAUSA_REINTENTO_ESCANEO_MS);
            }
            return;
        }
        if (!dispositivo) return;
        const canal = canalDeDispositivo(dispositivo);
        if (canal) alRecibir(canal, dispositivo.rssi ?? 0);
    };

    void administradorBle.startDeviceScan(null, OPCIONES_ESCANEO, callback);

    return () => {
        activo = false;
        if (reinicio != null) {
            clearTimeout(reinicio);
            reinicio = null;
        }
        void detenerEscaneo();
    };
}

// Detiene el escaneo de paquetes
function detenerEscaneo(): void {
    try {
        administradorBle.stopDeviceScan();
    } catch {
        // detener dos veces no rompe nada
    }
}

// ─── Emisión ───

// Emite un solo canal (detiene la emisión anterior). El teléfono anuncia un paquete
// a la vez; los hooks alternan canales con sus propias colas/cadencia. Entre canal y
// canal se espera un respiro: el módulo nativo resuelve broadcast() de forma optimista
// y si el stack aún no terminó de apagar el anuncio anterior responde ALREADY_STARTED
// (ese canal se perdía en silencio → chunks META faltantes).
const PAUSA_ENTRE_EMISIONES_MS = 80;

export async function emitirCanal(canal: CanalBLE): Promise<boolean> {
    if (Platform.OS === 'web') return false;
    // Sin BLUETOOTH_ADVERTISE cualquier broadcast lanza SecurityException; se
    // verifica (barato: no re-abre el diálogo si ya fue decidido) antes de emitir.
    if (Platform.OS === 'android' && !(await permisosBluetoothBLE())) {
        console.warn(
            '[NBluetooth] sin permiso de emisión (BLUETOOTH_ADVERTISE): no se anuncia el canal',
            canal,
        );
        return false;
    }
    const { uuid, major, minor } = canalEnBytes(canal);
    try {
        await BleAdvertise.stopBroadcast();
        await new Promise<void>((resolver) => setTimeout(resolver, PAUSA_ENTRE_EMISIONES_MS));
    } catch {
        // aún no había nada que detener
    }
    try {
        await BleAdvertise.broadcast(uuid, major, minor);
        return true;
    } catch (error) {
        // No ocultar los fallos de emisión: si algo falla en el teléfono debe
        // verse en la consola (Metro) en vez de emitir "en falso".
        console.warn('[NBluetooth] falló la emisión del canal', canal, error);
        return false;
    }
}

// Detiene la emisión completa
export async function detenerEmision(): Promise<void> {
    if (Platform.OS === 'web') return;
    try {
        await BleAdvertise.stopBroadcast();
    } catch {
        // nada que detener
    }
}
