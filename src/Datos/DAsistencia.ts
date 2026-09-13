// Tabla asistencia: la marcación de un alumno en una sesión (CU10 y CU11).
// Nace con CU10 (el estudiante guarda su marcación local tras el ACK) y CU11
// (el docente escanea y registra). CU12 reusa el marcaje manual; CU13/CU14
// agregan las consultas (historial por alumno, matriz por alumno y reporte).
// ADR-014: la clase declara sus atributos (espejo de la tabla) y los métodos son static.

import { baseDatos } from '@/Datos/DConexion';

// El estado de la marcación (columna estado de la tabla asistencia)
export type EstadoAsistencia = 'PRESENTE' | 'AUSENTE' | 'LICENCIA';
// Cómo se tomó la marcación (columna metodo de la tabla asistencia)
export type MetodoAsistencia = 'BLE_AUTOMATICO' | 'MANUAL';

// Una marcación tal como se lee de la BD: el JOIN con estudiante trae la identidad
// del alumno (la usan CU11 para recargar la lista y CU12/CU13 para el historial)
export interface AsistenciaRegistrada {
    idSesion: number;
    idEstudiante: number;
    estado: EstadoAsistencia;
    metodo: MetodoAsistencia;
    rssi: number | null;
    fechaHora: string | null;
    registro: string;
    nombre: string;
    apellidoPaterno: string | null;
    apellidoMaterno: string | null;
}

export class DAsistencia {
    // Atributos: espejo de la tabla asistencia (PK compuesta: id_sesion + id_estudiante)
    idSesion: number = 0;
    idEstudiante: number = 0;
    estado: EstadoAsistencia = 'AUSENTE';
    metodo: MetodoAsistencia = 'BLE_AUTOMATICO';
    rssi: number | null = null;
    fechaHora: string | null = null;

    // El id numérico del estudiante por su registro (asistencia referencia id, no registro)
    private static idDelRegistro(registro: string): number | null {
        const resultado = baseDatos.executeSync('SELECT id FROM estudiante WHERE registro = ?;', [
            registro,
        ]);
        const filas = resultado.rows as Record<string, unknown>[];
        return filas.length > 0 ? Number(filas[0].id) : null;
    }

    // Registra la asistencia de un alumno en una sesión. El id es el de la sesión
    // del docente (CU11) o el espejo local del estudiante (CU10); si ya había una
    // marcación para (id_sesion, id_estudiante) la actualiza (sin candado, ADR-008).
    static marcarAsistencia(
        idSesion: number,
        registro: string,
        estado: EstadoAsistencia,
        metodo: MetodoAsistencia,
        rssi?: number,
    ): void {
        const idEstudiante = this.idDelRegistro(registro);
        if (idEstudiante == null) return;
        baseDatos.executeSync(
            `INSERT INTO asistencia (id_sesion, id_estudiante, estado, metodo, rssi)
             VALUES (?, ?, ?, ?, ?)
             ON CONFLICT(id_sesion, id_estudiante) DO UPDATE SET
               estado = excluded.estado,
               metodo = excluded.metodo,
               rssi = coalesce(excluded.rssi, asistencia.rssi),
               fecha_hora = datetime('now', 'localtime');`,
            [idSesion, idEstudiante, estado, metodo, rssi ?? null],
        );
    }

    // Lista las marcaciones de una sesión con los datos del alumno (más recientes primero)
    static listarAsistenciaDeSesion(idSesion: number): AsistenciaRegistrada[] {
        const resultado = baseDatos.executeSync(
            `SELECT a.id_sesion, a.id_estudiante, a.estado, a.metodo, a.rssi, a.fecha_hora,
                     e.registro, e.nombre, e.apellido_paterno, e.apellido_materno
               FROM asistencia a
               JOIN estudiante e ON e.id = a.id_estudiante
              WHERE a.id_sesion = ?
               ORDER BY a.fecha_hora DESC, a.rowid DESC;`,
            [idSesion],
        );
        return (resultado.rows as Record<string, unknown>[]).map((fila) => ({
            idSesion: Number(fila.id_sesion),
            idEstudiante: Number(fila.id_estudiante),
            estado:
                fila.estado === 'AUSENTE'
                    ? 'AUSENTE'
                    : fila.estado === 'LICENCIA'
                      ? 'LICENCIA'
                      : 'PRESENTE',
            metodo: fila.metodo === 'MANUAL' ? 'MANUAL' : 'BLE_AUTOMATICO',
            rssi: fila.rssi != null ? Number(fila.rssi) : null,
            fechaHora: fila.fecha_hora ? String(fila.fecha_hora) : null,
            registro: String(fila.registro),
            nombre: String(fila.nombre),
            apellidoPaterno: fila.apellido_paterno != null ? String(fila.apellido_paterno) : null,
            apellidoMaterno: fila.apellido_materno != null ? String(fila.apellido_materno) : null,
        }));
    }

    // Lista las marcaciones del alumno en las sesiones del grupo en orden cronológico
    // (CU13 modo estudiante). Sin fila de asistencia la sesión cuenta como AUSENTE
    // (ausente por omisión, igual que en CU12).
    static listarAsistenciaDeEstudiante(
        registro: string,
        idGrupo: number,
    ): AsistenciaDeEstudiante[] {
        const resultado = baseDatos.executeSync(
            `SELECT s.id, s.nombre, s.fecha_hora AS fecha_sesion, a.estado,
                    a.fecha_hora AS fecha_marcacion
               FROM sesion s
               LEFT JOIN asistencia a
                 ON a.id_sesion = s.id
                AND a.id_estudiante = (SELECT id FROM estudiante WHERE registro = ?)
              WHERE s.id_grupo = ?
              ORDER BY s.fecha_hora ASC, s.id ASC;`,
            [registro, idGrupo],
        );
        return (resultado.rows as Record<string, unknown>[]).map((fila) => ({
            idSesion: Number(fila.id),
            nombreSesion: String(fila.nombre),
            fechaHoraSesion: fila.fecha_sesion ? String(fila.fecha_sesion) : null,
            estado: fila.estado === 'PRESENTE' ? 'PRESENTE' : fila.estado === 'LICENCIA' ? 'LICENCIA' : 'AUSENTE',
            fechaHoraMarcacion: fila.fecha_marcacion ? String(fila.fecha_marcacion) : null,
        }));
    }

    // Resume la nómina del grupo con conteos por alumno (CU13 modo docente).
    // ausentes = sesiones del grupo − presentes − licencias (la omisión es ausencia).
    static resumenPorAlumno(idGrupo: number): ResumenAlumno[] {
        const resultado = baseDatos.executeSync(
            `SELECT e.registro, e.nombre, e.apellido_paterno, e.apellido_materno,
                    COALESCE(SUM(CASE WHEN a.estado = 'PRESENTE' THEN 1 ELSE 0 END), 0) AS presentes,
                    COALESCE(SUM(CASE WHEN a.estado = 'LICENCIA' THEN 1 ELSE 0 END), 0) AS licencias,
                    (SELECT COUNT(*) FROM sesion WHERE id_grupo = ?) AS sesiones
               FROM grupo_estudiante ge
               JOIN estudiante e ON e.id = ge.id_estudiante
               LEFT JOIN sesion s ON s.id_grupo = ge.id_grupo
               LEFT JOIN asistencia a ON a.id_sesion = s.id AND a.id_estudiante = e.id
              WHERE ge.id_grupo = ? AND ge.estado_vinculacion != 'CANCELADO'
              GROUP BY e.id
              ORDER BY e.apellido_paterno, e.nombre;`,
            [idGrupo, idGrupo],
        );
        return (resultado.rows as Record<string, unknown>[]).map((fila) => {
            const sesiones = Number(fila.sesiones);
            const presentes = Number(fila.presentes);
            const licencias = Number(fila.licencias);
            const ausentes = Math.max(0, sesiones - presentes - licencias);
            return {
                registro: String(fila.registro),
                nombre: String(fila.nombre),
                apellidoPaterno: fila.apellido_paterno != null ? String(fila.apellido_paterno) : null,
                apellidoMaterno: fila.apellido_materno != null ? String(fila.apellido_materno) : null,
                sesiones,
                presentes,
                ausentes,
                licencias,
                porcentaje: sesiones > 0 ? Math.round((presentes * 100) / sesiones) : 0,
            };
        });
    }

    // Arma la matriz del reporte (CU14): sesiones del grupo en el rango con la marca
    // de cada alumno (P/A/L) alineada por índice. Sin fila cuenta como 'A'.
    static exportarReporte(idGrupo: number, rango: RangoFechas): MatrizReporte {
        let consultaSesiones = 'SELECT id, nombre, fecha_hora FROM sesion WHERE id_grupo = ?';
        const parametros: (number | string)[] = [idGrupo];
        if (rango.tipo === 'CUSTOM') {
            if (rango.inicio != null) {
                consultaSesiones += ' AND date(fecha_hora) >= date(?)';
                parametros.push(rango.inicio);
            }
            if (rango.fin != null) {
                consultaSesiones += ' AND date(fecha_hora) <= date(?)';
                parametros.push(rango.fin);
            }
        }
        consultaSesiones += ' ORDER BY fecha_hora ASC, id ASC;';
        const sesionesFilas = baseDatos.executeSync(consultaSesiones, parametros)
            .rows as Record<string, unknown>[];
        const sesiones: SesionReporte[] = sesionesFilas.map((fila) => ({
            id: Number(fila.id),
            nombre: String(fila.nombre),
            fechaHora: fila.fecha_hora ? String(fila.fecha_hora) : null,
        }));
        const nomina = baseDatos.executeSync(
            `SELECT e.registro, e.nombre, e.apellido_paterno, e.apellido_materno
               FROM grupo_estudiante ge
               JOIN estudiante e ON e.id = ge.id_estudiante
              WHERE ge.id_grupo = ? AND ge.estado_vinculacion != 'CANCELADO'
              ORDER BY e.apellido_paterno, e.nombre;`,
            [idGrupo],
        ).rows as Record<string, unknown>[];
        const marcas = new Map<string, EstadoAsistencia>();
        if (sesiones.length > 0 && nomina.length > 0) {
            const idsSesion = sesiones.map((s) => s.id).join(',');
            const marcaciones = baseDatos.executeSync(
                `SELECT a.id_sesion, e.registro, a.estado
                   FROM asistencia a
                   JOIN estudiante e ON e.id = a.id_estudiante
                  WHERE a.id_sesion IN (${idsSesion});`,
            ).rows as Record<string, unknown>[];
            for (const fila of marcaciones) {
                marcas.set(
                    `${Number(fila.id_sesion)}|${String(fila.registro)}`,
                    fila.estado === 'PRESENTE'
                        ? 'PRESENTE'
                        : fila.estado === 'LICENCIA'
                          ? 'LICENCIA'
                          : 'AUSENTE',
                );
            }
        }
        const filas: FilaReporte[] = nomina.map((alumno) => {
            const registro = String(alumno.registro);
            const nombre = `${String(alumno.nombre)} ${alumno.apellido_paterno != null ? String(alumno.apellido_paterno) : ''} ${alumno.apellido_materno != null ? String(alumno.apellido_materno) : ''}`
                .replace(/\s+/g, ' ')
                .trim();
            return {
                registro,
                nombre,
                marcas: sesiones.map((s) => {
                    const estado = marcas.get(`${s.id}|${registro}`) ?? 'AUSENTE';
                    return estado === 'PRESENTE' ? 'P' : estado === 'LICENCIA' ? 'L' : 'A';
                }),
            };
        });
        return { sesiones, filas };
    }

    // Guarda en el teléfono del ESTUDIANTE la marcación confirmada por el docente (CU10).
    // El ACK solo trae el idSesion; el estudiante no tiene esa sesión en su tabla, así que
    // se crea un espejo mínimo de la sesión (el título real del docente no viaja por BLE)
    // para que la llave foránea de asistencia(id_sesion) no falle. Todo va en transacción.
    static guardarMarcacionEstudiante(
        idSesion: number,
        idGrupo: number,
        registro: string,
        rssi?: number,
    ): void {
        baseDatos.executeSync('BEGIN TRANSACTION;');
        try {
            baseDatos.executeSync(
                `INSERT OR IGNORE INTO sesion (id, id_grupo, nombre, estado)
                 VALUES (?, ?, 'Clase', 'CERRADA');`,
                [idSesion, idGrupo],
            );
            this.marcarAsistencia(idSesion, registro, 'PRESENTE', 'BLE_AUTOMATICO', rssi);
            baseDatos.executeSync('COMMIT;');
        } catch (error) {
            baseDatos.executeSync('ROLLBACK;');
            throw error;
        }
    }
}

// Rango de fechas del reporte (CU14): todo el semestre o tramo manual 'YYYY-MM-DD'
export interface RangoFechas {
    tipo: 'SEMESTRE' | 'CUSTOM';
    inicio: string | null;
    fin: string | null;
}

// Resumen de un alumno en el grupo (CU13 modo docente)
export interface ResumenAlumno {
    registro: string;
    nombre: string;
    apellidoPaterno: string | null;
    apellidoMaterno: string | null;
    sesiones: number;
    presentes: number;
    ausentes: number;
    licencias: number;
    porcentaje: number;
}

// Una marcación del alumno en una sesión del grupo (CU13 modo estudiante)
export interface AsistenciaDeEstudiante {
    idSesion: number;
    nombreSesion: string;
    fechaHoraSesion: string | null;
    estado: EstadoAsistencia;
    fechaHoraMarcacion: string | null;
}

// Una sesión como columna del reporte (CU14)
export interface SesionReporte {
    id: number;
    nombre: string;
    fechaHora: string | null;
}

// Una fila de la matriz del reporte (CU14): marcas P/A/L alineadas con las sesiones
export interface FilaReporte {
    registro: string;
    nombre: string;
    marcas: ('P' | 'A' | 'L')[];
}

// La matriz completa del reporte (CU14)
export interface MatrizReporte {
    sesiones: SesionReporte[];
    filas: FilaReporte[];
}
