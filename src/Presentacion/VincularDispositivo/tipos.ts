// Tipos de la vista de vinculación (CU06). Los tipos de dominio vienen de Negocio.

import type { MateriaDetectada } from '@/Negocio/NVinculacion';
import type { Perfil } from '@/Negocio/NPerfil';

// El momento de la pantalla que se está mostrando
export type Paso = 'SCANNING' | 'PAIRING' | 'SUCCESS' | 'REJECTED';

// Lo que la vista necesita saber para pintarse (se lo pasa el orquestador)
export interface PropsVistaVinculacion {
    perfil: Perfil | null;
    materiasDetectadas: MateriaDetectada[];
    motivoRechazo?: string;
    paso: Paso;
    materiaSeleccionada: MateriaDetectada | null;
    avisoPermisosVisible: boolean;
    onSeleccionar: (materia: MateriaDetectada) => void;
    onReintentar: () => void;
    onCerrarAvisoPermisos: () => void;
    onRegresar: () => void;
    onIrAMisGrupos: () => void;
    onVolverInicio: () => void;
    onAbrirAjustes: () => void;
}
