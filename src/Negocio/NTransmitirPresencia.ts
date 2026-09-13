// Tema: transmitir presencia por Bluetooth (CU10, lado estudiante).
// El estudiante EMITE su identidad [Registro + UUID] en ráfagas, escucha el ACK
// del docente y, al recibirlo, vibra, guarda su marcación local y pasa a
// "Asistencia Confirmada".
// ADR-014: las vistas toman sus tipos desde Negocio (nunca desde Datos).
// ADR-019: el radio vive separado por rol (este archivo = estudiante;
// NEscanearAsistencia = docente); NAsistencia queda para CU12–CU14.

import { useCallback, useEffect, useRef, useState } from 'react';
import { Vibration } from 'react-native';

import { DAsistencia } from '@/Datos/DAsistencia';
import { DDispositivo } from '@/Datos/DDispositivo';
import { DGrupo } from '@/Datos/DGrupo';
import { DPerfil } from '@/Datos/DPerfil';
import { DSesion } from '@/Datos/DSesion';

import {
    detenerEmision,
    emitirCanal,
    escucharEstadoBluetooth,
    iniciarEscaneo as escanearBle,
    obtenerEstadoBluetooth,
    permisosBluetoothBLE,
} from '@/Negocio/Servicio/BluetoothServicio';
import type { CanalBLE } from '@/Negocio/Servicio/BluetoothServicio';

// Tipos que las vistas de CU10 importan desde Negocio (versión publicada de Datos)
export type {
    AsistenciaRegistrada,
    DAsistencia,
    EstadoAsistencia,
    MetodoAsistencia,
} from '@/Datos/DAsistencia';

// Los pasos de pantalla del spec CU10 (mismos nombres que en los .md)
export type PasoTransmision =
    'READY' | 'TRANSMITTING' | 'CONFIRMED' | 'TIMEOUT' | 'BT_OFF' | 'NOT_SUPPORTED';

// Lo que el estudiante recibe con el ACK (vista CONFIRMED de CU10)
export interface DatosConfirmacion {
    idSesion: number;
    fechaHora: string;
    sesionNombre: string;
}

// CU10: cuánto anuncia cada pulso de identidad y cuánto queda en silencio escuchando
// (el escáner no atrapa el ACK mientras este teléfono anuncia — diseno-ble.md).
const HOLD_IDENTIDAD_MS = 350;
const VENTANA_ESCUCHA_ACK_MS = 1500;

// CU10: si el docente no escanea dentro del tiempo de la clase → TIMEOUT (spec: 5 min)
const TIEMPO_ESPERA_CONFIRMACION_MS = 5 * 60 * 1000;

// ─── CU10: Transmitir Presencia (lado estudiante) ───

// Fecha y hora exacta para la tarjeta de confirmación (spec: '08/09/2026 - 07:42:15 AM')
function fechaHoraConfirmacion(): string {
    const ahora = new Date();
    const dia = String(ahora.getDate()).padStart(2, '0');
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    const anio = ahora.getFullYear();
    const hora = ahora.getHours();
    const esPm = hora >= 12;
    const h12 = hora % 12 || 12;
    const mm = String(ahora.getMinutes()).padStart(2, '0');
    const ss = String(ahora.getSeconds()).padStart(2, '0');
    return `${dia}/${mes}/${anio} - ${h12}:${mm}:${ss} ${esPm ? 'PM' : 'AM'}`;
}

export interface RespuestaUseTransmision {
    grupo: DGrupo | null;
    perfil: DPerfil | null;
    uuidDispositivo: string;
    paso: PasoTransmision;
    confirmationData: DatosConfirmacion | null;
    isBluetoothOn: boolean | null;
    // Devuelve false si faltan permisos de emisión (el orquestador muestra el aviso)
    iniciarTransmision: () => Promise<boolean>;
    detenerTransmision: () => void;
    reintentar: () => void;
}

export function useTransmision(idGrupo: number | null): RespuestaUseTransmision {
    const grupo = idGrupo != null ? DGrupo.obtenerGrupoPorId(idGrupo) : null;
    const perfil = DPerfil.obtenerPerfil();
    const registroEstudiante = perfil?.registro ?? '';
    const uuidDispositivo = new DDispositivo().uuid;
    const registroNumerico = Number(registroEstudiante);

    const [paso, setPaso] = useState<PasoTransmision>('READY');
    const [confirmationData, setConfirmationData] = useState<DatosConfirmacion | null>(null);
    const [bluetoothEncendido, setBluetoothEncendido] = useState<boolean | null>(null);

    // El paso y el fin de actividad se leen desde los refs (los callbacks de radio
    // y los temporizadores no deben depender del último render)
    const pasoRef = useRef(paso);
    useEffect(() => {
        pasoRef.current = paso;
    }, [paso]);
    const actividadTerminada = useRef(false);
    const arrancado = useRef(false);
    const emitiendoPulso = useRef(false);
    const temporizadorPulso = useRef<ReturnType<typeof setTimeout> | null>(null);
    const temporizadorEspera = useRef<ReturnType<typeof setTimeout> | null>(null);
    const detenerEscucha = useRef<(() => void) | null>(null);

    // Detiene emisión, escaneo y temporizadores; deja el hook en un estado inerte
    const pararActividad = useCallback(() => {
        actividadTerminada.current = true;
        arrancado.current = false;
        if (temporizadorPulso.current != null) {
            clearTimeout(temporizadorPulso.current);
            temporizadorPulso.current = null;
        }
        if (temporizadorEspera.current != null) {
            clearTimeout(temporizadorEspera.current);
            temporizadorEspera.current = null;
        }
        detenerEscucha.current?.();
        detenerEscucha.current = null;
        void detenerEmision();
    }, []);

    // El docente envió el ACK (eco de nuestro uuid) → asistencia confirmada (CU10 paso 7)
    const confirmarPresencia = useCallback(
        (idSesion: number | undefined, rssi: number) => {
            if (actividadTerminada.current) return;
            pararActividad();
            Vibration.vibrate();
            // Guarda la marcación local (CU10 paso 8). El ACK trae el idSesion; el
            // registro del docente es la fuente de la verdad y este respaldo es local.
            if (idSesion != null && idGrupo != null) {
                try {
                    DAsistencia.guardarMarcacionEstudiante(
                        idSesion,
                        idGrupo,
                        registroEstudiante,
                        rssi,
                    );
                } catch (error) {
                    console.warn(
                        '[NAsistencia] No se pudo guardar la marcación local: ' + String(error),
                    );
                }
            }
            const espejo = idSesion != null ? DSesion.obtenerSesionPorId(idSesion) : null;
            setConfirmationData({
                idSesion: idSesion ?? 0,
                fechaHora: fechaHoraConfirmacion(),
                sesionNombre: espejo?.nombre ?? 'Clase',
            });
            setPaso('CONFIRMED');
        },
        [idGrupo, registroEstudiante, pararActividad],
    );

    // Solo responde al ACK del docente dirigido a NUESTRO uuid con resultado ACEPTADO
    const alRecibir = useCallback(
        (canal: CanalBLE, rssi: number) => {
            if (canal.canal !== 'RESPUESTA') return;
            if (canal.uuid.toLowerCase() !== uuidDispositivo.toLowerCase()) return;
            if (!canal.aceptado) return;
            confirmarPresencia(canal.idSesion, rssi);
        },
        [uuidDispositivo, confirmarPresencia],
    );

    // El pulso de identidad falló: Bluetooth apagado o hardware sin modo emisor BLE.
    // Se distingue releyendo el estado real del adaptador (diseno-ble.md, ADR-017).
    const declararFallaEmision = useCallback(async () => {
        pararActividad();
        const encendido = await obtenerEstadoBluetooth();
        setPaso(encendido === false ? 'BT_OFF' : 'NOT_SUPPORTED');
    }, [pararActividad]);

    // Un pulso: anuncia un solo IDENTIDAD, lo mantiene un hold y guarda silencio para
    // escuchar el ACK; se repite cada VENTANA_ESCUCHA_ACK_MS (ráfagas, diseno-ble.md).
    // La re-colación usa un ref (latest-ref) para evitar la auto-referencia en la
    // dependencia del propio useCallback.
    const emitirPulsoRef = useRef<() => Promise<void>>(async () => undefined);
    const emitirPulso = useCallback(async () => {
        if (actividadTerminada.current || emitiendoPulso.current) return;
        emitiendoPulso.current = true;
        const emitida = await emitirCanal({
            canal: 'IDENTIDAD',
            uuid: uuidDispositivo,
            registro: registroNumerico,
        });
        if (!emitida && pasoRef.current === 'TRANSMITTING') {
            await declararFallaEmision();
            return;
        }
        await new Promise<void>((resolver) => setTimeout(resolver, HOLD_IDENTIDAD_MS));
        await detenerEmision();
        emitiendoPulso.current = false;
        if (!actividadTerminada.current && pasoRef.current === 'TRANSMITTING') {
            temporizadorPulso.current = setTimeout(
                () => void emitirPulsoRef.current(),
                VENTANA_ESCUCHA_ACK_MS,
            );
        }
    }, [registroNumerico, uuidDispositivo, declararFallaEmision]);
    useEffect(() => {
        emitirPulsoRef.current = emitirPulso;
    }, [emitirPulso]);

    // Arranca el ciclo: escáner (para oír el ACK) + emisión por ráfagas + timeout
    const iniciarPulso = useCallback(() => {
        if (arrancado.current) return;
        arrancado.current = true;
        actividadTerminada.current = false;
        setConfirmationData(null);
        setPaso('TRANSMITTING');
        detenerEscucha.current?.();
        detenerEscucha.current = escanearBle(alRecibir);
        temporizadorEspera.current = setTimeout(() => {
            pararActividad();
            setPaso('TIMEOUT');
        }, TIEMPO_ESPERA_CONFIRMACION_MS);
        void emitirPulso();
    }, [alRecibir, emitirPulso, pararActividad]);

    const iniciarTransmision = useCallback(async (): Promise<boolean> => {
        // Sin BLUETOOTH_ADVERTISE la identidad se lanzaría "en falso": el orquestador avisa
        if (!(await permisosBluetoothBLE())) return false;
        // Bluetooth apagado confirmado → pantalla BT_OFF antes de arrancar (spec CU10)
        const encendido = await obtenerEstadoBluetooth();
        if (encendido === false) {
            setPaso('BT_OFF');
            return true;
        }
        iniciarPulso();
        return true;
    }, [iniciarPulso]);

    const detenerTransmision = useCallback(() => {
        pararActividad();
        setConfirmationData(null);
        setPaso('READY');
    }, [pararActividad]);

    const reintentar = useCallback(() => {
        pararActividad();
        setConfirmationData(null);
        setPaso('READY');
    }, [pararActividad]);

    // Estado del Bluetooth en vivo (null = aún se está verificando)
    useEffect(() => {
        obtenerEstadoBluetooth().then(setBluetoothEncendido);
        return escucharEstadoBluetooth(setBluetoothEncendido);
    }, []);

    // Al salir de la pantalla se apaga la antena: nada queda transmitiendo en segundo plano
    useEffect(() => {
        return () => {
            pararActividad();
        };
    }, [pararActividad]);

    return {
        grupo,
        perfil,
        uuidDispositivo,
        paso,
        confirmationData,
        isBluetoothOn: bluetoothEncendido,
        iniciarTransmision,
        detenerTransmision,
        reintentar,
    };
}
