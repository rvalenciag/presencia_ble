// Tabla grupo_estudiante: la relación entre una materia y un alumno (lado estudiante,
// CU07/CU08) y los tipos de los flujos BLE de vinculación (CU05/CU06).
// Desde CU06 el estudiante guarda la materia que le confirmó el docente: crea su copia
// local en la tabla grupo y la cruza en grupo_estudiante con estado ENROLADO_BLE.
// ADR-014: la clase declara sus atributos y sus métodos tocan SQLite.

import { baseDatos } from '@/Datos/DConexion';

// El estado de la vinculación de un alumno a la materia (columna estado_vinculacion)
export type EstadoVinculacion = 'PENDIENTE' | 'ENROLADO_BLE' | 'CANCELADO';

// Un renglón de la tabla grupo_estudiante, con sus atributos
export class DGrupoEstudiante {
    // Atributos: espejo de la tabla grupo_estudiante
    idGrupo: number = 0;
    idEstudiante: number = 0;
    fechaInscripcion: string | null = null;
    estadoVinculacion: EstadoVinculacion = 'PENDIENTE';

    // El id numérico del estudiante por su registro (grupo_estudiante referencia id)
    private static idDelRegistro(registro: string): number | null {
        const resultado = baseDatos.executeSync('SELECT id FROM estudiante WHERE registro = ?;', [
            registro,
        ]);
        const filas = resultado.rows as Record<string, unknown>[];
        return filas.length > 0 ? Number(filas[0].id) : null;
    }

    // Guarda en el teléfono del estudiante la materia que el docente confirmó por BLE
    // (CU06). Crea la copia local del grupo (INSERT OR IGNORE por su id desde el docente)
    // y cruza grupo_estudiante con estado ENROLADO_BLE (idempotente).
    static vincularMateria(materia: DatosVincularMateria, registroEstudiante: string): void {
        const idEstudiante = this.idDelRegistro(registroEstudiante);
        if (idEstudiante == null) return;
        baseDatos.executeSync(
            'INSERT OR IGNORE INTO grupo (id, nombre, extension, semestre, anio) VALUES (?, ?, ?, ?, ?);',
            [
                materia.id,
                materia.nombre,
                materia.extension ?? null,
                materia.semestre ?? null,
                materia.anio ?? null,
            ],
        );
        baseDatos.executeSync(
            `INSERT OR REPLACE INTO grupo_estudiante
               (id_grupo, id_estudiante, estado_vinculacion, fecha_inscripcion)
             VALUES (?, ?, 'ENROLADO_BLE', datetime('now', 'localtime'));`,
            [materia.id, idEstudiante],
        );
    }

    // Desvincula al estudiante de una materia (CU08). En una transacción marca el
    // vínculo como CANCELADO (las consultas ya lo excluyen de "Mis Grupos") y limpia
    // los registros locales de esa asignatura (sesiones y su historial de asistencias
    // que quedaron en el dispositivo).
    static desvincularGrupo(idGrupo: number, registroEstudiante: string): void {
        const idEstudiante = this.idDelRegistro(registroEstudiante);
        if (idEstudiante == null) return;
        baseDatos.executeSync('BEGIN TRANSACTION;');
        try {
            baseDatos.executeSync(
                `UPDATE grupo_estudiante
                    SET estado_vinculacion = 'CANCELADO'
                  WHERE id_grupo = ? AND id_estudiante = ?;`,
                [idGrupo, idEstudiante],
            );
            baseDatos.executeSync(
                `DELETE FROM asistencia
                  WHERE id_sesion IN (SELECT id FROM sesion WHERE id_grupo = ?);`,
                [idGrupo],
            );
            baseDatos.executeSync('DELETE FROM sesion WHERE id_grupo = ?;', [idGrupo]);
            baseDatos.executeSync('COMMIT;');
        } catch (error) {
            baseDatos.executeSync('ROLLBACK;');
            throw error;
        }
    }

    // Lista las materias a las que el estudiante está vinculado (CU07, "Mis Grupos");
    // sin las CANCELADO, ordenadas por nombre de la materia.
    static listarMisGrupos(registroEstudiante: string): GrupoEstudiante[] {
        const resultado = baseDatos.executeSync(
            `SELECT g.id, g.nombre, g.extension
               FROM grupo_estudiante ge
               JOIN grupo g ON g.id = ge.id_grupo
               JOIN estudiante e ON e.id = ge.id_estudiante
              WHERE e.registro = ? AND ge.estado_vinculacion != 'CANCELADO'
              ORDER BY g.nombre;`,
            [registroEstudiante],
        );
        return (resultado.rows as Record<string, unknown>[]).map((fila) => ({
            id: String(fila.id),
            nombre: String(fila.nombre),
            sigla: fila.extension != null ? String(fila.extension) : '',
        }));
    }
}

// Datos mínimos de la materia que el estudiante guarda tras el ACEPTADO (CU06)
export interface DatosVincularMateria {
    id: number;
    nombre: string;
    extension: string | null;
    semestre: string | null;
    anio: number | null;
}

// Materia guardada en el teléfono del estudiante (sin docente — ADR-007)
export interface GrupoEstudiante {
    id: string;
    nombre: string;
    sigla: string;
}

// Materia detectada por Bluetooth (el docente solo se MUESTRA al detectar — ADR-007)
export interface MateriaDetectada {
    id: string;
    nombre: string;
    sigla: string;
    docente: string | null;
    rssi: number;
}

// Respuesta del docente a una solicitud de vinculación (CU06)
export type RespuestaVinculacion = 'ACEPTADO' | 'RECHAZADO' | null;
