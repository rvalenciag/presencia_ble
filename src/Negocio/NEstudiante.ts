// Tema: estudiantes (espejo de la tabla estudiante). Solo la gestión de la nómina.
// CU04: Gestionar Estudiantes — implementación real (useGestionEstudiantes + textoCarrera).
// El parser y la importación de archivos viven en NNomina (CU03); los stubs BLE en
// NEnrolamiento (CU05) y NVinculacion (CU06). Cada tema en su propio archivo de Negocio.
// Camino: Presentación → NEstudiante → DEstudiante/DGrupo en Datos.
// ADR-014: los tipos públicos de estudiante se toman aquí (versión publicada de Datos).

import { useState } from 'react';

import { DEstudiante } from '@/Datos/DEstudiante';
import { DGrupo } from '@/Datos/DGrupo';
import type { AlumnoDeGrupo, CambiosEstudiante } from '@/Datos/DEstudiante';

// Tipos que las vistas de CU04 importan desde Negocio
export type { AlumnoDeGrupo, CambiosEstudiante, DEstudiante } from '@/Datos/DEstudiante';

// Lo que devuelve el hook useGestionEstudiantes (CU04)
export interface RespuestaUseGestionEstudiantes {
    grupo: DGrupo | null;
    alumnos: AlumnoDeGrupo[];
    agregarAlumno: (alumno: DEstudiante) => void;
    actualizarAlumno: (registro: string, cambios: CambiosEstudiante) => void;
    quitarAlumno: (registro: string) => void;
}

// Cómo se muestra la carrera del lado docente: "187 - 6". Con plan vacío se muestra
// solo la carrera. El lado estudiante guarda el nombre literal de la carrera y no usa plan.
export function textoCarrera(carrera: string | null, plan: string | null): string | null {
    if (carrera == null || carrera === '') return null;
    return plan != null && plan !== '' ? `${carrera} - ${plan}` : carrera;
}

export function useGestionEstudiantes(idGrupo: number | null): RespuestaUseGestionEstudiantes {
    // El grupo no cambia mientras la pantalla está montada: se lee directo de la base
    const grupo = idGrupo != null ? DGrupo.obtenerGrupoPorId(idGrupo) : null;

    // La nómina se lee de la base al montar la pantalla
    const [alumnos, setAlumnos] = useState<AlumnoDeGrupo[]>(() =>
        idGrupo != null ? DEstudiante.listarAlumnosDelGrupo(idGrupo) : [],
    );

    // Vuelve a leer la nómina para reflejar los últimos cambios
    const refrescarAlumnos = () => {
        if (idGrupo == null) return;
        setAlumnos(DEstudiante.listarAlumnosDelGrupo(idGrupo));
    };

    // Inscribe a un alumno (lo crea si hacía falta) y lo vincula al grupo
    const agregarAlumno = (alumno: DEstudiante) => {
        if (idGrupo == null) return;
        DEstudiante.registrarEstudianteSiNoExiste(alumno);
        DEstudiante.vincularEstudianteAlGrupo(idGrupo, alumno.registro);
        refrescarAlumnos();
    };

    // Corrige los datos de un alumno ya registrado
    const actualizarAlumno = (registro: string, cambios: CambiosEstudiante) => {
        DEstudiante.actualizarEstudiante(registro, cambios);
        refrescarAlumnos();
    };

    // Desvincula al alumno del grupo (no borra su registro general)
    const quitarAlumno = (registro: string) => {
        if (idGrupo == null) return;
        DEstudiante.quitarAlumnoDelGrupo(idGrupo, registro);
        refrescarAlumnos();
    };

    return { grupo, alumnos, agregarAlumno, actualizarAlumno, quitarAlumno };
}
