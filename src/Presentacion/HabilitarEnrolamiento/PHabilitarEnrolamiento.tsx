// CU05: Habilitar Enrolamiento (lado docente).
// Orquestador auto-proveído (ADR-001): lee el parámetro de ruta, llama al hook
// useEnrolamiento y decide el flujo de pantalla (escuchando/resumen/permisos);
// la vista pura (HabilitarEnrolamiento/VistaEnrolamiento) solo pinta.

import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Linking, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BotonAccion } from '@/Presentacion/componentes/BotonAccion';
import { EstadoVacio } from '@/Presentacion/componentes/EstadoVacio';
import { VistaEnrolamiento } from './VistaEnrolamiento';
import { useEnrolamiento } from '@/Negocio/NEnrolamiento';

export function PHabilitarEnrolamiento() {
    // El grupo llega por la URL
    const { grupoId } = useLocalSearchParams<{ grupoId?: string }>();
    const idGrupo = grupoId ? Number(grupoId) : null;

    const { grupo, alumnos, bluetoothEncendido, iniciarEscucha, finalizar } =
        useEnrolamiento(idGrupo);

    // El flujo de pantalla vive aquí (en el orquestador), no en la vista
    const [isListening, setIsListening] = useState(false);
    const [resumenVisible, setResumenVisible] = useState(false);
    const [avisoPermisosVisible, setAvisoPermisosVisible] = useState(false);

    // Solo cambia de UI si el faro logró arrancar (el hook pide el permiso de emisión)
    const iniciar = async () => {
        const permisosOk = await iniciarEscucha();
        if (!permisosOk) {
            setAvisoPermisosVisible(true);
            return;
        }
        setIsListening(true);
    };

    const finalizarEnrolamiento = () => {
        setIsListening(false);
        finalizar();
        setResumenVisible(true);
    };

    // Sin grupo activo todavía no hay nómina que enrolar
    if (!grupo) {
        return (
            <SafeAreaView style={styles.seguro}>
                <View style={styles.contenedorCentrado}>
                    <EstadoVacio
                        icono="📚"
                        titulo="Sin grupo activo"
                        mensaje="Selecciona un grupo en Gestionar Estudiantes para iniciar el enrolamiento."
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
        <VistaEnrolamiento
            grupo={grupo}
            alumnos={alumnos}
            bluetoothEncendido={bluetoothEncendido}
            isListening={isListening}
            resumenVisible={resumenVisible}
            avisoPermisosVisible={avisoPermisosVisible}
            onIniciar={() => void iniciar()}
            onFinalizar={finalizarEnrolamiento}
            onCerrarAvisoPermisos={() => setAvisoPermisosVisible(false)}
            onCerrarResumen={() => setResumenVisible(false)}
            onRegresar={() => router.back()}
            onAbrirAjustes={() => {
                void Linking.openSettings();
            }}
            onConfirmarFinalizar={() => {
                router.replace({
                    pathname: '/gestionar-estudiantes',
                    params: { grupoId: String(grupo.id) },
                });
            }}
        />
    );
}

const styles = StyleSheet.create({
    seguro: {
        flex: 1,
    },
    contenedorCentrado: {
        flex: 1,
        justifyContent: 'center',
    },
});
