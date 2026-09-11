// Orquestador del CU13 (Historial): resuelve el grupo del parámetro de ruta,
// se autoprovee de useHistorial (hook único con 2 modos — ADR-019) y despacha
// la vista según rol: estudiante, docente (+ detalle) o sin registros.

import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useHistorial, type ResumenAlumno } from '@/Negocio/NAsistencia';
import { Spacing } from '@/constants/theme';
import { BotonAccion } from '@/Presentacion/componentes/BotonAccion';
import { EstadoVacio } from '@/Presentacion/componentes/EstadoVacio';
import { VistaDetalleEstudiante } from '@/Presentacion/HistorialAsistencias/VistaDetalleEstudiante';
import { VistaHistorialDocente } from '@/Presentacion/HistorialAsistencias/VistaHistorialDocente';
import { VistaHistorialEstudiante } from '@/Presentacion/HistorialAsistencias/VistaHistorialEstudiante';
import type { VistaHistorial } from '@/Presentacion/HistorialAsistencias/tipos';

export function PHistorialAsistencias() {
    const { grupoId } = useLocalSearchParams<{ grupoId?: string }>();
    const idGrupo = grupoId ? Number(grupoId) : null;

    const { rol, grupo, estudiante, docente, vacio, detalleEstudiante } = useHistorial(idGrupo);
    const [vista, setVista] = useState<VistaHistorial>('HISTORIAL_MAIN');
    const [seleccionado, setSeleccionado] = useState<ResumenAlumno | null>(null);

    if (!grupo || rol == null) {
        return (
            <SafeAreaView style={styles.area}>
                <View style={styles.contenedorCentrado}>
                    <EstadoVacio
                        icono="📚"
                        titulo="Grupo no encontrado"
                        mensaje="Selecciona una materia para ver su historial."
                        accion={
                            <BotonAccion
                                titulo="Volver"
                                variante="secundario"
                                onPulsar={() => router.back()}
                            />
                        }
                    />
                </View>
            </SafeAreaView>
        );
    }

    if (vacio) {
        const esEstudiante = rol === 'ESTUDIANTE';
        return (
            <SafeAreaView style={styles.area}>
                <View style={styles.contenedorCentrado}>
                    <EstadoVacio
                        icono="📅"
                        titulo="Sin Registros"
                        mensaje="No hay registros de asistencia disponibles para esta materia."
                        accion={
                            <BotonAccion
                                titulo={esEstudiante ? 'Volver a Mis Grupos' : 'Volver'}
                                variante="secundario"
                                onPulsar={() =>
                                    esEstudiante ? router.replace('/mis-grupos') : router.back()
                                }
                            />
                        }
                    />
                </View>
            </SafeAreaView>
        );
    }

    if (vista === 'STUDENT_DETAIL' && seleccionado) {
        return (
            <VistaDetalleEstudiante
                alumno={seleccionado}
                marcas={detalleEstudiante(seleccionado.registro)}
                onVolver={() => {
                    setSeleccionado(null);
                    setVista('HISTORIAL_MAIN');
                }}
            />
        );
    }

    if (rol === 'ESTUDIANTE' && estudiante) {
        return (
            <VistaHistorialEstudiante
                grupo={grupo}
                resumen={estudiante}
                onVolver={() => router.back()}
            />
        );
    }

    if (rol === 'DOCENTE' && docente) {
        return (
            <VistaHistorialDocente
                grupo={grupo}
                resumen={docente}
                onVolver={() => router.back()}
                onVerDetalle={(alumno) => {
                    setSeleccionado(alumno);
                    setVista('STUDENT_DETAIL');
                }}
            />
        );
    }

    return (
        <SafeAreaView style={styles.area}>
            <View style={styles.contenedorCentrado}>
                <EstadoVacio
                    icono="📅"
                    titulo="Sin Registros"
                    mensaje="No hay registros de asistencia disponibles para esta materia."
                    accion={
                        <BotonAccion
                            titulo="Volver"
                            variante="secundario"
                            onPulsar={() => router.back()}
                        />
                    }
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    area: {
        flex: 1,
        padding: Spacing.four,
    },
    contenedorCentrado: {
        flex: 1,
        justifyContent: 'center',
    },
});
