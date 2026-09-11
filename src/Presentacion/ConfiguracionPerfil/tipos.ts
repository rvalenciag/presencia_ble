// Tipos de la pantalla CU01 (solo de vista).
// Los comparten el orquestador (PConfiguracionPerfil) y la VistaFormulario.

// Campos del formulario del perfil
export interface DatosFormulario {
    registro: string;
    nombre: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
    correo: string;
    carrera: string;
}

export const datosIniciales: DatosFormulario = {
    registro: '',
    nombre: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    correo: '',
    carrera: '',
};

// Mensajes de error por campo (vacío hasta que la validación falle)
export interface ErroresFormulario {
    registro?: string;
    nombre?: string;
    apellidoPaterno?: string;
    apellidoMaterno?: string;
    correo?: string;
    carrera?: string;
}
