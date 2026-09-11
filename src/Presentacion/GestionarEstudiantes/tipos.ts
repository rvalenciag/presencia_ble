// Tipos y datos compartidos por las vistas de CU04 (nómina del grupo, un alumno por fila).

import type { AlumnoDeGrupo } from '@/Negocio/NEstudiante';

// Las vistas del spec: lista (con modal de desvinculación), alta y edición
export type Vista = 'LIST' | 'FORM_ADD' | 'FORM_EDIT';

// Campos del formulario de alumno
export interface DatosFormulario {
    registro: string;
    nombre: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
    carrera: string;
    plan: string;
    telefono: string;
    correo: string;
}

export const datosIniciales: DatosFormulario = {
    registro: '',
    nombre: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    carrera: '',
    plan: '',
    telefono: '',
    correo: '',
};

// Mensajes de error por campo
export interface ErroresFormulario {
    registro?: string;
    nombre?: string;
    apellidoPaterno?: string;
    apellidoMaterno?: string;
    carrera?: string;
    plan?: string;
    telefono?: string;
    correo?: string;
}

// Rellena el formulario con los datos de un alumno para editar la ficha
export function formularioDeAlumno(alumno: AlumnoDeGrupo): DatosFormulario {
    return {
        registro: alumno.registro,
        nombre: alumno.nombre,
        apellidoPaterno: alumno.apellidoPaterno,
        apellidoMaterno: alumno.apellidoMaterno ?? '',
        carrera: alumno.carrera ?? '',
        plan: alumno.plan ?? '',
        telefono: alumno.telefono ?? '',
        correo: alumno.correo ?? '',
    };
}
