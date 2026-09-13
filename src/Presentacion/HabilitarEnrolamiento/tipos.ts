// Tipos de la vista de enrolamiento (CU05). Los tipos de dominio vienen de Negocio.

import type { AlumnoEnrolamiento } from '@/Negocio/NEnrolamiento';
import type { Grupo } from '@/Negocio/NGrupo';

// Lo que la vista necesita saber para pintarse (se lo pasa el orquestador)
export interface PropsVistaEnrolamiento {
    grupo: Grupo | null;
    alumnos: AlumnoEnrolamiento[];
    bluetoothEncendido: boolean | null;
    isListening: boolean;
    resumenVisible: boolean;
    avisoPermisosVisible: boolean;
    onIniciar: () => void;
    onFinalizar: () => void;
    onCerrarAvisoPermisos: () => void;
    onCerrarResumen: () => void;
    onRegresar: () => void;
    onConfirmarFinalizar: () => void;
    onAbrirAjustes: () => void;
}
