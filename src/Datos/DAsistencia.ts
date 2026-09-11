// Tabla asistencia: la marcación de un alumno en una sesión (CU10 y CU11).
// Nace con CU10 (el estudiante guarda su marcación local tras el ACK) y CU11
// (el docente escanea y registra). Los métodos de consulta/historial/reporte
// llegan con CU12, CU13 y CU14.
// ADR-014: la clase declara sus atributos (espejo de la tabla) y los métodos son static.

import { baseDatos } from '@/Datos/DConexion';

// El estado de la marcación (columna estado de la tabla asistencia)
export type EstadoAsistencia = 'PRESENTE' | 'AUSENTE' | 'LICENCIA';
// Cómo se tomó la marcación (columna metodo de la tabla asistencia)
export type MetodoAsistencia = 'BLE_AUTOMATICO' | 'MANUAL';

// Una marcación tal como se lee de la BD: el JOIN con estudiante trae la identidad
// del alumno (la usan CU11 para recargar la lista y CU12/CU13 para el historial)
export interface AsistenciaRegistrada {
    id: number;
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
    foto: string | null;
}

export class DAsistencia {
    // Atributos: espejo de la tabla asistencia
    id: number = 0;
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
            `SELECT a.id, a.id_sesion, a.id_estudiante, a.estado, a.metodo, a.rssi, a.fecha_hora,
                    e.registro, e.nombre, e.apellido_paterno, e.apellido_materno, e.foto
               FROM asistencia a
               JOIN estudiante e ON e.id = a.id_estudiante
              WHERE a.id_sesion = ?
              ORDER BY a.fecha_hora DESC, a.id DESC;`,
            [idSesion],
        );
        return (resultado.rows as Record<string, unknown>[]).map((fila) => ({
            id: Number(fila.id),
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
            foto: fila.foto != null ? String(fila.foto) : null,
        }));
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
