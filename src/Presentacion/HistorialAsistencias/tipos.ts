// Tipos y estado local de CU13 (nombres EXACTOS del spec).

import type {
    AsistenciaDeEstudiante,
    DGrupo,
    ResumenAlumno,
    ResumenDocente,
    ResumenEstudiante,
} from '@/Negocio/NAsistencia';

// Las vistas del spec: principal (según rol), detalle del alumno y sin registros
export type VistaHistorial = 'HISTORIAL_MAIN' | 'STUDENT_DETAIL' | 'EMPTY_STATE';

// Props de la vista del estudiante (resumen + lista cronológica)
export interface PropsVistaHistorialEstudiante {
    grupo: DGrupo;
    resumen: ResumenEstudiante;
    onVolver: () => void;
}

// Props de la vista del docente (métricas + nómina; el buscador vive en la vista)
export interface PropsVistaHistorialDocente {
    grupo: DGrupo;
    resumen: ResumenDocente;
    onVolver: () => void;
    onVerDetalle: (alumno: ResumenAlumno) => void;
}

// Props del desglose individual de un alumno (vista STUDENT_DETAIL del docente)
export interface PropsVistaDetalleEstudiante {
    alumno: ResumenAlumno;
    marcas: AsistenciaDeEstudiante[];
    onVolver: () => void;
}
