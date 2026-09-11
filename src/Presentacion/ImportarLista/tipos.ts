// Tipos y datos compartidos por las vistas de CU03 (importar la nómina del grupo).

import type { ResultadoImportacion } from '@/Negocio/NNomina';

// Los pasos del spec: selector de archivo, vista previa y confirmación
export type Paso = 'FILE_PICKER' | 'PREVIEW' | 'SUCCESS';

// Resultado en blanco mientras la importación no se confirma
export const resultadoInicial: ResultadoImportacion = { nuevos: 0, duplicados: 0 };
