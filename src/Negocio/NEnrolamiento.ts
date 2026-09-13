// Tema: enrolamiento del estudiante al grupo por Bluetooth (CU05, lado docente).
// El docente EMITE su materia (canales MATERIA/META, ADR-016) y ESCUCHA identidades;
// por cada identidad cuyo registro esté en la nómina responde ACEPTADO y guarda el
// uuid del teléfono en la base (asignarUuidEnrolamiento); lo que no está en la nómina
// se ignora en silencio (spec CU05). El estudiante agota su tiempo de espera y la
// vista muestra RECHAZADO.
// ADR-014: los tipos de enrolamiento se toman aquí (versión publicada de Datos).

import { useCallback, useEffect, useRef, useState } from 'react';
import { Vibration } from 'react-native';

import { DGrupo } from '@/Datos/DGrupo';
import { DEstudiante } from '@/Datos/DEstudiante';
import type { AlumnoEnrolamiento } from '@/Datos/DEstudiante';

import {
    escucharEstadoBluetooth,
    obtenerEstadoBluetooth,
    emitirCanal,
    iniciarEscaneo,
    detenerEmision,
    permisosBluetoothBLE,
    chunksDeTextoMeta,
    textoMetaDeGrupo,
} from '@/Negocio/Servicio/BluetoothServicio';
import type {
    CanalBLE,
    CanalIdentidad,
    CanalMateria,
    CanalMeta,
    CanalRespuesta,
} from '@/Negocio/Servicio/BluetoothServicio';

// Tipos que las vistas de CU05 importan desde Negocio
export type { AlumnoEnrolamiento } from '@/Datos/DEstudiante';

// Cadencia del faro: cada cuánto se vuelve a anunciar la materia (MATERIA + chunks META).
// Anunciar y escanear a la vez no es efectivo en BLE: por eso se emite en RÁFAGAS y
// entre ráfagas se deja de anunciar para escuchar identidades (ver diseno-ble.md).
const FARO_INTERVALO_MS = 3000;

// RÁFAGA DEL FARO (docente): cada chunk META tiene un uuid distinto, así que un escáner
// ALL_MATCHES los atrapa a todos aunque se anuncien casi juntos. Por eso el hold entre
// canales del faro es CORTÍSIMO: la ráfaga completa dura ~300-500 ms y el docente queda
// el resto del ciclo (2.5 s) en silencio con el escáner activo para oír IDENTIDAD. Antes
// con HOLD=500 ms el faro ocupaba casi todo el ciclo y su propio escáner moría de hambre,
// que era la causa de que el IDENTIDAD del estudiante nunca llegara.
const HOLD_FARO_POR_CANAL_MS = 120;

// RESPUESTA (docente → estudiante): se emite larga porque el escáner del estudiante está
// ocupado anunciando su identidad (ráfaga de 300 ms/s) y necesita una ventana amplia para
// atrapar el canal RESPUESTA.
// La respuesta dura más que una ráfaga de identidad: el estudiante primero debe
// apagar su advertising y recrear su escáner antes de poder verla.
const HOLD_RESPUESTA_POR_CANAL_MS = 1800;

// Umbral de cercanía para aceptar una identidad (CU05, decisión del usuario): se ignora
// todo paquete con señal más débil que -60 dBm (mismo corte del spec de CU11), aunque el
// registro esté en la nómina. Evita vincular teléfonos que no están junto al docente.
const UMBRAL_RSSI_ACEPTACION_DBM = -60;

// Lo que devuelve el hook useEnrolamiento (CU05)
export interface RespuestaUseEnrolamiento {
    grupo: DGrupo | null;
    alumnos: AlumnoEnrolamiento[];
    bluetoothEncendido: boolean | null;
    iniciarEscucha: () => Promise<boolean>;
    finalizar: () => void;
}

export function useEnrolamiento(idGrupo: number | null): RespuestaUseEnrolamiento {
    const [grupo] = useState<DGrupo | null>(() =>
        idGrupo != null ? DGrupo.obtenerGrupoPorId(idGrupo) : null,
    );
    const [alumnos, setAlumnos] = useState<AlumnoEnrolamiento[]>(() =>
        idGrupo != null ? DEstudiante.listarAlumnosParaEnrolamiento(idGrupo) : [],
    );
    const [bluetoothEncendido, setBluetoothEncendido] = useState<boolean | null>(null);
    const [escuchando, setEscuchando] = useState(false);

    // La nómina vive en el closure de la escucha; se mantiene al día por ref
    const alumnosRef = useRef(alumnos);
    useEffect(() => {
        alumnosRef.current = alumnos;
    }, [alumnos]);

    // Cola de emisión turno a turno: un solo canal a la vez, en orden
    const cola = useRef<CanalBLE[]>([]);
    const procesandoCola = useRef(false);
    // Identidades ya respondidas en esta sesión (evita re-responder el mismo teléfono)
    const identidadesRespondidas = useRef<Set<string>>(new Set());
    const temporizadorFaro = useRef<ReturnType<typeof setInterval> | null>(null);
    const detenerEscucha = useRef<(() => void) | null>(null);

    // Procesa la cola: saca canales de uno en uno y los emite con una pausa entre
    // turnos para que el otro teléfono alcance a ver cada canal. En cuanto la cola
    // se vacía se DETIENE la emisión (modo "ráfaga"): mientras no haya nada que
    // anunciar el teléfono queda en silencio y su escáner atrapa los IDENTIDAD de
    // los estudiantes. Alguien puede meter un canal (p.ej. una RESPUESTA) justo al
    // drenarse la cola: la relectura con el lazo externo lo recoge sin perderlo.
    const procesarCola = useCallback(async () => {
        if (procesandoCola.current) return;
        procesandoCola.current = true;
        try {
            // La condición del lazo externo se re-checa tras emitir la cola entera:
            // una RESPUESTA encolada en el último instante no queda huérfana.
            while (true) {
                while (cola.current.length > 0) {
                    const canal = cola.current.shift();
                    if (!canal) continue;
                    await emitirCanal(canal);
                    // Pausa corta entre canales del faro (cada chunk tiene uuid distinto;
                    // el escáner ALL_MATCHES lo atrapa sin necesitar hold largo).  Para la
                    // RESPUESTA usamos el hold largo porque el estudiante tiene el escáner
                    // semi-ocupado anunciando IDENTIDAD y necesita una ventana amplia para
                    // atrapar el paquete.
                    await new Promise<void>((resolver) =>
                        setTimeout(
                            resolver,
                            canal.canal === 'RESPUESTA'
                                ? HOLD_RESPUESTA_POR_CANAL_MS
                                : HOLD_FARO_POR_CANAL_MS,
                        ),
                    );
                }
                if (cola.current.length === 0) break;
            }
        } finally {
            procesandoCola.current = false;
            // Ráfaga terminada: deja de anunciar y vuelve a escuchar (scan activo)
            void detenerEmision();
        }
    }, []);

    // Entrega una respuesta con prioridad (entra al frente de la cola)
    const responder = useCallback(
        (respuesta: CanalRespuesta) => {
            cola.current.unshift(respuesta);
            void procesarCola();
        },
        [procesarCola],
    );

    const refrescarAlumnos = useCallback(() => {
        if (idGrupo == null) return;
        setAlumnos(DEstudiante.listarAlumnosParaEnrolamiento(idGrupo));
    }, [idGrupo]);

    // Atiende una identidad: ¿está en la nómina? Sí → guardar uuid + responder ACEPTADO.
    // El estudiante repite su identidad cada segundo hasta recibir la respuesta; se
    // re-responde cada vez que llega (el paquete de RESPUESTA puede perderse en el
    // aire), pero la escritura en BD y la vibración ocurren una sola vez por sesión.
    const alRecibir = useCallback(
        (canal: CanalBLE, rssi: number) => {
            if (canal.canal !== 'IDENTIDAD') return;
            const identidad = canal as CanalIdentidad;
            // Estudiante que no está junto al docente (señal débil): se ignora en silencio
            if (rssi < UMBRAL_RSSI_ACEPTACION_DBM) return;
            const alumno = alumnosRef.current.find(
                (a) => a.registro === String(identidad.registro),
            );
            if (!alumno || idGrupo == null) {
                // Fuera de nómina: se ignora en silencio (spec CU05)
                return;
            }
            if (!identidadesRespondidas.current.has(identidad.uuid)) {
                identidadesRespondidas.current.add(identidad.uuid);
                DEstudiante.asignarUuidEnrolamiento(
                    idGrupo,
                    String(identidad.registro),
                    identidad.uuid,
                );
                Vibration.vibrate();
                refrescarAlumnos();
            }
            responder({ canal: 'RESPUESTA', uuid: identidad.uuid, aceptado: true });
        },
        [idGrupo, refrescarAlumnos, responder],
    );

    // Mientras la sesión esté activa: escanea identidades y anuncia la materia en faro
    useEffect(() => {
        if (!escuchando || grupo == null) return;

        const canalesDelFaro = (): (CanalMateria | CanalMeta)[] => {
            const texto = textoMetaDeGrupo(grupo);
            const chunks = chunksDeTextoMeta(texto);
            const metas = chunks.map<CanalMeta>((trozo, indice) => ({
                canal: 'META',
                idGrupo: grupo.id,
                indice,
                ultimo: indice === chunks.length - 1,
                texto: trozo,
            }));
            return [...metas, { canal: 'MATERIA', idGrupo: grupo.id }];
        };

        const anunciarFaro = () => {
            cola.current.push(...canalesDelFaro());
            void procesarCola();
        };

        // Escucha las identidades que emiten los estudiantes cercanos
        detenerEscucha.current = iniciarEscaneo(alRecibir);
        // Primer anuncio inmediato y luego el ciclo constante
        anunciarFaro();
        temporizadorFaro.current = setInterval(anunciarFaro, FARO_INTERVALO_MS);

        return () => {
            detenerEscucha.current?.();
            detenerEscucha.current = null;
            if (temporizadorFaro.current != null) {
                clearInterval(temporizadorFaro.current);
                temporizadorFaro.current = null;
            }
            cola.current = [];
            void detenerEmision();
        };
    }, [escuchando, grupo, alRecibir, procesarCola]);

    // Estado del Bluetooth en vivo (pide permisos la primera vez); null = aún se sabe
    useEffect(() => {
        obtenerEstadoBluetooth().then(setBluetoothEncendido);
        return escucharEstadoBluetooth(setBluetoothEncendido);
    }, []);

    const iniciarEscucha = useCallback(async () => {
        // Sin BLUETOOTH_ADVERTISE el faro emitiría "en falso" (SecurityException en
        // cada canal); no se arranca hasta tener el permiso concedido.
        if (!(await permisosBluetoothBLE())) return false;
        identidadesRespondidas.current.clear();
        setEscuchando(true);
        return true;
    }, []);

    const finalizar = useCallback(() => {
        setEscuchando(false);
    }, []);

    return {
        grupo,
        alumnos,
        bluetoothEncendido,
        iniciarEscucha,
        finalizar,
    };
}
