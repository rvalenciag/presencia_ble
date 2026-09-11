// Tipos de la vista de Mis Grupos (CU07). Los tipos de dominio vienen de Negocio.

import type { GrupoEstudiante } from '@/Negocio/NGrupo';

// Lo que la vista necesita saber para pintarse (se lo pasa el orquestador)
export interface PropsVistaMisGrupos {
    saludo: string;
    registro: string;
    misGrupos: GrupoEstudiante[];
    isRefreshing: boolean;
    onRefrescar: () => void;
    onEntrarAlGrupo: () => void;
    onVincular: () => void;
    onConfigurarPerfil: () => void;
}
