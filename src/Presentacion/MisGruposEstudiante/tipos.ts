// Tipos de la vista de Mis Grupos (CU07 y CU08). Los tipos de dominio vienen de Negocio.

import type { GrupoEstudiante } from '@/Negocio/NGrupo';

// Lo que la vista necesita saber para pintarse (se lo pasa el orquestador)
export interface PropsVistaMisGrupos {
    saludo: string;
    registro: string;
    misGrupos: GrupoEstudiante[];
    isRefreshing: boolean;
    onRefrescar: () => void;
    onEntrarAlGrupo: (grupo: GrupoEstudiante) => void;
    // CU10: cada tarjeta avisa al orquestador qué materia transmitir presencia
    onTransmitirPresencia: (grupo: GrupoEstudiante) => void;
    // CU08: la papelera de cada tarjeta avisa al orquestador qué materia desvincular
    onDesvincular: (grupo: GrupoEstudiante) => void;
    onVincular: () => void;
    onConfigurarPerfil: () => void;
}
