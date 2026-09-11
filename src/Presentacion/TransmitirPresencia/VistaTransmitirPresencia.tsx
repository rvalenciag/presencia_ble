// Vistas del CU10 (Transmitir Presencia): Inicio, Transmitiendo, Asistencia
// Confirmada, Transmisión Finalizada sin Confirmación y las excepciones de
// Bluetooth (apagado / sin soporte). Solo reciben props del orquestador (nunca
// tocan Datos ni Negocio — ADR-008).

import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { BotonAccion } from '@/Presentacion/componentes/BotonAccion';
import { Tonos, type Tono } from '@/Presentacion/componentes/Colores';
import { EncabezadoPantalla } from '@/Presentacion/componentes/EncabezadoPantalla';
import { Insignia } from '@/Presentacion/componentes/Insignia';
import { RadarBluetooth } from '@/Presentacion/componentes/RadarBluetooth';
import { TarjetaPrensa } from '@/Presentacion/componentes/TarjetaPrensa';
import { ThemedText } from '@/Presentacion/componentes/ThemedText';

import type { PropsVistaTransmitirPresencia } from './tipos';

export function VistaTransmitirPresencia({
    tituloMateria,
    siglaGrupo,
    registro,
    uuid,
    paso,
    confirmationData,
    onIniciar,
    onDetener,
    onReintentar,
    onVolverAMisGrupos,
}: PropsVistaTransmitirPresencia) {
    if (paso === 'TRANSMITTING') {
        return <VistaTransmitiendo registro={registro} uuid={uuid} onDetener={onDetener} />;
    }

    if (paso === 'CONFIRMED') {
        return (
            <VistaAsistenciaConfirmada
                tituloMateria={tituloMateria}
                siglaGrupo={siglaGrupo}
                confirmationData={confirmationData}
                onVolverAMisGrupos={onVolverAMisGrupos}
            />
        );
    }

    if (paso === 'TIMEOUT') {
        return (
            <VistaTransmisionFinalizada
                tituloMateria={tituloMateria}
                siglaGrupo={siglaGrupo}
                onReintentar={onReintentar}
                onVolverAMisGrupos={onVolverAMisGrupos}
            />
        );
    }

    if (paso === 'BT_OFF') {
        return <VistaBluetoothApagado onEntendido={onReintentar} />;
    }

    if (paso === 'NOT_SUPPORTED') {
        return <VistaSinSoporte onVolver={onVolverAMisGrupos} />;
    }

    // paso === 'READY'
    return (
        <VistaInicio
            tituloMateria={tituloMateria}
            siglaGrupo={siglaGrupo}
            registro={registro}
            onIniciar={onIniciar}
            onVolverAMisGrupos={onVolverAMisGrupos}
        />
    );
}

// ─── Vista 1: preparación ───

function VistaInicio({
    tituloMateria,
    siglaGrupo,
    registro,
    onIniciar,
    onVolverAMisGrupos,
}: {
    tituloMateria: string;
    siglaGrupo: string;
    registro: string;
    onIniciar: () => void;
    onVolverAMisGrupos: () => void;
}) {
    return (
        <SafeAreaView style={styles.area}>
            <View style={styles.columna}>
                <EncabezadoPantalla
                    titulo={tituloMateria}
                    onRegresar={onVolverAMisGrupos}
                    insignia={<Insignia texto={`Reg: ${registro}`} tono="informacion" />}
                />
                <TarjetaPrensa>
                    <ThemedText type="smallBold">{tituloMateria}</ThemedText>
                    <Insignia texto={`Grupo ${siglaGrupo}`} tono="informacion" />
                    <ThemedText type="small" themeColor="textSecondary">
                        Al presionar el botón, tu teléfono emitirá una señal inalámbrica para que el
                        docente registre tu presencia.
                    </ThemedText>
                </TarjetaPrensa>
                <BotonAccion
                    titulo="Iniciar Transmisión de Presencia"
                    variante="exito"
                    onPulsar={onIniciar}
                />
            </View>
        </SafeAreaView>
    );
}

// ─── Vista 2: escaneando / transmitiendo ───

function VistaTransmitiendo({
    registro,
    uuid,
    onDetener,
}: {
    registro: string;
    uuid: string;
    onDetener: () => void;
}) {
    const theme = useTheme();
    const uuidCorto = uuid.slice(0, 14);

    return (
        <SafeAreaView style={styles.area}>
            <View style={styles.columna}>
                <EncabezadoPantalla titulo="Transmitiendo Presencia" />
                <View style={[styles.cajaRadar, { backgroundColor: theme.backgroundElement }]}>
                    <RadarBluetooth />
                    <ThemedText type="smallBold">Emitiendo señal BLE…</ThemedText>
                    <ThemedText
                        type="small"
                        themeColor="textSecondary"
                        style={styles.textoCentrado}
                    >
                        Escaneando tu entorno en busca del teléfono del docente
                    </ThemedText>
                    <View style={[styles.cajaPayload, { backgroundColor: theme.background }]}>
                        <ThemedText type="code">Registro: {registro}</ThemedText>
                        <ThemedText type="code">UUID: {uuidCorto}</ThemedText>
                    </View>
                </View>
                <BotonAccion
                    titulo="Detener Transmisión"
                    variante="destructivo"
                    onPulsar={onDetener}
                />
            </View>
        </SafeAreaView>
    );
}

// ─── Vista 3: asistencia confirmada (el docente respondió el ACK) ───

function VistaAsistenciaConfirmada({
    tituloMateria,
    siglaGrupo,
    confirmationData,
    onVolverAMisGrupos,
}: {
    tituloMateria: string;
    siglaGrupo: string;
    confirmationData: PropsVistaTransmitirPresencia['confirmationData'];
    onVolverAMisGrupos: () => void;
}) {
    if (!confirmationData) return null;

    return (
        <SafeAreaView style={styles.area}>
            <View style={styles.columnaCentrada}>
                <CirculoResultado tono="exito" icono="✓" />
                <ThemedText type="subtitle">Asistencia Confirmada</ThemedText>
                <TarjetaPrensa estilo={styles.tarjetaDetalle}>
                    <FilaDetalle
                        etiqueta="Materia"
                        valor={`${tituloMateria} (Grupo ${siglaGrupo})`}
                    />
                    <FilaDetalle etiqueta="Fecha y Hora" valor={confirmationData.fechaHora} />
                    <FilaDetalle etiqueta="Sesión" valor={confirmationData.sesionNombre} />
                </TarjetaPrensa>
                <BotonAccion titulo="Volver a Mis Grupos" onPulsar={onVolverAMisGrupos} />
            </View>
        </SafeAreaView>
    );
}

// ─── Vista 4: sin confirmación (timeout de 5 minutos) ───

function VistaTransmisionFinalizada({
    tituloMateria,
    siglaGrupo,
    onReintentar,
    onVolverAMisGrupos,
}: {
    tituloMateria: string;
    siglaGrupo: string;
    onReintentar: () => void;
    onVolverAMisGrupos: () => void;
}) {
    return (
        <SafeAreaView style={styles.area}>
            <View style={styles.columnaCentrada}>
                <CirculoResultado tono="advertencia" icono="⚠️" />
                <ThemedText type="subtitle" style={styles.textoCentrado}>
                    Transmisión Finalizada
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.textoCentrado}>
                    El docente no registró tu presencia en la sesión de {tituloMateria} (Grupo{' '}
                    {siglaGrupo}). Intenta de nuevo o escanea tu dispositivo cercano.
                </ThemedText>
                <View style={styles.acciones}>
                    <BotonAccion titulo="Reintentar" onPulsar={onReintentar} />
                    <BotonAccion
                        titulo="Volver a Mis Grupos"
                        variante="secundario"
                        onPulsar={onVolverAMisGrupos}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
}

// ─── Excepción: Bluetooth apagado ───

function VistaBluetoothApagado({ onEntendido }: { onEntendido: () => void }) {
    return (
        <SafeAreaView style={styles.area}>
            <View style={styles.columnaCentrada}>
                <CirculoResultado tono="advertencia" icono="⚠️" />
                <ThemedText type="subtitle">Bluetooth Apagado</ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.textoCentrado}>
                    Activa el Bluetooth de tu dispositivo para transmitir la señal de presencia.
                </ThemedText>
                <View style={styles.acciones}>
                    <BotonAccion titulo="Entendido" onPulsar={onEntendido} />
                </View>
            </View>
        </SafeAreaView>
    );
}

// ─── Excepción: teléfono sin soporte BLE ───

function VistaSinSoporte({ onVolver }: { onVolver: () => void }) {
    return (
        <SafeAreaView style={styles.area}>
            <View style={styles.columnaCentrada}>
                <CirculoResultado tono="error" icono="⛔" />
                <ThemedText type="subtitle" style={styles.textoCentrado}>
                    Teléfono Sin Soporte
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.textoCentrado}>
                    Tu teléfono no admite la emisión de paquetes BLE de presencia, por lo que no
                    puede transmitir tu identidad al docente.
                </ThemedText>
                <View style={styles.acciones}>
                    <BotonAccion titulo="Volver a Mis Grupos" onPulsar={onVolver} />
                </View>
            </View>
        </SafeAreaView>
    );
}

// ─── Piezas pequeñas ───

function CirculoResultado({ tono, icono }: { tono: Tono; icono: string }) {
    const paleta = Tonos[tono];
    return (
        <View style={[styles.circuloResultado, { backgroundColor: paleta.suave }]}>
            <Text style={[styles.iconoResultado, { color: paleta.solido }]}>{icono}</Text>
        </View>
    );
}

function FilaDetalle({ etiqueta, valor }: { etiqueta: string; valor: string }) {
    return (
        <View style={styles.filaDetalle}>
            <ThemedText type="small" themeColor="textSecondary">
                {etiqueta}
            </ThemedText>
            <ThemedText type="smallBold">{valor}</ThemedText>
        </View>
    );
}

const styles = StyleSheet.create({
    area: {
        flex: 1,
        padding: Spacing.four,
        gap: Spacing.four,
    },
    columna: {
        flex: 1,
        gap: Spacing.four,
    },
    columnaCentrada: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.three,
        paddingHorizontal: Spacing.one,
    },
    cajaRadar: {
        alignItems: 'center',
        gap: Spacing.two,
        padding: Spacing.five,
        borderRadius: 20,
    },
    cajaPayload: {
        width: '100%',
        gap: Spacing.one,
        padding: Spacing.three,
        borderRadius: 12,
    },
    circuloResultado: {
        width: 96,
        height: 96,
        borderRadius: 48,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconoResultado: {
        fontSize: 46,
        lineHeight: 52,
        fontWeight: '700',
    },
    tarjetaDetalle: {
        alignSelf: 'stretch',
        gap: Spacing.two + 2,
    },
    filaDetalle: {
        gap: 2,
    },
    textoCentrado: {
        textAlign: 'center',
        lineHeight: 20,
    },
    acciones: {
        alignSelf: 'stretch',
        gap: Spacing.two + 2,
        marginTop: Spacing.two,
    },
});
