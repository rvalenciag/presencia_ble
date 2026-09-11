// Tema: vinculación del dispositivo del estudiante (CU06, lado estudiante).
// El estudiante ESCUCHA las materias que anuncian los docentes (MATERIA/META), y al
// presionar una tarjeta EMITE su identidad [uuid del teléfono + registro] y espera la
// RESPUESTA del docente; con ACEPTADO guarda la materia (vincularMateria) para que
// aparezca en CU07; si el docente responde RECHAZADO o no responde a tiempo, la vista
// muestra el rechazo con la opción de reintentar.
// ADR-014: los tipos de la vinculación se toman aquí (versión publicada de Datos).

import { useCallback, useEffect, useRef, useState } from 'react';

import { DPerfil } from '@/Datos/DPerfil';
import { DDispositivo } from '@/Datos/DDispositivo';
import { DGrupoEstudiante } from '@/Datos/DGrupoEstudiante';
import type { MateriaDetectada, RespuestaVinculacion } from '@/Datos/DGrupoEstudiante';

import {
    emitirCanal,
    iniciarEscaneo,
    detenerEmision,
    permisosBluetoothBLE,
} from '@/Negocio/Servicio/BluetoothServicio';
import type { CanalBLE } from '@/Negocio/Servicio/BluetoothServicio';

// Tipos que las vistas de CU06 importan desde Negocio
export type { DPerfil } from '@/Datos/DPerfil';
export type { MateriaDetectada, RespuestaVinculacion } from '@/Datos/DGrupoEstudiante';

// Después de anunciar la identidad, el teléfono queda este tiempo en modo solo
// escucha. Android no mantiene el escáner de forma fiable mientras anuncia; una
// ventana explícita evita perder el ACEPTADO que acaba de emitir el docente.
const VENTANA_ESCUCHA_RESPUESTA_MS = 1500;
// Cuánto se mantiene anunciando cada identidad: luego se deja de anunciar para que
// el escáner atrape la RESPUESTA del docente (anunciar y escanear a la vez no es
// efectivo en BLE, ver diseno-ble.md).
const HOLD_IDENTIDAD_MS = 350;
// Cuánto espera respuesta antes de declarar el rechazo por tiempo
const TIEMPO_ESPERA_RESPUESTA_MS = 20000;

// Lo que devuelve el hook useVinculacion (CU06)
export interface RespuestaUseVinculacion {
    perfil: DPerfil | null;
    materiasDetectadas: MateriaDetectada[];
    seleccionarMateria: (materia: MateriaDetectada) => Promise<boolean>;
    respuesta: RespuestaVinculacion;
    motivoRechazo?: string;
    reintentar: () => void;
}

// Los datos de la materia tal como se guardan en la tabla grupo
interface MateriaLocal {
    id: number;
    nombre: string;
    extension: string | null;
    semestre: string | null;
    anio: number | null;
}

export function useVinculacion(): RespuestaUseVinculacion {
    const perfil = DPerfil.obtenerPerfil();
    const uuidDispositivo = new DDispositivo().uuid;
    const registroEstudiante = perfil?.registro ?? '';

    const [materiasDetectadas, setMateriasDetectadas] = useState<MateriaDetectada[]>([]);
    const [respuesta, setRespuesta] = useState<RespuestaVinculacion>(null);
    const [motivoRechazo, setMotivoRechazo] = useState<string | undefined>(undefined);

    // Tarjetas y metadatos armados por grupo (id del docente)
    const tarjetas = useRef<Map<string, MateriaDetectada>>(new Map());
    const materiasLocales = useRef<Map<string, MateriaLocal>>(new Map());
    // Chunks META recibidos por grupo (índice → texto) + el índice del último
    const chunksPorGrupo = useRef<Map<string, (string | null)[]>>(new Map());
    const ultimosChunks = useRef<Map<string, number>>(new Map());

    // Emparejamiento en curso: temporizadores, destino y bandera de respuesta ya entregada
    const temporizadorEmision = useRef<ReturnType<typeof setInterval> | null>(null);
    const temporizadorRespuesta = useRef<ReturnType<typeof setTimeout> | null>(null);
    const destinoEmparejamiento = useRef<string | null>(null);
    const respuestaEntregada = useRef(false);
    const emitiendoIdentidad = useRef(false);

    // Guarda la materia local cuando llega el ACEPTADO (para que CU07 la muestre)
    const aplicarMateria = useCallback(() => {
        const idGrupo = destinoEmparejamiento.current;
        if (idGrupo == null || registroEstudiante === '') return;
        const local =
            materiasLocales.current.get(idGrupo) ??
            (() => {
                // Respaldo: aún no se armó el META; usamos lo que la tarjeta ya muestra
                const tarjeta = tarjetas.current.get(idGrupo);
                return tarjeta
                    ? {
                          id: Number(tarjeta.id),
                          nombre: tarjeta.nombre,
                          extension: tarjeta.sigla !== '' ? tarjeta.sigla : null,
                          semestre: null,
                          anio: null,
                      }
                    : undefined;
            })();
        if (local) DGrupoEstudiante.vincularMateria(local, registroEstudiante);
    }, [registroEstudiante]);

    // Refresca el estado de las tarjetas desde el mapa (los renglones de la lista)
    const publicarTarjetas = useCallback(() => {
        setMateriasDetectadas(Array.from(tarjetas.current.values()));
    }, []);

    // El nombre a mostrar: el ya armado por los chunks, o "…" mientras se arma
    const nombreVisibleDe = useCallback((idGrupo: string): string => {
        return materiasLocales.current.get(idGrupo)?.nombre ?? 'Detectando materia…';
    }, []);

    // Toca la tarjeta de un grupo: la crea o actualiza su nombre/señal y publica la lista
    const tocarTarjeta = useCallback(
        (idGrupo: number, rssi: number) => {
            const id = String(idGrupo);
            const existente = tarjetas.current.get(id);
            const local = materiasLocales.current.get(id);
            tarjetas.current.set(id, {
                id,
                nombre: existente?.nombre ?? nombreVisibleDe(id),
                sigla: existente?.sigla ?? local?.extension ?? '',
                docente: null, // ADR-007: el docente solo se muestra, no se guarda
                rssi,
            });
            publicarTarjetas();
        },
        [nombreVisibleDe, publicarTarjetas],
    );

    // Entrega el resultado del emparejamiento y limpia la emisión en curso
    const entregarResultado = useCallback(
        (aceptada: boolean, motivo?: string) => {
            if (respuestaEntregada.current) return;
            respuestaEntregada.current = true;
            if (temporizadorEmision.current != null) {
                clearInterval(temporizadorEmision.current);
                temporizadorEmision.current = null;
            }
            if (temporizadorRespuesta.current != null) {
                clearTimeout(temporizadorRespuesta.current);
                temporizadorRespuesta.current = null;
            }
            if (aceptada) {
                aplicarMateria();
                setRespuesta('ACEPTADO');
                setMotivoRechazo(undefined);
            } else {
                setRespuesta('RECHAZADO');
                setMotivoRechazo(motivo);
            }
            void detenerEmision();
        },
        [aplicarMateria],
    );

    // Atiende los canales del docente (MATERIA/META) y las respuestas a nuestra identidad
    const alRecibir = useCallback(
        (canal: CanalBLE, rssi: number) => {
            if (canal.canal === 'MATERIA') {
                tocarTarjeta(canal.idGrupo, rssi);
                return;
            }
            if (canal.canal === 'META') {
                const id = String(canal.idGrupo);
                const chunks = chunksPorGrupo.current.get(id) ?? [];
                chunks[canal.indice] = canal.texto;
                chunksPorGrupo.current.set(id, chunks);
                if (canal.ultimo) ultimosChunks.current.set(id, canal.indice);

                // ¿Ya están todos los chunks? Entonces arma nombre|extension|semestre|anio
                const ultimoIndice = ultimosChunks.current.get(id);
                if (
                    ultimoIndice !== undefined &&
                    chunks.slice(0, ultimoIndice + 1).every((trozo) => trozo != null)
                ) {
                    const partes = chunks
                        .slice(0, ultimoIndice + 1)
                        .join('')
                        .split('|');
                    const [nombre, extension = '', semestre = '', anio = ''] = partes;
                    materiasLocales.current.set(id, {
                        id: canal.idGrupo,
                        nombre,
                        extension: extension !== '' ? extension : null,
                        semestre: semestre !== '' ? semestre : null,
                        anio: anio !== '' ? Number(anio) : null,
                    });
                }
                tocarTarjeta(canal.idGrupo, rssi);
                return;
            }
            // El docente solo responde a nuestro uuid (nuestra identidad)
            if (canal.canal === 'RESPUESTA' && respuestaEntregada.current === false) {
                if (canal.uuid.toLowerCase() !== uuidDispositivo.toLowerCase()) return;
                entregarResultado(canal.aceptado, undefined);
            }
        },
        [tocarTarjeta, uuidDispositivo, entregarResultado],
    );

    // El radar corre mientras la pantalla está abierta (mensajes y señales en vivo)
    useEffect(() => {
        const detenerEscucheo = iniciarEscaneo(alRecibir);
        return () => {
            detenerEscucheo();
            if (temporizadorEmision.current != null) clearInterval(temporizadorEmision.current);
            if (temporizadorRespuesta.current != null) clearTimeout(temporizadorRespuesta.current);
            void detenerEmision();
        };
    }, [alRecibir]);

    // Empieza la emisión de la identidad y espera la respuesta del docente (CU06 paso 2).
    // Devuelve false si faltan permisos de emisión (la vista avisa y no entra al paso
    // PAIRING): sin BLUETOOTH_ADVERTISE la identidad se lanzaría "en falso".
    const seleccionarMateria = useCallback(
        async (materia: MateriaDetectada): Promise<boolean> => {
            if (!/^[1-9]\d{0,8}$/.test(registroEstudiante)) {
                // No se emite un paquete que BluetoothServicio descartaría en el docente.
                // Se entrega un rechazo claro en la vista en vez de aparentar que
                // falló la radio o los permisos.
                respuestaEntregada.current = true;
                setMotivoRechazo(
                    'Tu Registro Universitario debe tener entre 1 y 9 dígitos para vincularse por Bluetooth.',
                );
                setRespuesta('RECHAZADO');
                return true;
            }
            if (!(await permisosBluetoothBLE())) return false;
            void detenerEmision();
            respuestaEntregada.current = false;
            destinoEmparejamiento.current = materia.id;
            setRespuesta(null);
            setMotivoRechazo(undefined);

            // Turno de radio del estudiante: anuncia una sola identidad y queda en
            // silencio. El escáner se mantiene abierto durante toda la pantalla;
            // reiniciarlo por cada pulso excede el límite de Android.
            const emitirIdentidad = () => {
                void (async () => {
                    if (respuestaEntregada.current || emitiendoIdentidad.current) return;
                    emitiendoIdentidad.current = true;
                    const emitida = await emitirCanal({
                        canal: 'IDENTIDAD',
                        uuid: uuidDispositivo,
                        registro: Number(registroEstudiante),
                    });
                    // Diagnóstico temporal: confirma si la app del estudiante sí
                    // logra anunciar su identidad (emitida=false → permiso o error)
                    if (!emitida) {
                        console.warn(
                            'No se pudo emitir la identidad (registro ' +
                                registroEstudiante +
                                ')',
                        );
                    }
                    await new Promise<void>((resolver) => setTimeout(resolver, HOLD_IDENTIDAD_MS));
                    await detenerEmision();
                    emitiendoIdentidad.current = false;
                    if (!respuestaEntregada.current) {
                        temporizadorEmision.current = setTimeout(
                            emitirIdentidad,
                            VENTANA_ESCUCHA_RESPUESTA_MS,
                        );
                    }
                })();
            };
            emitirIdentidad();

            // Sin respuesta a tiempo → rechazo (el docente ignora lo que no está en la nómina)
            temporizadorRespuesta.current = setTimeout(() => {
                entregarResultado(
                    false,
                    'No se recibió respuesta del docente a tiempo. Intenta de nuevo o acércate más.',
                );
            }, TIEMPO_ESPERA_RESPUESTA_MS);
            return true;
        },
        [registroEstudiante, uuidDispositivo, entregarResultado],
    );

    const reintentar = useCallback(() => {
        respuestaEntregada.current = false;
        setRespuesta(null);
        setMotivoRechazo(undefined);
    }, []);

    return {
        perfil,
        materiasDetectadas,
        seleccionarMateria,
        respuesta,
        motivoRechazo,
        reintentar,
    };
}
