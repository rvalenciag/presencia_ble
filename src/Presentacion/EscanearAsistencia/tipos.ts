// Tipos que la capa de Presentación usa para el CU11 (Escanear Asistencia).
// Los datos de dominio vienen tipados desde Negocio (ADR-014); aquí solo viven
// los contratos de las vistas (tipos de props) y los datos de pantalla.

import type { AlumnoDetectado, PasoEscaneo } from '@/Negocio/NEscanearAsistencia';

export type PropsVistaEscanearAsistencia = {
    tituloSesion: string;
    siglaGrupo: string;
    inscritos: number;
    presentes: number;
    ausentes: number;
    detectedStudents: AlumnoDetectado[];
    lastDetected: AlumnoDetectado | null;
    scanningState: PasoEscaneo;
    onIniciarEscaneo: () => void;
    onDetenerEscaneo: () => void;
    onAbrirAjustes: () => void;
    onVerListaCompleta: () => void;
    onVolverASesiones: () => void;
};
