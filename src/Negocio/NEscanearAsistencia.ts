// Tema: escanear asistencia por Bluetooth (CU11, lado docente).
// Escáner continuo; por cada IDENTIDAD con RSSI ≥ -60 y Registro+UUID de un alumno
// ENROLADO_BLE en la nómina marca en BD, vibra, muestra la tarjeta del alumno y
// responde el ACK por radio.
// ADR-014: las vistas toman sus tipos desde Negocio (nunca desde Datos).
// ADR-019: el radio vive separado por rol (este archivo = docente;
// NTransmitirPresencia = estudiante); NAsistencia queda para CU12–CU14.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Vibration } from 'react-native';

import { DAsistencia } from '@/Datos/DAsistencia';
import { DEstudiante } from '@/Datos/DEstudiante';
import type { AlumnoDeGrupo } from '@/Datos/DEstudiante';
import { DGrupo } from '@/Datos/DGrupo';
import { DSesion } from '@/Datos/DSesion';

import {
    detenerEmision,
    emitirCanal,
    escucharEstadoBluetooth,
    iniciarEscaneo as escanearBle,
    obtenerEstadoBluetooth,
    permisosBluetoothBLE,
} from '@/Negocio/Servicio/BluetoothServicio';
import type {
    CanalBLE,
    CanalIdentidad,
    CanalRespuesta,
} from '@/Negocio/Servicio/BluetoothServicio';

// Tipos que las vistas de CU11 importan desde Negocio (versión publicada de Datos)
export type {
    AsistenciaRegistrada,
    DAsistencia,
    EstadoAsistencia,
    MetodoAsistencia,
} from '@/Datos/DAsistencia';
export type { AlumnoDeGrupo } from '@/Datos/DEstudiante';
export type { DGrupo } from '@/Datos/DGrupo';
export type { DSesion, EstadoSesion } from '@/Datos/DSesion';

// Los pasos de pantalla del spec CU11 (mismos nombres que en los .md)
export type PasoEscaneo = 'READY' | 'SCANNING' | 'FINISHED' | 'PERMISSIONS_DENIED';

// Un alumno capturado durante el escaneo (lista en vivo de CU11)
export interface AlumnoDetectado {
    registro: string;
    nombre: string;
    hora: string;
    rssi: number;
    estado: 'PRESENTE';
}

// Umbral de cercanía para marcar asistencia (CU11, decisión del usuario: -60 dBm):
// todo paquete con señal más débil se descarta (mismo corte del spec y de CU05).
const UMBRAL_RSSI_ASISTENCIA_DBM = -60;

// CU11: el ACK se mantiene largo porque el escáner del estudiante está medio ocupado
// anunciando su identidad (mismo hold de la RESPUESTA del enrolamiento).
const HOLD_ACK_DOCENTE_MS = 1800;

// ─── Helpers de fecha/hora locale (los valores que guardan/leen los hooks) ───

// 'YYYY-MM-DD HH:MM:SS' del momento (mismo formato que SQLite datetime('now','localtime'))
function ahoraSqlite(): string {
    const ahora = new Date();
    const anio = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    const dia = String(ahora.getDate()).padStart(2, '0');
    const hh = String(ahora.getHours()).padStart(2, '0');
    const mm = String(ahora.getMinutes()).padStart(2, '0');
    const ss = String(ahora.getSeconds()).padStart(2, '0');
    return `${anio}-${mes}-${dia} ${hh}:${mm}:${ss}`;
}

// El nombre completo de un alumno de la nómina (nombre + apellidos, sin espacios sobrantes)
function nombreCompletoDe(alumno: {
    nombre: string;
    apellidoPaterno: string | null;
    apellidoMaterno: string | null;
}): string {
    return `${alumno.nombre} ${alumno.apellidoPaterno ?? ''} ${alumno.apellidoMaterno ?? ''}`
        .replace(/\s+/g, ' ')
        .trim();
}

// ─── CU11: Escanear Asistencia (lado docente) ───

export interface RespuestaUseEscaneoAsistencia {
    sesion: DSesion | null;
    grupo: DGrupo | null;
    inscritos: number;
    presentes: number;
    ausentes: number;
    detectedStudents: AlumnoDetectado[];
    lastDetected: AlumnoDetectado | null;
    scanningState: PasoEscaneo;
    isBluetoothOn: boolean | null;
    iniciarEscaneo: () => Promise<void>;
    detenerEscaneo: () => void;
}

export function useEscaneoAsistencia(idSesion: number | null): RespuestaUseEscaneoAsistencia {
    const sesion = useMemo(
        () => (idSesion != null ? DSesion.obtenerSesionPorId(idSesion) : null),
        [idSesion],
    );
    const grupo = useMemo(
        () => (sesion != null ? DGrupo.obtenerGrupoPorId(sesion.idGrupo) : null),
        [sesion],
    );

    const [scanningState, setScanningState] = useState<PasoEscaneo>('READY');
    const [inscritos, setInscritos] = useState(0);
    const [detectedStudents, setDetectedStudents] = useState<AlumnoDetectado[]>([]);
    const [lastDetected, setLastDetected] = useState<AlumnoDetectado | null>(null);
    const [bluetoothEncendido, setBluetoothEncendido] = useState<boolean | null>(null);

    // La nómina y los marcados viven en refs: el escáner no debe depender del render
    const nombresRef = useRef<AlumnoDeGrupo[]>([]);
    const marcadosRef = useRef<Set<string>>(new Set());
    const estadoRef = useRef<PasoEscaneo>('READY');
    const detenerEscucha = useRef<(() => void) | null>(null);
    // Cola de ACK turno a turno (el docente anuncia un solo canal a la vez, diseno-ble.md)
    const colaAcks = useRef<CanalRespuesta[]>([]);
    const procesandoAcks = useRef(false);

    useEffect(() => {
        estadoRef.current = scanningState;
    }, [scanningState]);

    // Al abrir la pantalla se carga la nómina y las marcaciones ya tomadas de la sesión
    // (así el contador y el de-dupe "siguen" donde quedaron si se reentra a la pantalla)
    useEffect(() => {
        if (sesion == null) return;
        nombresRef.current = DEstudiante.listarAlumnosDelGrupo(sesion.idGrupo);
        setInscritos(nombresRef.current.length);
        const detectadas: AlumnoDetectado[] = DAsistencia.listarAsistenciaDeSesion(sesion.id).map(
            (marcacion) => ({
                registro: marcacion.registro,
                nombre: nombreCompletoDe(marcacion),
                hora: marcacion.fechaHora ?? '',
                rssi: marcacion.rssi ?? 0,
                estado: 'PRESENTE',
            }),
        );
        marcadosRef.current = new Set(detectadas.map((d) => d.registro));
        setDetectedStudents(detectadas);
    }, [sesion]);

    // Emite los ACK encolados como ráfaga: al vaciarse la cola DETIENE la emisión y el
    // escáner vuelve a quedar libre para seguir capturando identidades
    const procesarColaAcks = useCallback(async () => {
        if (procesandoAcks.current) return;
        procesandoAcks.current = true;
        try {
            while (colaAcks.current.length > 0) {
                const canal = colaAcks.current.shift();
                if (!canal) continue;
                await emitirCanal(canal);
                await new Promise<void>((resolver) => setTimeout(resolver, HOLD_ACK_DOCENTE_MS));
            }
        } finally {
            procesandoAcks.current = false;
            void detenerEmision();
        }
    }, []);

    const encolarAck = useCallback(
        (respuesta: CanalRespuesta) => {
            colaAcks.current.push(respuesta);
            void procesarColaAcks();
        },
        [procesarColaAcks],
    );

    // Atiende cada paquete del escáner con las validaciones del spec CU11 (a→e)
    const alRecibir = useCallback(
        (canal: CanalBLE, rssi: number) => {
            if (canal.canal !== 'IDENTIDAD') return;
            if (estadoRef.current !== 'SCANNING') return;
            // a. Señal lejana (RSSI < -60 dBm): se descarta sin acción (aulas contiguas)
            if (rssi < UMBRAL_RSSI_ASISTENCIA_DBM) return;
            const identidad = canal as CanalIdentidad;
            // b. ¿Alumno inscrito en el grupo y con SU teléfono (uuid del enrolamiento)?
            const alumno = nombresRef.current.find(
                (a) =>
                    a.registro === String(identidad.registro) &&
                    a.estadoVinculacion === 'ENROLADO_BLE' &&
                    a.uuid != null &&
                    a.uuid.toLowerCase() === identidad.uuid.toLowerCase(),
            );
            if (!alumno || sesion == null) return;
            // c. Duplicado de la misma sesión → se omite en silencio (sin vibración)
            if (marcadosRef.current.has(alumno.registro)) return;
            marcadosRef.current.add(alumno.registro);
            try {
                DAsistencia.marcarAsistencia(
                    sesion.id,
                    alumno.registro,
                    'PRESENTE',
                    'BLE_AUTOMATICO',
                    rssi,
                );
            } catch (error) {
                console.warn('[NAsistencia] No se pudo marcar la asistencia: ' + String(error));
                return;
            }
            // d. Feedback háptico + tarjeta en pantalla (spec CU11)
            Vibration.vibrate();
            const detectado: AlumnoDetectado = {
                registro: alumno.registro,
                nombre: nombreCompletoDe(alumno),
                hora: ahoraSqlite(),
                rssi,
                estado: 'PRESENTE',
            };
            setDetectedStudents((previos) => [detectado, ...previos]);
            setLastDetected(detectado);
            // e. Confirma por radio (ACK): el estudiante pasa a "Asistencia Confirmada" (CU10)
            encolarAck({
                canal: 'RESPUESTA',
                uuid: identidad.uuid,
                aceptado: true,
                idSesion: sesion.id,
            });
        },
        [sesion, encolarAck],
    );

    // Verifica permisos/Bluetooth y arranca el escáner continuo de alta potencia
    const iniciarEscaneo = useCallback(async () => {
        if (sesion == null || estadoRef.current === 'SCANNING') return;
        if (!(await permisosBluetoothBLE())) {
            setScanningState('PERMISSIONS_DENIED');
            return;
        }
        const encendido = await obtenerEstadoBluetooth();
        if (encendido === false) {
            setScanningState('PERMISSIONS_DENIED');
            return;
        }
        setLastDetected(null);
        estadoRef.current = 'SCANNING';
        setScanningState('SCANNING');
        detenerEscucha.current?.();
        detenerEscucha.current = escanearBle(alRecibir);
    }, [sesion, alRecibir]);

    // Detiene la búsqueda y deja el resumen consolidado en la vista (spec CU11 paso 7)
    const detenerEscaneo = useCallback(() => {
        estadoRef.current = 'FINISHED';
        detenerEscucha.current?.();
        detenerEscucha.current = null;
        setLastDetected(null);
        setScanningState('FINISHED');
    }, []);

    useEffect(() => {
        obtenerEstadoBluetooth().then(setBluetoothEncendido);
        return escucharEstadoBluetooth(setBluetoothEncendido);
    }, []);

    // Al salir de la pantalla se apaga el escáner
    useEffect(() => {
        return () => {
            detenerEscucha.current?.();
        };
    }, []);

    const presentes = detectedStudents.length;

    return {
        sesion,
        grupo,
        inscritos,
        presentes,
        ausentes: inscritos - presentes,
        detectedStudents,
        lastDetected,
        scanningState,
        isBluetoothOn: bluetoothEncendido,
        iniciarEscaneo,
        detenerEscaneo,
    };
}
