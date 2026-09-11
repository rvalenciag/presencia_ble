// CU06: vista de vinculación de dispositivo (lado estudiante).
// Vista pura: no sabe de rutas ni de hooks; pinta y avisa. El paso de la pantalla
// (SCANNING/PAIRING/SUCCESS/REJECTED) y la materia tocada los decide el orquestador
// (PVincularDispositivo); aquí solo se traduce el paso a pantallas.

import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { BotonAccion } from '@/Presentacion/componentes/BotonAccion';
import { Tonos } from '@/Presentacion/componentes/Colores';
import { EncabezadoPantalla } from '@/Presentacion/componentes/EncabezadoPantalla';
import { Insignia } from '@/Presentacion/componentes/Insignia';
import { ModalConfirmacion } from '@/Presentacion/componentes/ModalConfirmacion';
import { RadarBluetooth } from '@/Presentacion/componentes/RadarBluetooth';
import { TarjetaPrensa } from '@/Presentacion/componentes/TarjetaPrensa';
import { ThemedText } from '@/Presentacion/componentes/ThemedText';
import type { PropsVistaVinculacion } from './tipos';

// Qué tan fuerte suena la señal (para la etiqueta de la tarjeta)
function etiquetaSenal(rssi: number): { texto: string; color: string } {
    if (rssi >= -60) {
        return { texto: 'Señal Excelente', color: Tonos.exito.solido };
    }
    if (rssi >= -75) {
        return { texto: 'Señal Buena', color: Tonos.informacion.solido };
    }
    return { texto: 'Señal Débil', color: Tonos.neutro.solido };
}

export function VistaVinculacion({
    perfil,
    materiasDetectadas,
    paso,
    materiaSeleccionada,
    motivoRechazo,
    avisoPermisosVisible,
    onSeleccionar,
    onReintentar,
    onCerrarAvisoPermisos,
    onRegresar,
    onIrAMisGrupos,
    onVolverInicio,
    onAbrirAjustes,
}: PropsVistaVinculacion) {
    const theme = useTheme();

    // Vista 2: enviando la solicitud con el payload [Registro + UUID]
    if (paso === 'PAIRING' && materiaSeleccionada) {
        return (
            <SafeAreaView style={styles.seguro}>
                <View style={styles.contenidoCentrado}>
                    <EncabezadoPantalla titulo="Enviando Solicitud" />
                    <View style={styles.cajaTransmision}>
                        <Text style={styles.iconoTransmision}>📡</Text>
                        <ThemedText type="smallBold" style={styles.textoTransmision}>
                            Conectando con el dispositivo del docente...
                        </ThemedText>
                        <View
                            style={[
                                styles.cajaPayload,
                                { backgroundColor: theme.backgroundElement },
                            ]}
                        >
                            <ThemedText type="code" style={styles.lineaPayload}>
                                {`Registro: ${perfil?.registro ?? '—'}`}
                            </ThemedText>
                            <ThemedText type="code" style={styles.lineaPayload}>
                                {`UUID Hardware: ${perfil?.uuid ? perfil.uuid.slice(0, 14) : '—'}`}
                            </ThemedText>
                        </View>
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    // Vista 3A: vinculación exitosa
    if (paso === 'SUCCESS' && materiaSeleccionada) {
        return (
            <SafeAreaView style={styles.seguro}>
                <View style={styles.contenidoCentrado}>
                    <View style={[styles.circuloExito, { backgroundColor: Tonos.exito.suave }]}>
                        <Text style={styles.iconoExito}>✔</Text>
                    </View>
                    <Text style={[styles.tituloResultado, { color: theme.text }]}>
                        ¡Vinculación Exitosa!
                    </Text>
                    <TarjetaPrensa estilo={styles.tarjetaMateria}>
                        <Text style={[styles.nombreMateria, { color: theme.text }]}>
                            {materiaSeleccionada.nombre}
                        </Text>
                        <View style={styles.filaMateria}>
                            <Insignia
                                texto={`Grupo ${materiaSeleccionada.sigla}`}
                                tono="informacion"
                            />
                        </View>
                    </TarjetaPrensa>
                    <BotonAccion titulo="Ir a Mis Grupos" onPulsar={onIrAMisGrupos} />
                </View>
            </SafeAreaView>
        );
    }

    // Vista 3B: vinculación rechazada
    if (paso === 'REJECTED') {
        return (
            <SafeAreaView style={styles.seguro}>
                <View style={styles.contenidoCentrado}>
                    <View style={[styles.circuloError, { backgroundColor: Tonos.error.suave }]}>
                        <Text style={styles.iconoError}>✖</Text>
                    </View>
                    <Text style={[styles.tituloResultado, { color: theme.text }]}>
                        Vinculación Rechazada
                    </Text>
                    <ThemedText
                        type="small"
                        themeColor="textSecondary"
                        style={styles.mensajeRechazo}
                    >
                        {motivoRechazo ??
                            `Tu Registro Universitario (${perfil?.registro ?? '—'}) no figura en la lista oficial del docente para este grupo. Contacta a tu profesor para ser agregado.`}
                    </ThemedText>
                    <BotonAccion titulo="Reintentar" onPulsar={onReintentar} />
                    <BotonAccion
                        titulo="Volver al Inicio"
                        variante="secundario"
                        onPulsar={onVolverInicio}
                    />
                </View>
            </SafeAreaView>
        );
    }

    // Vista 1: escáner de materias cercanas
    return (
        <SafeAreaView style={styles.seguro}>
            <View style={styles.contenedorColumna}>
                <EncabezadoPantalla
                    titulo="Vincular a Materia"
                    onRegresar={onRegresar}
                    insignia={
                        <Insignia texto={`Reg: ${perfil?.registro ?? '—'}`} tono="informacion" />
                    }
                />
                <View style={styles.cajaRadar}>
                    <RadarBluetooth />
                    <ThemedText type="small" themeColor="textSecondary" style={styles.textoRadar}>
                        Buscando materias transmitiendo en el aula...
                    </ThemedText>
                </View>
                {materiasDetectadas.length === 0 ? (
                    <ThemedText
                        type="small"
                        themeColor="textSecondary"
                        style={styles.sinResultados}
                    >
                        No se detectaron materias. Asegúrate de estar cerca del docente y que haya
                        iniciado el enrolamiento.
                    </ThemedText>
                ) : (
                    <FlatList
                        data={materiasDetectadas}
                        keyExtractor={(materia) => materia.id}
                        contentContainerStyle={styles.lista}
                        renderItem={({ item }) => {
                            const senal = etiquetaSenal(item.rssi);
                            return (
                                <TarjetaPrensa onPulsar={() => onSeleccionar(item)}>
                                    <View style={styles.filaMateriaDetectada}>
                                        <View style={styles.columnaMateria}>
                                            <Text
                                                style={[
                                                    styles.nombreMateria,
                                                    { color: theme.text },
                                                ]}
                                            >
                                                {item.nombre}
                                            </Text>
                                            <Insignia
                                                texto={`Grupo ${item.sigla}`}
                                                tono="informacion"
                                            />
                                        </View>
                                        <View style={styles.columnaSenal}>
                                            <Text
                                                style={[styles.textoSenal, { color: senal.color }]}
                                            >
                                                {senal.texto}
                                            </Text>
                                            <ThemedText type="small" themeColor="textSecondary">
                                                {`${item.rssi} dBm`}
                                            </ThemedText>
                                        </View>
                                    </View>
                                </TarjetaPrensa>
                            );
                        }}
                    />
                )}
            </View>
            <ModalConfirmacion
                visible={avisoPermisosVisible}
                icono="📍"
                tonoIcono="error"
                titulo="Permiso necesario"
                mensaje="Para enviar tu solicitud por Bluetooth, concede el permiso 'Dispositivos cercanos'. Si lo rechazaste antes, actívalo desde los Ajustes del teléfono."
                textoConfirmar="Abrir Ajustes"
                tonoConfirmar="primario"
                textoCancelar="Cancelar"
                onConfirmar={() => {
                    onCerrarAvisoPermisos();
                    onAbrirAjustes();
                }}
                onCancelar={onCerrarAvisoPermisos}
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
    contenidoCentrado: {
        flex: 1,
        paddingHorizontal: Spacing.four,
        paddingVertical: Spacing.four,
        gap: Spacing.three - 2,
    },
    cajaRadar: {
        alignItems: 'center',
        gap: Spacing.two,
        paddingVertical: Spacing.two,
    },
    textoRadar: {
        textAlign: 'center',
    },
    sinResultados: {
        textAlign: 'center',
        paddingVertical: Spacing.three,
    },
    lista: {
        gap: Spacing.two - 2,
        paddingBottom: Spacing.three,
    },
    filaMateriaDetectada: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: Spacing.two,
    },
    columnaMateria: {
        flex: 1,
        gap: Spacing.one + 2,
    },
    nombreMateria: {
        fontSize: 17,
        fontWeight: '700',
    },
    columnaSenal: {
        alignItems: 'flex-end',
        gap: 2,
    },
    textoSenal: {
        fontSize: 13,
        fontWeight: '700',
    },
    cajaTransmision: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.three,
    },
    iconoTransmision: {
        fontSize: 56,
    },
    textoTransmision: {
        textAlign: 'center',
    },
    cajaPayload: {
        alignSelf: 'stretch',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(32, 138, 239, 0.4)',
        padding: Spacing.three - 2,
        gap: Spacing.one + 2,
    },
    lineaPayload: {
        fontSize: 13,
    },
    circuloExito: {
        width: 88,
        height: 88,
        borderRadius: 44,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
    },
    iconoExito: {
        fontSize: 42,
        color: Tonos.exito.solido,
    },
    circuloError: {
        width: 88,
        height: 88,
        borderRadius: 44,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
    },
    iconoError: {
        fontSize: 40,
        color: Tonos.error.solido,
        fontWeight: '800',
    },
    tituloResultado: {
        fontSize: 24,
        fontWeight: '700',
        textAlign: 'center',
    },
    mensajeRechazo: {
        textAlign: 'center',
        lineHeight: 21,
    },
    tarjetaMateria: {
        alignSelf: 'stretch',
        gap: Spacing.two,
    },
    filaMateria: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.three - 2,
    },
});
