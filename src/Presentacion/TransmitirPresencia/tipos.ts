// Tipos que la capa de Presentación usa para el CU10 (Transmitir Presencia).
// Los datos de dominio vienen tipados desde Negocio (ADR-014); aquí solo viven
// los contratos de las vistas (tipos de props) y los datos de pantalla.

import type { DatosConfirmacion, PasoTransmision } from '@/Negocio/NTransmitirPresencia';

export type PropsVistaTransmitirPresencia = {
    tituloMateria: string;
    siglaGrupo: string;
    registro: string;
    uuid: string;
    paso: PasoTransmision;
    confirmationData: DatosConfirmacion | null;
    onIniciar: () => void;
    onDetener: () => void;
    onReintentar: () => void;
    onVolverAMisGrupos: () => void;
};
