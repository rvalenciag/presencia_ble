// Tipos de la pantalla CU02 (solo de vista).
// Los comparten el orquestador (PGestionarGrupos) y sus subvistas.

// Las etapas que recorre la pantalla según el spec de CU02
export type Vista = 'LIST' | 'FORM_CREATE' | 'FORM_EDIT' | 'MODAL_DELETE';

// Campos del formulario de grupo (el año se guarda como texto y se valida a 4 dígitos)
export interface DatosFormulario {
    nombre: string;
    extension: string;
    semestre: string;
    anio: string;
}

// El formulario vacío con el que arranca la pantalla
export const datosIniciales: DatosFormulario = {
    nombre: '',
    extension: '',
    semestre: '',
    anio: '',
};

// Mensajes de error por campo (vacío hasta que la validación falle)
export interface ErroresFormulario {
    nombre?: string;
    semestre?: string;
    anio?: string;
}
