// Tipos y estado local de CU14 (nombres EXACTOS del spec).

import type {
    ArchivoGenerado,
    ConfigReporte,
    ErrorReporte,
    FormatoReporte,
    TipoRango,
} from '@/Negocio/NAsistencia';

// Las vistas del spec: formulario, generando, éxito+compartir y excepción
export type VistaReporte = 'EXPORT_FORM' | 'GENERATING' | 'SUCCESS_SHARE' | 'EXCEPTION_ALERT';

// Motivos de la vista EXCEPTION_ALERT (el guardado es en documentos + compartir,
// sin permiso de almacenamiento: nota en flow/CU14)
export type MotivoExcepcion = 'NO_DATA' | 'ERROR_ARCHIVO';

// Props del panel de configuración (el formulario vive en la vista)
export interface PropsVistaFormularioReporte {
    grupoNombre: string;
    sigla: string;
    inscritos: number;
    totalSesiones: number;
    onVolver: () => void;
    onGenerar: (config: ConfigReporte) => void;
}

// Props de la ficha de éxito con el menú compartir
export interface PropsVistaExitoReporte {
    archivo: ArchivoGenerado;
    formato: FormatoReporte;
    rango: TipoRango;
    onCompartir: () => void;
    onVolverAlGrupo: () => void;
}

export type { ArchivoGenerado, ConfigReporte, ErrorReporte, FormatoReporte, TipoRango };
