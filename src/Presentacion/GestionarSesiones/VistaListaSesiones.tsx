// CU09 (vista LIST): sesiones del grupo con banner de sesión activa, acciones
// por sesión y modal de borrado. No navega: avisa al orquestador qué hacer.

import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { BotonAccion } from '@/Presentacion/componentes/BotonAccion';
import { Tonos } from '@/Presentacion/componentes/Colores';
import { EncabezadoPantalla } from '@/Presentacion/componentes/EncabezadoPantalla';
import { EstadoVacio } from '@/Presentacion/componentes/EstadoVacio';
import { Insignia } from '@/Presentacion/componentes/Insignia';
import { ModalConfirmacion } from '@/Presentacion/componentes/ModalConfirmacion';
import { TarjetaPrensa } from '@/Presentacion/componentes/TarjetaPrensa';
import { ThemedText } from '@/Presentacion/componentes/ThemedText';
import type { DSesion } from '@/Negocio/NSesion';
import { fechaLegible, type PropsVistaListaSesiones } from './tipos';

export function VistaListaSesiones({
    grupo,
    sesiones,
    sesionActiva,
    onRegresar,
    onAgregarSesion,
    onCerrarSesion,
    onBorrarSesion,
    onIrAEscanear,
    onVerAsistencias,
}: PropsVistaListaSesiones) {
    const theme = useTheme();
    const [sesionModal, setSesionModal] = useState<DSesion | null>(null);

    // La sesión activa se muestra en el banner; las demás en la lista
    const sesionesLista = sesionActiva
        ? sesiones.filter((s) => s.id !== sesionActiva.id)
        : sesiones;

    const tituloGrupo = `${grupo.nombre}${grupo.extension != null ? ' - Grupo ' + grupo.extension : ''}`;

    return (
        <SafeAreaView style={styles.seguro}>
            <View style={styles.contenedorColumna}>
                <EncabezadoPantalla
                    titulo="Sesiones / Clases"
                    onRegresar={onRegresar}
                    insignia={<Insignia texto={tituloGrupo} tono="informacion" />}
                />

                {sesionActiva ? (
                    <View style={[styles.bannerActiva, { borderColor: Tonos.exito.solido }]}>
                        <View style={styles.filaBanner}>
                            <View
                                style={[
                                    styles.indicadorActivo,
                                    { backgroundColor: Tonos.exito.solido },
                                ]}
                            />
                            <View style={styles.columnaBanner}>
                                <Text style={[styles.tituloBanner, { color: theme.text }]}>
                                    {sesionActiva.nombre}
                                </Text>
                                <ThemedText type="small" themeColor="textSecondary">
                                    {fechaLegible(sesionActiva.fechaHora)}
                                </ThemedText>
                            </View>
                            <Insignia texto="ABIERTA" tono="exito" />
                        </View>
                        <View style={styles.filaBannerAcciones}>
                            <BotonAccion
                                titulo="Escanear Asistencia"
                                variante="exito"
                                compacto
                                onPulsar={() => onIrAEscanear(sesionActiva)}
                            />
                            <BotonAccion
                                titulo="Cerrar Sesión"
                                variante="secundario"
                                compacto
                                onPulsar={() => onCerrarSesion(sesionActiva.id)}
                            />
                        </View>
                    </View>
                ) : null}

                {sesiones.length === 0 ? (
                    <View style={styles.cajaVacia}>
                        <EstadoVacio
                            icono="📋"
                            titulo="Aún no hay sesiones en este grupo"
                            mensaje="Crea una nueva sesión para comenzar a tomar asistencia."
                            accion={
                                <BotonAccion titulo="+ Nueva Sesión" onPulsar={onAgregarSesion} />
                            }
                        />
                    </View>
                ) : (
                    <FlatList
                        data={sesionesLista}
                        keyExtractor={(sesion) => String(sesion.id)}
                        contentContainerStyle={styles.lista}
                        ListEmptyComponent={
                            <EstadoVacio
                                icono="📋"
                                titulo="Sin sesiones anteriores"
                                mensaje="Solo tienes una sesión activa en este grupo."
                            />
                        }
                        renderItem={({ item }) => {
                            const esAbierta = item.estado === 'ABIERTA';
                            return (
                                <TarjetaPrensa>
                                    <View style={styles.filaTarjeta}>
                                        <View style={styles.columnaTarjeta}>
                                            <Text
                                                style={[styles.tituloSesion, { color: theme.text }]}
                                            >
                                                {item.nombre}
                                            </Text>
                                            <ThemedText type="small" themeColor="textSecondary">
                                                {fechaLegible(item.fechaHora)}
                                            </ThemedText>
                                        </View>
                                        <Insignia
                                            texto={esAbierta ? 'ABIERTA' : 'CERRADA'}
                                            tono={esAbierta ? 'exito' : 'neutro'}
                                        />
                                    </View>
                                    <View style={styles.filaAcciones}>
                                        {esAbierta ? (
                                            <>
                                                <BotonAccion
                                                    titulo="Tomar Asistencia"
                                                    variante="exito"
                                                    compacto
                                                    onPulsar={() => onIrAEscanear(item)}
                                                />
                                                <BotonAccion
                                                    titulo="Cerrar Sesión"
                                                    variante="secundario"
                                                    compacto
                                                    onPulsar={() => onCerrarSesion(item.id)}
                                                />
                                            </>
                                        ) : (
                                            <BotonAccion
                                                titulo="Ver Asistencias"
                                                variante="secundario"
                                                compacto
                                                onPulsar={() => onVerAsistencias(item)}
                                            />
                                        )}
                                        <Pressable
                                            onPress={() => setSesionModal(item)}
                                            hitSlop={8}
                                            style={({ pressed }) => [
                                                styles.botonIcono,
                                                { opacity: pressed ? 0.6 : 1 },
                                            ]}
                                        >
                                            <Text style={styles.iconoAccion}>🗑️</Text>
                                        </Pressable>
                                    </View>
                                </TarjetaPrensa>
                            );
                        }}
                    />
                )}

                {sesiones.length > 0 ? (
                    <BotonAccion titulo="+ Nueva Sesión" onPulsar={onAgregarSesion} />
                ) : null}
            </View>

            <ModalConfirmacion
                visible={sesionModal !== null}
                titulo="¿Eliminar esta sesión?"
                mensaje={
                    <View style={styles.cuerpoModal}>
                        <Text style={[styles.mensajeModal, { color: theme.textSecondary }]}>
                            Se borrará la sesión:
                        </Text>
                        <Text style={[styles.nombreModal, { color: theme.text }]}>
                            {sesionModal?.nombre} (
                            {sesionModal ? fechaLegible(sesionModal.fechaHora) : ''})
                        </Text>
                        <Text style={[styles.mensajeModal, { color: theme.textSecondary }]}>
                            y todos los registros de asistencia tomados ese día, sin posibilidad de
                            recuperarlos.
                        </Text>
                    </View>
                }
                textoConfirmar="Confirmar Eliminación"
                onCancelar={() => setSesionModal(null)}
                onConfirmar={() => {
                    if (sesionModal) onBorrarSesion(sesionModal);
                    setSesionModal(null);
                }}
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
    cajaVacia: {
        flex: 1,
        justifyContent: 'center',
    },
    lista: {
        gap: Spacing.two - 2,
        paddingBottom: Spacing.three,
    },
    // Banner de sesión activa
    bannerActiva: {
        borderWidth: 1.5,
        borderRadius: 14,
        padding: Spacing.three,
        gap: Spacing.two + 2,
    },
    filaBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.two,
    },
    indicadorActivo: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    columnaBanner: {
        flex: 1,
        gap: 2,
    },
    tituloBanner: {
        fontSize: 16,
        fontWeight: '700',
    },
    filaBannerAcciones: {
        flexDirection: 'row',
        gap: Spacing.two,
    },
    // Tarjetas de la lista
    filaTarjeta: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: Spacing.two,
    },
    columnaTarjeta: {
        flex: 1,
        gap: 2,
    },
    tituloSesion: {
        fontSize: 16,
        fontWeight: '700',
    },
    filaAcciones: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.two,
        marginTop: Spacing.two,
    },
    botonIcono: {
        padding: Spacing.two - 2,
    },
    iconoAccion: {
        fontSize: 18,
    },
    // Modal
    cuerpoModal: {
        gap: Spacing.two,
        alignItems: 'center',
    },
    mensajeModal: {
        fontSize: 14,
        lineHeight: 20,
        textAlign: 'center',
    },
    nombreModal: {
        fontSize: 16,
        fontWeight: '800',
        textAlign: 'center',
    },
});
