// Tabla grupo: una materia del docente (CU02).
// ADR-014: la clase declara sus atributos (espejo de la tabla) y sus métodos son static.

import { baseDatos } from '@/Datos/DConexion';

export class DGrupo {
    // Atributos: espejo de la tabla grupo
    id: number = 0;
    nombre: string = '';
    extension: string | null = null;
    semestre: string | null = null;
    anio: number | null = null;

    // Convierte una fila cruda de SQLite en un DGrupo con sus atributos llenos
    static mapearFila(fila: Record<string, unknown>): DGrupo {
        const grupo = new DGrupo();
        grupo.id = Number(fila.id);
        grupo.nombre = String(fila.nombre);
        grupo.extension = fila.extension ? String(fila.extension) : null;
        grupo.semestre = fila.semestre ? String(fila.semestre) : null;
        grupo.anio = fila.anio != null ? Number(fila.anio) : null;
        return grupo;
    }

    // Lista todos los grupos de la materia (SELECT * FROM grupo, en orden de inserción)
    static listarGrupos(): DGrupo[] {
        const resultado = baseDatos.executeSync('SELECT * FROM grupo;');
        return (resultado.rows as Record<string, unknown>[]).map(DGrupo.mapearFila);
    }

    // Devuelve un grupo por su id (para el encabezado de CU03/CU04) o null si no existe
    static obtenerGrupoPorId(idGrupo: number): DGrupo | null {
        const resultado = baseDatos.executeSync('SELECT * FROM grupo WHERE id = ?;', [idGrupo]);
        const filas = resultado.rows as Record<string, unknown>[];
        return filas.length > 0 ? DGrupo.mapearFila(filas[0]) : null;
    }

    // Crea un grupo nuevo y devuelve el grupo ya con su id (INSERT → insertId autogenerado)
    static crearGrupo(datos: DatosNuevoGrupo): DGrupo {
        const resultado = baseDatos.executeSync(
            `INSERT INTO grupo (nombre, extension, semestre, anio) VALUES (?, ?, ?, ?);`,
            [datos.nombre, datos.extension, datos.semestre, datos.anio],
        );

        const nuevo = new DGrupo();
        nuevo.id = Number(resultado.insertId ?? 0);
        nuevo.nombre = datos.nombre;
        nuevo.extension = datos.extension;
        nuevo.semestre = datos.semestre;
        nuevo.anio = datos.anio;
        return nuevo;
    }

    // Actualiza un grupo existente (UPDATE grupo SET ... WHERE id = ?)
    static actualizarGrupo(idGrupo: number, datos: DatosNuevoGrupo): void {
        baseDatos.executeSync(
            `UPDATE grupo SET nombre = ?, extension = ?, semestre = ?, anio = ? WHERE id = ?;`,
            [datos.nombre, datos.extension, datos.semestre, datos.anio, idGrupo],
        );
    }

    // Elimina un grupo; el DDL borra en cascada sus sesiones, asistencias y vinculaciones
    static eliminarGrupo(idGrupo: number): void {
        baseDatos.executeSync('DELETE FROM grupo WHERE id = ?;', [idGrupo]);
    }
}

// Datos que pide el formulario de "Nuevo Grupo" (el id lo pone la base de datos)
export interface DatosNuevoGrupo {
    nombre: string;
    extension: string | null;
    semestre: string | null;
    anio: number | null;
}
