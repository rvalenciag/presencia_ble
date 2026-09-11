// Tabla estudiante y el lado docente de grupo_estudiante (CU03-CU05).
// ADR-014: la clase declara sus atributos (espejo de la tabla estudiante).
// Los métodos de nómina (listar/editar/quitar/importar) llegan con CU03 y CU04.

import { baseDatos } from '@/Datos/DConexion';
import type { EstadoVinculacion } from '@/Datos/DGrupoEstudiante';

// Un renglón de la tabla estudiante, con sus atributos
export class DEstudiante {
    // Atributos: espejo de la tabla estudiante
    registro: string = '';
    nombre: string = '';
    apellidoPaterno: string = '';
    apellidoMaterno: string | null = null;
    carrera: string | null = null;
    plan: string | null = null;
    telefono: string | null = null;
    correo: string | null = null;

    // Registra al alumno solo si no existía antes (INSERT OR IGNORE)
    static registrarEstudianteSiNoExiste(alumno: DEstudiante): void {
        baseDatos.executeSync(
            `INSERT OR IGNORE INTO estudiante
               (registro, nombre, apellido_paterno, apellido_materno, carrera, plan, telefono, correo)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
            [
                alumno.registro,
                alumno.nombre,
                alumno.apellidoPaterno,
                alumno.apellidoMaterno,
                // ?? null: quien llame puede mandar un objeto sin esos campos (perfil estudiante)
                alumno.carrera ?? null,
                alumno.plan ?? null,
                alumno.telefono ?? null,
                alumno.correo ?? null,
            ],
        );
    }

    // El id numérico de un estudiante por su registro (grupo_estudiante referencia id, no registro)
    private static idDelRegistro(registro: string): number | null {
        const resultado = baseDatos.executeSync('SELECT id FROM estudiante WHERE registro = ?;', [
            registro,
        ]);
        const filas = resultado.rows as Record<string, unknown>[];
        return filas.length > 0 ? Number(filas[0].id) : null;
    }

    // Lista los alumnos vinculados a un grupo (JOIN grupo_estudiante + estudiante), sin los CANCELADO
    static listarAlumnosDelGrupo(idGrupo: number): AlumnoDeGrupo[] {
        const resultado = baseDatos.executeSync(
            `SELECT e.registro, e.nombre, e.apellido_paterno, e.apellido_materno, e.carrera,
                    e.plan, e.telefono, e.correo,
                    e.uuid, ge.estado_vinculacion
               FROM grupo_estudiante ge
               JOIN estudiante e ON e.id = ge.id_estudiante
              WHERE ge.id_grupo = ? AND ge.estado_vinculacion != 'CANCELADO'
              ORDER BY e.apellido_paterno, e.nombre;`,
            [idGrupo],
        );
        return (resultado.rows as Record<string, unknown>[]).map((fila) => {
            const alumno = new DEstudiante();
            alumno.registro = String(fila.registro);
            alumno.nombre = String(fila.nombre);
            alumno.apellidoPaterno = String(fila.apellido_paterno ?? '');
            alumno.apellidoMaterno =
                fila.apellido_materno != null ? String(fila.apellido_materno) : null;
            alumno.carrera = fila.carrera != null ? String(fila.carrera) : null;
            alumno.plan = fila.plan != null ? String(fila.plan) : null;
            alumno.telefono = fila.telefono != null ? String(fila.telefono) : null;
            alumno.correo = fila.correo != null ? String(fila.correo) : null;
            return {
                ...alumno,
                uuid: fila.uuid != null ? String(fila.uuid) : null,
                estadoVinculacion: String(fila.estado_vinculacion) as EstadoVinculacion,
            };
        });
    }

    // Corrige los campos editables de un estudiante ya registrado (solo los que vienen en cambios)
    static actualizarEstudiante(registro: string, cambios: CambiosEstudiante): void {
        const asignaciones: string[] = [];
        const valores: (string | null)[] = [];
        if (cambios.nombre !== undefined) {
            asignaciones.push('nombre = ?');
            valores.push(cambios.nombre);
        }
        if (cambios.apellidoPaterno !== undefined) {
            asignaciones.push('apellido_paterno = ?');
            valores.push(cambios.apellidoPaterno);
        }
        if (cambios.apellidoMaterno !== undefined) {
            asignaciones.push('apellido_materno = ?');
            valores.push(cambios.apellidoMaterno);
        }
        if (cambios.carrera !== undefined) {
            asignaciones.push('carrera = ?');
            valores.push(cambios.carrera);
        }
        if (cambios.plan !== undefined) {
            asignaciones.push('plan = ?');
            valores.push(cambios.plan);
        }
        if (cambios.telefono !== undefined) {
            asignaciones.push('telefono = ?');
            valores.push(cambios.telefono);
        }
        if (cambios.correo !== undefined) {
            asignaciones.push('correo = ?');
            valores.push(cambios.correo);
        }
        if (asignaciones.length === 0) return;
        valores.push(registro);
        baseDatos.executeSync(
            `UPDATE estudiante SET ${asignaciones.join(', ')} WHERE registro = ?;`,
            valores,
        );
    }

    // Conteo de alumnos (sin los CANCELADO) por grupo, para la lista de grupos (CU02).
    // Devuelve un mapa id_grupo → cantidad; los grupos sin alumnos no aparecen.
    static contarAlumnosPorGrupo(): Record<number, number> {
        const resultado = baseDatos.executeSync(
            `SELECT id_grupo, COUNT(*) AS cantidad
               FROM grupo_estudiante
              WHERE estado_vinculacion != 'CANCELADO'
              GROUP BY id_grupo;`,
        );
        const conteo: Record<number, number> = {};
        for (const fila of resultado.rows as Record<string, unknown>[]) {
            conteo[Number(fila.id_grupo)] = Number(fila.cantidad);
        }
        return conteo;
    }

    // Desvincula a un alumno del grupo (DELETE en grupo_estudiante; el estudiante se conserva)
    static quitarAlumnoDelGrupo(idGrupo: number, registro: string): void {
        baseDatos.executeSync(
            `DELETE FROM grupo_estudiante
              WHERE id_grupo = ? AND id_estudiante = (SELECT id FROM estudiante WHERE registro = ?);`,
            [idGrupo, registro],
        );
    }

    // Inscribe a un estudiante ya registrado en un grupo (INSERT OR IGNORE, estado PENDIENTE)
    static vincularEstudianteAlGrupo(idGrupo: number, registro: string): void {
        const idEstudiante = this.idDelRegistro(registro);
        if (idEstudiante == null) return;
        baseDatos.executeSync(
            'INSERT OR IGNORE INTO grupo_estudiante (id_grupo, id_estudiante) VALUES (?, ?);',
            [idGrupo, idEstudiante],
        );
    }

    // Lista la nómina para la sesión de enrolamiento (CU05): los alumnos del grupo sin
    // los CANCELADO; el estado visual 'VINCULADO' refleja estado_vinculacion = ENROLADO_BLE.
    static listarAlumnosParaEnrolamiento(idGrupo: number): AlumnoEnrolamiento[] {
        const resultado = baseDatos.executeSync(
            `SELECT e.registro, e.nombre, e.apellido_paterno, e.apellido_materno, e.carrera,
                    e.plan, e.uuid, ge.estado_vinculacion
               FROM grupo_estudiante ge
               JOIN estudiante e ON e.id = ge.id_estudiante
              WHERE ge.id_grupo = ? AND ge.estado_vinculacion != 'CANCELADO'
              ORDER BY e.apellido_paterno, e.nombre;`,
            [idGrupo],
        );
        return (resultado.rows as Record<string, unknown>[]).map((fila) => {
            const alumno = new DEstudiante();
            alumno.registro = String(fila.registro);
            alumno.nombre = String(fila.nombre);
            alumno.apellidoPaterno = String(fila.apellido_paterno ?? '');
            alumno.apellidoMaterno =
                fila.apellido_materno != null ? String(fila.apellido_materno) : null;
            alumno.carrera = fila.carrera != null ? String(fila.carrera) : null;
            alumno.plan = fila.plan != null ? String(fila.plan) : null;
            return {
                ...alumno,
                estado: fila.estado_vinculacion === 'ENROLADO_BLE' ? 'VINCULADO' : 'PENDIENTE',
                uuid: fila.uuid != null ? String(fila.uuid) : null,
            };
        });
    }

    // Guarda el uuid del teléfono de un alumno tras vincularse por BLE (CU05), en una
    // transacción con semántica de sobrescritura (spec: un alumno puede re-vincular su
    // teléfono; el uuid nuevo reemplaza al anterior de quien lo tuviera).
    static asignarUuidEnrolamiento(idGrupo: number, registro: string, uuid: string): void {
        baseDatos.executeSync('BEGIN TRANSACTION;');
        try {
            // El uuid pasa a manos de este alumno (borra la referencia anterior, si la había)
            baseDatos.executeSync('UPDATE estudiante SET uuid = NULL WHERE uuid = ?;', [uuid]);
            baseDatos.executeSync('UPDATE estudiante SET uuid = ? WHERE registro = ?;', [
                uuid,
                registro,
            ]);
            // Marca la vinculación como enrolada por BLE (estado que lee CU07 y la asistencia)
            baseDatos.executeSync(
                `UPDATE grupo_estudiante
                    SET estado_vinculacion = 'ENROLADO_BLE'
                  WHERE id_grupo = ? AND id_estudiante = (SELECT id FROM estudiante WHERE registro = ?);`,
                [idGrupo, registro],
            );
            baseDatos.executeSync('COMMIT;');
        } catch (error) {
            baseDatos.executeSync('ROLLBACK;');
            throw error;
        }
    }

    // Importa una nómina al grupo en una sola transacción: por cada alumno registra el
    // estudiante (INSERT OR IGNORE) y lo vincula al grupo; duplicados = los ya vinculados.
    static importarNomina(idGrupo: number, alumnos: DEstudiante[]): ResultadoImportacion {
        let nuevos = 0;
        let duplicados = 0;
        baseDatos.executeSync('BEGIN TRANSACTION;');
        try {
            for (const alumno of alumnos) {
                this.registrarEstudianteSiNoExiste(alumno);
                const idEstudiante = this.idDelRegistro(alumno.registro);
                if (idEstudiante == null) continue;
                const resultado = baseDatos.executeSync(
                    'INSERT OR IGNORE INTO grupo_estudiante (id_grupo, id_estudiante) VALUES (?, ?);',
                    [idGrupo, idEstudiante],
                );
                if (resultado.rowsAffected > 0) nuevos += 1;
                else duplicados += 1;
            }
            baseDatos.executeSync('COMMIT;');
        } catch (error) {
            baseDatos.executeSync('ROLLBACK;');
            throw error;
        }
        return { nuevos, duplicados };
    }
}

// Campos que se pueden corregir de un estudiante ya registrado
export interface CambiosEstudiante {
    nombre?: string;
    apellidoPaterno?: string;
    apellidoMaterno?: string | null;
    carrera?: string | null;
    plan?: string | null;
    telefono?: string | null;
    correo?: string | null;
}

export type EstadoImportacion = 'NUEVO' | 'DUPLICADO';

// Un alumno tal como se lista dentro de un grupo (CU04)
export interface AlumnoDeGrupo extends DEstudiante {
    uuid: string | null;
    estadoVinculacion: EstadoVinculacion;
}

// Un alumno durante la sesión de enrolamiento (CU05)
export interface AlumnoEnrolamiento extends DEstudiante {
    estado: 'PENDIENTE' | 'VINCULADO';
    uuid: string | null;
}

// Un alumno leído del archivo de nómina (CU03)
export interface AlumnoImportado extends DEstudiante {
    estadoImportacion: EstadoImportacion;
}

// Lo que devuelve importar una nómina
export interface ResultadoImportacion {
    nuevos: number;
    duplicados: number;
}
