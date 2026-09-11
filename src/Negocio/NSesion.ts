// Tema: sesiones de clase (espejo de la tabla sesion).
// CU09: Gestionar Sesiones (lado docente) — implementación real (DSesion).
// Un solo hook: useSesiones recibe idGrupo y expone la lista, la sesión activa
// y las tres operaciones (crear, cerrar, eliminar) que pide el spec.
// ADR-014: las vistas toman sus tipos desde Negocio (nunca desde Datos).

import { useCallback, useState } from 'react';

import { DSesion } from '@/Datos/DSesion';
import { DGrupo } from '@/Datos/DGrupo';

// Tipos que las vistas del CU09 importan desde Negocio (versión publicada de Datos)
export type { DSesion, EstadoSesion } from '@/Datos/DSesion';
export type { DGrupo } from '@/Datos/DGrupo';

// Lo que devuelve el hook useSesiones
export interface RespuestaUseSesiones {
    grupo: DGrupo | null;
    sesiones: DSesion[];
    sesionActiva: DSesion | null;
    crearSesion: (titulo: string) => DSesion | null;
    cerrarSesion: (idSesion: number) => void;
    eliminarSesion: (idSesion: number) => void;
}

export function useSesiones(idGrupo: number | null): RespuestaUseSesiones {
    const grupo = idGrupo != null ? DGrupo.obtenerGrupoPorId(idGrupo) : null;
    const [sesiones, setSesiones] = useState<DSesion[]>(() =>
        idGrupo != null ? DSesion.listarSesionesDelGrupo(idGrupo) : [],
    );

    // Re-lee las sesiones tras cada operación de escritura
    const refrescar = useCallback(() => {
        if (idGrupo == null) return;
        setSesiones(DSesion.listarSesionesDelGrupo(idGrupo));
    }, [idGrupo]);

    // Crea sesión (si hay sesión abierta, el orquestador lo bloquea antes de llegar aquí)
    const crearSesion = useCallback(
        (titulo: string): DSesion | null => {
            if (idGrupo == null || titulo.trim() === '') return null;
            const nueva = DSesion.crearSesion(idGrupo, titulo.trim());
            refrescar();
            return nueva;
        },
        [idGrupo, refrescar],
    );

    const cerrarSesion = useCallback(
        (idSesion: number) => {
            DSesion.cerrarSesion(idSesion);
            refrescar();
        },
        [refrescar],
    );

    const eliminarSesion = useCallback(
        (idSesion: number) => {
            DSesion.eliminarSesion(idSesion);
            refrescar();
        },
        [refrescar],
    );

    const sesionActiva = sesiones.find((s) => s.estado === 'ABIERTA') ?? null;

    return { grupo, sesiones, sesionActiva, crearSesion, cerrarSesion, eliminarSesion };
}
