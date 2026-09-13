// Tema: grupos (espejo de las tablas grupo y grupo_estudiante).
// CU02: Gestionar Grupos (lado docente) — implementación real (DGrupo).
// CU07: Consultar Grupos Vinculados y CU08: Desvincular Grupo (lado estudiante),
//       ambos reales y basados en DGrupoEstudiante.
// Un solo hook: useGrupos atiende ambas caras y recibe el registro del estudiante
// para listar sus materias; el saludo de la pantalla estudiante toma su perfil de
// NPerfil (usePerfil) y no enreda a NGrupo con DPerfil.
// ADR-014: los tipos públicos del grupo se toman aquí (versión publicada de Datos).

import { useCallback, useEffect, useState } from 'react';

import { DGrupo } from '@/Datos/DGrupo';
import type { DatosNuevoGrupo } from '@/Datos/DGrupo';
import { DEstudiante } from '@/Datos/DEstudiante';
import { DGrupoEstudiante } from '@/Datos/DGrupoEstudiante';
import type { GrupoEstudiante } from '@/Datos/DGrupoEstudiante';

// Tipos que las vistas de grupos importan desde Negocio
export type { DatosNuevoGrupo } from '@/Datos/DGrupo';
export type { GrupoEstudiante } from '@/Datos/DGrupoEstudiante';

// Alias publicado para vistas (misma forma que DGrupo; independizable sin tocar vistas)
export type Grupo = DGrupo;

// Lo que devuelve el hook useGrupos (CU02 del docente y CU07/CU08 del estudiante)
export interface RespuestaUseGrupos {
    // CU02 (lado docente): los grupos que el docente administra
    grupos: Grupo[];
    // CU02: cantidad de alumnos por grupo (id_grupo → conteo), sin los CANCELADO
    conteoPorGrupo: Record<number, number>;
    crearGrupo: (datos: DatosNuevoGrupo) => void;
    actualizarGrupo: (idGrupo: number, datos: DatosNuevoGrupo) => void;
    eliminarGrupo: (idGrupo: number) => void;
    // CU07/CU08 (lado estudiante): los grupos vinculados al registro de este estudiante
    misGrupos: GrupoEstudiante[];
    refrescarMisGrupos: () => void;
    // CU08: desvincula la materia del estudiante (true si se logró, false si falló)
    desvincularGrupo: (idGrupo: number) => boolean;
}

export function useGrupos(registroEstudiante?: string | null): RespuestaUseGrupos {
    // La lista (docente) se lee de la base al montar la pantalla
    const [grupos, setGrupos] = useState<DGrupo[]>(() => DGrupo.listarGrupos());
    const [conteoPorGrupo, setConteoPorGrupo] = useState<Record<number, number>>(() =>
        DEstudiante.contarAlumnosPorGrupo(),
    );
    const [misGrupos, setMisGrupos] = useState<GrupoEstudiante[]>([]);
    const registro = registroEstudiante ?? null;

    // Al montar (o al cambiar el registro) se cargan las materias vinculadas
    useEffect(() => {
        void Promise.resolve().then(() =>
            setMisGrupos(registro ? DGrupoEstudiante.listarMisGrupos(registro) : []),
        );
    }, [registro]);

    // Vuelve a leer la tabla grupo y el conteo de alumnos para que la lista docente
    // refleje los últimos cambios
    const refrescarGrupos = useCallback(() => {
        setGrupos(DGrupo.listarGrupos());
        setConteoPorGrupo(DEstudiante.contarAlumnosPorGrupo());
    }, []);

    // Crea el grupo en la base y actualiza la lista
    const crearGrupo = useCallback(
        (datos: DatosNuevoGrupo) => {
            DGrupo.crearGrupo(datos);
            refrescarGrupos();
        },
        [refrescarGrupos],
    );

    // Guarda los cambios de un grupo existente y actualiza la lista
    const actualizarGrupo = useCallback(
        (idGrupo: number, datos: DatosNuevoGrupo) => {
            DGrupo.actualizarGrupo(idGrupo, datos);
            refrescarGrupos();
        },
        [refrescarGrupos],
    );

    // Elimina el grupo (con sus datos asociados en cascada) y actualiza la lista
    const eliminarGrupo = useCallback(
        (idGrupo: number) => {
            DGrupo.eliminarGrupo(idGrupo);
            refrescarGrupos();
        },
        [refrescarGrupos],
    );

    // Re-lee las materias del estudiante (lo usan el refresco y tras vincular)
    const refrescarMisGrupos = useCallback(() => {
        setMisGrupos(registro ? DGrupoEstudiante.listarMisGrupos(registro) : []);
    }, [registro]);

    // CU08: marca la materia como desvinculada; si la base falla, Negocio no deja
    // que el error llegue a la vista: avisa con false y el orquestador decide.
    const desvincularGrupo = useCallback(
        (idGrupo: number): boolean => {
            if (registro == null) return false;
            try {
                DGrupoEstudiante.desvincularGrupo(idGrupo, registro);
                refrescarMisGrupos();
                return true;
            } catch (error) {
                console.warn('[NGrupo] No se pudo desvincular el grupo: ' + String(error));
                return false;
            }
        },
        [registro, refrescarMisGrupos],
    );

    return {
        grupos,
        conteoPorGrupo,
        crearGrupo,
        actualizarGrupo,
        eliminarGrupo,
        misGrupos,
        refrescarMisGrupos,
        desvincularGrupo,
    };
}
