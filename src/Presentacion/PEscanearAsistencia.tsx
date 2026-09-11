// Orquestador del CU11 (Escanear Asistencia): resuelve la sesión y el grupo del
// parámetro de ruta, conecta la vista con los hooks de Negocio y muestra el
// resumen finalizado y las acciones de navegación (CU12 queda como placeholder).

import { useLocalSearchParams, router } from 'expo-router';
import { Alert, Linking, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useEscaneoAsistencia } from '@/Negocio/NEscanearAsistencia';
import { Spacing } from '@/constants/theme';
import { BotonAccion } from '@/Presentacion/componentes/BotonAccion';
import { EstadoVacio } from '@/Presentacion/componentes/EstadoVacio';
import { VistaEscanearAsistencia } from '@/Presentacion/EscanearAsistencia/VistaEscanearAsistencia';

export function PEscanearAsistencia() {
    const { sesionId } = useLocalSearchParams<{ sesionId?: string }>();
    const idSesion = sesionId ? Number(sesionId) : null;

    const {
        sesion,
        grupo,
        inscritos,
        presentes,
        ausentes,
        detectedStudents,
        lastDetected,
        scanningState,
        iniciarEscaneo,
        detenerEscaneo,
    } = useEscaneoAsistencia(idSesion);

    if (!sesion || !grupo) {
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
        <VistaEscanearAsistencia
            tituloSesion={sesion.nombre}
            siglaGrupo={`${grupo.nombre} · ${grupo.extension ?? ''}`}
            inscritos={inscritos}
            presentes={presentes}
            ausentes={ausentes}
            detectedStudents={detectedStudents}
            lastDetected={lastDetected}
            scanningState={scanningState}
            onIniciarEscaneo={() => void iniciarEscaneo()}
            onDetenerEscaneo={detenerEscaneo}
            onAbrirAjustes={() => void Linking.openSettings()}
            onVerListaCompleta={() =>
                Alert.alert(
                    'Lista de Asistencia',
                    `El historial completo de ${sesion.nombre} llegará con CU12 (pendiente).`,
                )
            }
            onVolverASesiones={() => router.back()}
        />
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
