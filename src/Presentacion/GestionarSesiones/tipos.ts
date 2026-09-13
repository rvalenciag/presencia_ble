// Tipos y datos compartidos por las vistas de CU09 (sesiones de clase del grupo).

import type { Grupo } from '@/Negocio/NGrupo';
import type { Sesion } from '@/Negocio/NSesion';

// Las vistas del spec: lista (con modal de borrado) y formulario de creación
export type Vista = 'LIST' | 'FORM_CREATE' | 'MODAL_DELETE';

// Campos del formulario de sesión (solo título; fecha/hora se registra automáticamente)
export interface DatosFormulario {
    titulo: string;
}

export const datosIniciales: DatosFormulario = { titulo: '' };

// Convierte 'YYYY-MM-DD HH:MM:SS' a '08 Sep 2026, 07:15 AM'
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export function fechaLegible(fechaHora: string | null): string {
    if (!fechaHora) return '—';
    const partes = fechaHora.split(' ');
    const fecha = partes[0] ?? '';
    const hora = partes[1] ?? '';
    const [anio, mes, dia] = fecha.split('-').map(Number);
    if (!anio || !mes || !dia) return fechaHora;
    const [hh, mm] = hora.split(':').map(Number);
    const esPm = (hh ?? 0) >= 12;
    const h12 = (hh ?? 0) % 12 || 12;
    const minStr = String(mm ?? 0).padStart(2, '0');
    return `${String(dia).padStart(2, '0')} ${MESES[mes - 1]} ${anio}, ${h12}:${minStr} ${esPm ? 'PM' : 'AM'}`;
}

// Props de la vista de lista (incluye modal de borrado)
export type PropsVistaListaSesiones = {
    grupo: Grupo;
    sesiones: Sesion[];
    sesionActiva: Sesion | null;
    onRegresar: () => void;
    onAgregarSesion: () => void;
    onCerrarSesion: (idSesion: number) => void;
    onBorrarSesion: (sesion: Sesion) => void;
    onIrAEscanear: (sesion: Sesion) => void;
    onVerAsistencias: (sesion: Sesion) => void;
    onVerHistorial: () => void;
    onExportarReporte: () => void;
};

// Props de la vista de formulario de creación
export type PropsVistaFormularioSesion = {
    formData: DatosFormulario;
    errorTitulo: string;
    onChangeTitulo: (titulo: string) => void;
    onAbrir: () => void;
    onCancelar: () => void;
};
