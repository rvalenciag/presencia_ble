// Tabla sesion: una clase del docente (CU09). Las asistencias de esa sesión se
// registran contra ella en la pantalla de toma de asistencia (CU10/CU11).
// ADR-014: la clase declara sus atributos y sus métodos son static.

import { baseDatos } from '@/Datos/DConexion';

export type EstadoSesion = 'ABIERTA' | 'CERRADA';

export class DSesion {
    // Atributos: espejo de la tabla sesion
    id: number = 0;
    idGrupo: number = 0;
    nombre: string = '';
    estado: EstadoSesion = 'ABIERTA';
    fechaHora: string | null = null;

    // Convierte una fila cruda de SQLite en una DSesion con sus atributos llenos
    static desdeFila(fila: Record<string, unknown>): DSesion {
        const sesion = new DSesion();
        sesion.id = Number(fila.id);
        sesion.idGrupo = Number(fila.id_grupo);
        sesion.nombre = String(fila.nombre);
        sesion.estado = (fila.estado === 'CERRADA' ? 'CERRADA' : 'ABIERTA') as EstadoSesion;
        sesion.fechaHora = fila.fecha_hora ? String(fila.fecha_hora) : null;
        return sesion;
    }

    // Lista todas las sesiones del grupo en orden cronológico inverso (más reciente primero)
    static listarSesionesDelGrupo(idGrupo: number): DSesion[] {
        const resultado = baseDatos.executeSync(
            'SELECT * FROM sesion WHERE id_grupo = ? ORDER BY fecha_hora DESC, id DESC;',
            [idGrupo],
        );
        return (resultado.rows as Record<string, unknown>[]).map(DSesion.desdeFila);
    }

    // Devuelve una sesión por su id (CU11 la resuelve para escanear; CU10 lee el
    // espejo local tras el ACK) o null si no existe
    static obtenerSesionPorId(idSesion: number): DSesion | null {
        const resultado = baseDatos.executeSync('SELECT * FROM sesion WHERE id = ?;', [idSesion]);
        const filas = resultado.rows as Record<string, unknown>[];
        return filas.length > 0 ? DSesion.desdeFila(filas[0]) : null;
    }

    // Crea una sesión con estado ABIERTA y fecha/hora automática (CU09: Abrir Sesión)
    static crearSesion(idGrupo: number, titulo: string): DSesion {
        const resultado = baseDatos.executeSync(
            `INSERT INTO sesion (id_grupo, nombre) VALUES (?, ?);`,
            [idGrupo, titulo],
        );
        const filas = baseDatos.executeSync('SELECT * FROM sesion WHERE id = ?;', [
            Number(resultado.insertId ?? 0),
        ]).rows as Record<string, unknown>[];
        return DSesion.desdeFila(filas[0]);
    }

    // Cierra una sesión activa (UPDATE estado a CERRADA)
    static cerrarSesion(idSesion: number): void {
        baseDatos.executeSync(`UPDATE sesion SET estado = 'CERRADA' WHERE id = ?;`, [idSesion]);
    }

    // Elimina una sesión y todas sus asistencias en transacción (BORRADO PERMANENTE)
    static eliminarSesion(idSesion: number): void {
        baseDatos.executeSync('BEGIN TRANSACTION;');
        try {
            baseDatos.executeSync('DELETE FROM asistencia WHERE id_sesion = ?;', [idSesion]);
            baseDatos.executeSync('DELETE FROM sesion WHERE id = ?;', [idSesion]);
            baseDatos.executeSync('COMMIT;');
        } catch (error) {
            baseDatos.executeSync('ROLLBACK;');
            throw error;
        }
    }
}
