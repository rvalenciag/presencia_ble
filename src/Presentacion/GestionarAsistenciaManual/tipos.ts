// Tipos y estado local de CU12 (nombres EXACTOS del spec).

import type { AlumnoConEstado, EstadoAsistencia } from '@/Negocio/NAsistencia';

// Las vistas del spec: lista consolidada y modal de cambio de estado
export type VistaAsistenciaManual = 'ATTENDANCE_LIST' | 'MODAL_CHANGE_STATUS';

// Pestañas de filtro rápido de la lista
export type FiltroAsistencia = 'TODOS' | 'PRESENTES' | 'AUSENTES' | 'LICENCIAS';

// Props de la lista consolidada (el buscador y el filtro viven en la vista)
export interface PropsVistaListaConsolidada {
    tituloSesion: string;
    fechaSesion: string;
    presentes: number;
    ausentes: number;
    licencias: number;
    alumnos: AlumnoConEstado[];
    onVolver: () => void;
    onCambiarEstado: (alumno: AlumnoConEstado) => void;
}

// Props del modal de cambio de estado
export interface PropsVistaCambiarEstado {
    alumno: AlumnoConEstado;
    onGuardar: (registro: string, estado: EstadoAsistencia) => void;
    onCancelar: () => void;
}
