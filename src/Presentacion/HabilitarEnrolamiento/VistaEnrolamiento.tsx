// CU05: vista de enrolamiento BLE (lado docente).
// Vista pura: no sabe de rutas ni de hooks; pinta lo que le pasa el orquestador
// (PHabilitarEnrolamiento) y avisa con nombres de acción claros. El flujo de
// pantalla (escuchando/resumen/permisos) lo decide el orquestador.

import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { BarraEstadisticas } from '@/Presentacion/componentes/BarraEstadisticas';
import { BotonAccion } from '@/Presentacion/componentes/BotonAccion';
import { Tonos } from '@/Presentacion/componentes/Colores';
import { EncabezadoPantalla } from '@/Presentacion/componentes/EncabezadoPantalla';
import { Insignia } from '@/Presentacion/componentes/Insignia';
import { ModalConfirmacion } from '@/Presentacion/componentes/ModalConfirmacion';
import { RadarBluetooth } from '@/Presentacion/componentes/RadarBluetooth';
import { TarjetaPrensa } from '@/Presentacion/componentes/TarjetaPrensa';
import { ThemedText } from '@/Presentacion/componentes/ThemedText';
import { textoCarrera } from '@/Negocio/NEstudiante';
import type { PropsVistaEnrolamiento } from './tipos';

export function VistaEnrolamiento({
    grupo,
    alumnos,
    bluetoothEncendido,
    isListening,
    resumenVisible,
    avisoPermisosVisible,
    onIniciar,
    onFinalizar,
    onCerrarAvisoPermisos,
    onCerrarResumen,
    onRegresar,
    onConfirmarFinalizar,
    onAbrirAjustes,
}: PropsVistaEnrolamiento) {
    const theme = useTheme();

    const total = alumnos.length;
    const vinculados = alumnos.filter((alumno) => alumno.estado === 'VINCULADO').length;
    const pendientes = total - vinculados;

    return (
        <SafeAreaView style={styles.seguro}>
            <View style={styles.contenedorColumna}>
                <EncabezadoPantalla
                    titulo="Enrolamiento BLE"
                    onRegresar={onRegresar}
                    insignia={
                        grupo ? (
                            <Insignia
                                texto={`${grupo.nombre} - Grupo ${grupo.extension ?? '—'}`}
                                tono="informacion"
                            />
                        ) : undefined
                    }
                />
                {bluetoothEncendido === false ? (
                    <View style={[styles.bannerBluetooth, { backgroundColor: Tonos.error.suave }]}>
                        <Text style={styles.iconoBanner}>⚠️</Text>
                        <Text style={[styles.textoBanner, { color: Tonos.error.solido }]}>
                            Bluetooth Apagado
                        </Text>
                    </View>
                ) : isListening ? (
                    <View
                        style={[styles.bannerEscucha, { backgroundColor: Tonos.informacion.suave }]}
                    >
                        <RadarBluetooth />
                        <View style={styles.columnaEscucha}>
                            <ThemedText type="smallBold">
                                Buscando dispositivos cercanos...
                            </ThemedText>
                        </View>
                    </View>
                ) : null}
                <BarraEstadisticas
                    elementos={[
                        { etiqueta: 'Total Alumnos', valor: total, tono: 'neutro' },
                        {
                            etiqueta: 'Vinculados',
                            valor: vinculados,
                            tono: 'exito',
                            conCheck: true,
                        },
                        { etiqueta: 'Pendientes', valor: pendientes, tono: 'advertencia' },
                    ]}
                />
                {alumnos.length > 0 ? (
                    <FlatList
                        data={alumnos}
                        keyExtractor={(alumno) => alumno.registro}
                        contentContainerStyle={styles.lista}
                        renderItem={({ item }) => (
                            <TarjetaPrensa estilo={styles.tarjetaAlumno}>
                                <View style={styles.filaAlumno}>
                                    <View style={styles.columnaAlumno}>
                                        <Text style={[styles.nombreAlumno, { color: theme.text }]}>
                                            {`${item.nombre} ${item.apellidoPaterno} ${item.apellidoMaterno ?? ''}`.trim()}
                                        </Text>
                                        <ThemedText type="small" themeColor="textSecondary">
                                            {item.registro}
                                        </ThemedText>
                                        {textoCarrera(item.carrera, item.plan) ? (
                                            <ThemedText type="small" themeColor="textSecondary">
                                                {textoCarrera(item.carrera, item.plan)}
                                            </ThemedText>
                                        ) : null}
                                    </View>
                                    <View style={styles.columnaEstado}>
                                        {item.estado === 'VINCULADO' ? (
                                            <>
                                                <Insignia texto="✔ Vinculado" tono="exito" />
                                                <ThemedText type="code" style={styles.uuidAlumno}>
                                                    {`UUID: ${item.uuid?.slice(0, 4) ?? '----'}-XXXX`}
                                                </ThemedText>
                                            </>
                                        ) : (
                                            <Insignia texto="Pendiente" tono="advertencia" />
                                        )}
                                    </View>
                                </View>
                            </TarjetaPrensa>
                        )}
                    />
                ) : null}
                {isListening ? (
                    <BotonAccion
                        titulo="Finalizar Enrolamiento"
                        variante="destructivo"
                        onPulsar={onFinalizar}
                    />
                ) : (
                    <BotonAccion
                        titulo="Iniciar Escucha BLE"
                        variante="exito"
                        onPulsar={onIniciar}
                    />
                )}
            </View>
            <ModalConfirmacion
                visible={avisoPermisosVisible}
                icono="📍"
                tonoIcono="error"
                titulo="Permiso necesario"
                mensaje="Para anunciar el enrolamiento por Bluetooth, concede el permiso 'Dispositivos cercanos'. Si lo rechazaste antes, actívalo desde los Ajustes del teléfono."
                textoConfirmar="Abrir Ajustes"
                tonoConfirmar="primario"
                textoCancelar="Cancelar"
                onConfirmar={() => {
                    onCerrarAvisoPermisos();
                    onAbrirAjustes();
                }}
                onCancelar={onCerrarAvisoPermisos}
            />
            <ModalConfirmacion
                visible={resumenVisible}
                icono="✅"
                tonoIcono="exito"
                titulo="Enrolamiento Finalizado"
                mensaje={`Se vincularon ${vinculados} de ${total} estudiantes`}
                textoConfirmar="Volver al Grupo"
                tonoConfirmar="primario"
                textoCancelar={null}
                onConfirmar={onConfirmarFinalizar}
                onCancelar={onCerrarResumen}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    seguro: {
        flex: 1,
    },
    contenedorColumna: {
        flex: 1,
        paddingHorizontal: Spacing.four,
        paddingVertical: Spacing.three,
        gap: Spacing.three - 2,
    },
    bannerBluetooth: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.two,
        borderRadius: 12,
        padding: Spacing.three - 2,
    },
    iconoBanner: {
        fontSize: 20,
    },
    textoBanner: {
        fontSize: 15,
        fontWeight: '700',
    },
    bannerEscucha: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.three - 2,
        borderRadius: 16,
        padding: Spacing.three - 2,
    },
    columnaEscucha: {
        flex: 1,
        gap: Spacing.two - 2,
    },
    lista: {
        gap: Spacing.two - 2,
        paddingBottom: Spacing.two,
    },
    tarjetaAlumno: {
        paddingVertical: Spacing.two + 2,
    },
    filaAlumno: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: Spacing.two,
    },
    columnaAlumno: {
        flex: 1,
        gap: 1,
    },
    nombreAlumno: {
        fontSize: 16,
        fontWeight: '700',
    },
    columnaEstado: {
        alignItems: 'flex-end',
        gap: Spacing.one + 2,
    },
    uuidAlumno: {
        fontSize: 11,
    },
});
