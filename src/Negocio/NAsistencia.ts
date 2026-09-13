// Tema: asistencia (espejo de la tabla asistencia) — consola docente.
// CU12 (useAsistenciaManual), CU13 (useHistorial) y CU14 (useReporte) viven aquí.
// El radio vive separado por rol: NTransmitirPresencia (CU10, estudiante) y
// NEscanearAsistencia (CU11, docente).
// ADR-014: las vistas toman sus tipos desde Negocio (nunca desde Datos).

import { useCallback, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';

import { DAsistencia } from '@/Datos/DAsistencia';
import type {
    AsistenciaDeEstudiante,
    EstadoAsistencia,
    MetodoAsistencia,
    ResumenAlumno,
} from '@/Datos/DAsistencia';
import { DEstudiante } from '@/Datos/DEstudiante';
import { DGrupo } from '@/Datos/DGrupo';
import { DPerfil } from '@/Datos/DPerfil';
import type { Rol } from '@/Datos/DPerfil';
import { DSesion } from '@/Datos/DSesion';

import {
    compartirArchivo,
    escribirBase64EnDocumentos,
    escribirTextoEnDocumentos,
    tamanoKbDe,
} from '@/Negocio/Servicio/ExcelCsvServicio';

// Tipos que las vistas de CU12/CU13/CU14 importan desde Negocio (versión publicada de Datos)
export type {
    AsistenciaDeEstudiante,
    AsistenciaRegistrada,
    DAsistencia,
    EstadoAsistencia,
    FilaReporte,
    MatrizReporte,
    MetodoAsistencia,
    RangoFechas,
    ResumenAlumno,
    SesionReporte,
} from '@/Datos/DAsistencia';
export type { Rol } from '@/Datos/DPerfil';
export type { EstadoSesion } from '@/Datos/DSesion';

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

// ─── CU12: Asistencia Manual (lado docente) ───

// Un alumno de la lista consolidada con su estado en la sesión
export interface AlumnoConEstado {
    registro: string;
    nombre: string;
    estado: EstadoAsistencia;
    metodo: MetodoAsistencia;
}

export interface RespuestaUseAsistenciaManual {
    sesion: DSesion | null;
    grupo: DGrupo | null;
    alumnos: AlumnoConEstado[];
    presentes: number;
    ausentes: number;
    licencias: number;
    // Cambia el estado con metodo='MANUAL' (sin candado — ADR-008, cualquier sesión).
    // Devuelve null si guardó, o el mensaje de error para la alerta.
    cambiarEstado: (registro: string, estado: EstadoAsistencia) => string | null;
}

export function useAsistenciaManual(idSesion: number | null): RespuestaUseAsistenciaManual {
    const sesion = useMemo(
        () => (idSesion != null ? DSesion.obtenerSesionPorId(idSesion) : null),
        [idSesion],
    );
    const grupo = useMemo(
        () => (sesion != null ? DGrupo.obtenerGrupoPorId(sesion.idGrupo) : null),
        [sesion],
    );

    // Junta la nómina oficial con las marcaciones de la sesión; sin fila el alumno
    // cuenta como AUSENTE (ausente por omisión, spec CU12)
    const cargarAlumnos = useCallback((): AlumnoConEstado[] => {
        if (sesion == null) return [];
        const marcas = new Map(
            DAsistencia.listarAsistenciaDeSesion(sesion.id).map((m) => [
                m.registro,
                { estado: m.estado, metodo: m.metodo },
            ]),
        );
        return DEstudiante.listarAlumnosDelGrupo(sesion.idGrupo).map((alumno) => {
            const marca = marcas.get(alumno.registro);
            return {
                registro: alumno.registro,
                nombre: nombreCompletoDe(alumno),
                estado: marca?.estado ?? 'AUSENTE',
                metodo: marca?.metodo ?? 'BLE_AUTOMATICO',
            };
        });
    }, [sesion]);

    const [alumnos, setAlumnos] = useState<AlumnoConEstado[]>(() => cargarAlumnos());

    const cambiarEstado = useCallback(
        (registro: string, estado: EstadoAsistencia): string | null => {
            if (sesion == null) return 'No se pudo actualizar el estado de asistencia, intente nuevamente';
            try {
                DAsistencia.marcarAsistencia(sesion.id, registro, estado, 'MANUAL');
            } catch {
                return 'No se pudo actualizar el estado de asistencia, intente nuevamente';
            }
            setAlumnos(cargarAlumnos());
            return null;
        },
        [sesion, cargarAlumnos],
    );

    return {
        sesion,
        grupo,
        alumnos,
        presentes: alumnos.filter((a) => a.estado === 'PRESENTE').length,
        ausentes: alumnos.filter((a) => a.estado === 'AUSENTE').length,
        licencias: alumnos.filter((a) => a.estado === 'LICENCIA').length,
        cambiarEstado,
    };
}

// ─── CU13: Historial de Asistencias (ambos roles, hook único — ADR-019) ───

// El resumen del estudiante: su porcentaje y su lista cronológica de sesiones
export interface ResumenEstudiante {
    porcentaje: number;
    presentes: number;
    ausentes: number;
    licencias: number;
    lista: AsistenciaDeEstudiante[];
}

// El resumen del docente: promedio del grupo y matriz nómina×conteos
export interface ResumenDocente {
    promedio: number;
    totalSesiones: number;
    matriz: ResumenAlumno[];
}

export interface RespuestaUseHistorial {
    rol: Rol | null;
    grupo: DGrupo | null;
    estudiante: ResumenEstudiante | null;
    docente: ResumenDocente | null;
    // true si el grupo aún no tiene sesiones (vista EMPTY_STATE del spec)
    vacio: boolean;
    // Desglose individual de un alumno para la vista STUDENT_DETAIL del docente
    detalleEstudiante: (registro: string) => AsistenciaDeEstudiante[];
}

export function useHistorial(idGrupo: number | null): RespuestaUseHistorial {
    const perfil = DPerfil.obtenerPerfil();
    const rol = perfil?.rol ?? null;
    const registroEstudiante = perfil?.registro ?? '';
    const grupo = idGrupo != null ? DGrupo.obtenerGrupoPorId(idGrupo) : null;
    const totalSesiones =
        idGrupo != null ? DSesion.listarSesionesDelGrupo(idGrupo).length : 0;

    const estudiante = useMemo((): ResumenEstudiante | null => {
        if (rol !== 'ESTUDIANTE' || idGrupo == null) return null;
        const lista = DAsistencia.listarAsistenciaDeEstudiante(registroEstudiante, idGrupo);
        const presentes = lista.filter((m) => m.estado === 'PRESENTE').length;
        const licencias = lista.filter((m) => m.estado === 'LICENCIA').length;
        const ausentes = Math.max(0, lista.length - presentes - licencias);
        return {
            porcentaje: lista.length > 0 ? Math.round((presentes * 100) / lista.length) : 0,
            presentes,
            ausentes,
            licencias,
            lista,
        };
    }, [rol, idGrupo, registroEstudiante]);

    const docente = useMemo((): ResumenDocente | null => {
        if (rol !== 'DOCENTE' || idGrupo == null) return null;
        const matriz = DAsistencia.resumenPorAlumno(idGrupo);
        const promedio =
            matriz.length > 0
                ? Math.round(matriz.reduce((suma, a) => suma + a.porcentaje, 0) / matriz.length)
                : 0;
        return { promedio, totalSesiones, matriz };
    }, [rol, idGrupo, totalSesiones]);

    const detalleEstudiante = useCallback(
        (registro: string): AsistenciaDeEstudiante[] => {
            if (idGrupo == null) return [];
            return DAsistencia.listarAsistenciaDeEstudiante(registro, idGrupo);
        },
        [idGrupo],
    );

    return {
        rol,
        grupo,
        estudiante,
        docente,
        vacio: totalSesiones === 0,
        detalleEstudiante,
    };
}

// ─── CU14: Exportar Reporte (lado docente) ───

export type FormatoReporte = 'XLSX' | 'CSV';
export type TipoRango = 'SEMESTRE' | 'CUSTOM';

// Lo que elige el docente en el formulario (fechas 'YYYY-MM-DD'; la vista valida el texto)
export interface ConfigReporte {
    formato: FormatoReporte;
    rango: TipoRango;
    inicio: string | null;
    fin: string | null;
}

// El archivo generado para la ficha de éxito
export interface ArchivoGenerado {
    nombre: string;
    uri: string;
    tamanoKb: number;
}

export type ErrorReporte = 'NO_DATA' | 'ERROR_ARCHIVO';

export interface ResultadoReporte {
    archivo: ArchivoGenerado | null;
    error: ErrorReporte | null;
}

export interface RespuestaUseReporte {
    grupo: DGrupo | null;
    inscritos: number;
    totalSesiones: number;
    generarReporte: (config: ConfigReporte) => ResultadoReporte;
    compartirReporte: (uri: string, formato: FormatoReporte) => Promise<boolean>;
}

// 'YYYY-MM-DD HH:MM:SS' → 'DD/MM' (encabezado de columna del reporte)
function etiquetaFecha(fechaHora: string | null): string {
    if (!fechaHora) return '—';
    const fecha = fechaHora.split(' ')[0].split('-');
    if (fecha.length < 3) return fechaHora;
    return `${fecha[2]}/${fecha[1]}`;
}

// Nombre seguro para el archivo: solo letras y números (spec: Reporte_ProgI_SA_2026.xlsx)
function sanearParaArchivo(texto: string | null, respaldo: string): string {
    const limpio = (texto ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^A-Za-z0-9]+/g, '');
    return limpio !== '' ? limpio : respaldo;
}

const MIME_XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const MIME_CSV = 'text/csv';

export function useReporte(idGrupo: number | null): RespuestaUseReporte {
    const grupo = idGrupo != null ? DGrupo.obtenerGrupoPorId(idGrupo) : null;
    const inscritos = useMemo(
        () => (idGrupo != null ? DEstudiante.listarAlumnosDelGrupo(idGrupo).length : 0),
        [idGrupo],
    );
    const totalSesiones = useMemo(
        () => (idGrupo != null ? DSesion.listarSesionesDelGrupo(idGrupo).length : 0),
        [idGrupo],
    );

    const generarReporte = useCallback(
        (config: ConfigReporte): ResultadoReporte => {
            if (idGrupo == null || grupo == null) return { archivo: null, error: 'ERROR_ARCHIVO' };
            const matriz = DAsistencia.exportarReporte(idGrupo, {
                tipo: config.rango,
                inicio: config.inicio,
                fin: config.fin,
            });
            if (matriz.sesiones.length === 0 || matriz.filas.length === 0) {
                return { archivo: null, error: 'NO_DATA' };
            }
            const encabezado = [
                'Registro',
                'Nombre',
                ...matriz.sesiones.map((s) => etiquetaFecha(s.fechaHora)),
            ];
            const renglones = matriz.filas.map((fila) => [
                fila.registro,
                fila.nombre,
                ...fila.marcas,
            ]);
            const anio = new Date().getFullYear();
            const base = `Reporte_${sanearParaArchivo(grupo.nombre, 'Grupo')}_${sanearParaArchivo(grupo.extension, 'G')}_${anio}`;
            try {
                if (config.formato === 'CSV') {
                    const hoja = XLSX.utils.aoa_to_sheet([encabezado, ...renglones]);
                    const archivo = escribirTextoEnDocumentos(
                        `${base}.csv`,
                        XLSX.utils.sheet_to_csv(hoja),
                    );
                    return {
                        archivo: {
                            nombre: `${base}.csv`,
                            uri: archivo.uri,
                            tamanoKb: tamanoKbDe(archivo),
                        },
                        error: null,
                    };
                }
                const libro = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(
                    libro,
                    XLSX.utils.aoa_to_sheet([encabezado, ...renglones]),
                    'Asistencia',
                );
                const archivo = escribirBase64EnDocumentos(
                    `${base}.xlsx`,
                    XLSX.write(libro, { type: 'base64', bookType: 'xlsx' }),
                );
                return {
                    archivo: { nombre: `${base}.xlsx`, uri: archivo.uri, tamanoKb: tamanoKbDe(archivo) },
                    error: null,
                };
            } catch {
                return { archivo: null, error: 'ERROR_ARCHIVO' };
            }
        },
        [idGrupo, grupo],
    );

    const compartirReporte = useCallback(
        (uri: string, formato: FormatoReporte): Promise<boolean> => {
            return compartirArchivo(uri, formato === 'CSV' ? MIME_CSV : MIME_XLSX);
        },
        [],
    );

    return { grupo, inscritos, totalSesiones, generarReporte, compartirReporte };
}
