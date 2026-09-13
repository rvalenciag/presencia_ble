// Orquestador del CU12 (Asistencia Manual): resuelve la sesión del parámetro
// de ruta, conecta la vista con useAsistenciaManual y muestra el modal de
// cambio de estado (el error de guardado sale en alerta, spec CU12).

import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Alert, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
    useAsistenciaManual,
    type AlumnoConEstado,
    type EstadoAsistencia,
} from '@/Negocio/NAsistencia';
import { fechaLegible } from '@/Presentacion/GestionarSesiones/tipos';
import { Spacing } from '@/constants/theme';
import { BotonAccion } from '@/Presentacion/componentes/BotonAccion';
import { EstadoVacio } from '@/Presentacion/componentes/EstadoVacio';
import { VistaCambiarEstado } from './VistaCambiarEstado';
import { VistaListaConsolidada } from './VistaListaConsolidada';

export function PGestionarAsistenciaManual() {
    const { sesionId } = useLocalSearchParams<{ sesionId?: string }>();
    const idSesion = sesionId ? Number(sesionId) : null;

    const { sesion, alumnos, presentes, ausentes, licencias, cambiarEstado } =
        useAsistenciaManual(idSesion);
    const [seleccionado, setSeleccionado] = useState<AlumnoConEstado | null>(null);

    const guardar = (registro: string, estado: EstadoAsistencia) => {
        const error = cambiarEstado(registro, estado);
        if (error) {
            Alert.alert('No se pudo guardar', error);
            return;
        }
        setSeleccionado(null);
    };

    if (!sesion) {
        return (
            <SafeAreaView style={styles.area}>
                <View style={styles.contenedorCentrado}>
                    <EstadoVacio
                        icono="📝"
                        titulo="Sesión no encontrada"
                        mensaje="Selecciona una sesión activa desde Gestionar Sesiones."
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

    return (
        <>
            <VistaListaConsolidada
                tituloSesion={sesion.nombre}
                fechaSesion={fechaLegible(sesion.fechaHora)}
                presentes={presentes}
                ausentes={ausentes}
                licencias={licencias}
                alumnos={alumnos}
                onVolver={() => router.back()}
                onCambiarEstado={setSeleccionado}
            />
            {seleccionado ? (
                <VistaCambiarEstado
                    key={seleccionado.registro}
                    alumno={seleccionado}
                    onGuardar={guardar}
                    onCancelar={() => setSeleccionado(null)}
                />
            ) : null}
        </>
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
