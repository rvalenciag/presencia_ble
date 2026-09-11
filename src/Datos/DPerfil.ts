// Tabla perfil: guardar y leer el usuario de este teléfono.
// ADR-014: cada D es una clase que declara sus atributos (espejo de su tabla)
// y sus métodos tocan SQLite. Los tipos viajan hacia arriba re-exportados por Negocio.

import { baseDatos } from '@/Datos/DConexion';

// El rol que elige la persona en la bienvenida (columna rol de la tabla perfil)
export type Rol = 'DOCENTE' | 'ESTUDIANTE';

// Un renglón de la tabla perfil, con sus atributos
export class DPerfil {
    // Atributos: espejo de la tabla perfil
    registro: string = '';
    rol: Rol = 'ESTUDIANTE';
    nombre: string = '';
    apellidoPaterno: string | null = null;
    apellidoMaterno: string | null = null;
    correo: string | null = null;
    carrera: string | null = null;
    uuid: string = '';

    // Convierte una fila cruda de SQLite en un DPerfil con sus atributos llenos
    static desdeFila(fila: Record<string, unknown>): DPerfil {
        const perfil = new DPerfil();
        perfil.registro = String(fila.registro);
        perfil.rol = (fila.rol === 'DOCENTE' ? 'DOCENTE' : 'ESTUDIANTE') as Rol;
        perfil.nombre = String(fila.nombre);
        perfil.apellidoPaterno = String(fila.apellido_paterno ?? '');
        perfil.apellidoMaterno = fila.apellido_materno as string | null;
        perfil.correo = fila.correo as string | null;
        perfil.carrera = fila.carrera as string | null;
        perfil.uuid = String(fila.uuid ?? '');
        return perfil;
    }

    // Devuelve el perfil guardado (null si la app se usa por primera vez)
    static obtenerPerfil(): DPerfil | null {
        const resultado = baseDatos.executeSync('SELECT * FROM perfil LIMIT 1;');
        const fila = resultado.rows[0];
        if (!fila) return null;
        return DPerfil.desdeFila(fila);
    }

    // Guarda el perfil (si ya existía uno con el mismo registro, lo reemplaza)
    static guardarPerfil(perfil: DPerfil): void {
        baseDatos.executeSync(
            `INSERT OR REPLACE INTO perfil
               (registro, rol, nombre, apellido_paterno, apellido_materno, correo, carrera, uuid)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
            [
                perfil.registro,
                perfil.rol,
                perfil.nombre,
                perfil.apellidoPaterno,
                perfil.apellidoMaterno,
                perfil.correo,
                perfil.carrera,
                perfil.uuid,
            ],
        );
    }
}
