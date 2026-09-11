// Vistas del CU11 (Escanear Asistencia): Pre-Escaneo, Radar Escáner activo,
// Resumen Finalizado y la excepción de Permisos Denegados. Solo reciben props
// del orquestador (nunca tocan Datos ni Negocio — ADR-008).

import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
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
import type { AlumnoDetectado } from '@/Negocio/NEscanearAsistencia';

import type { PropsVistaEscanearAsistencia } from './tipos';

type RestoProps = Omit<PropsVistaEscanearAsistencia, 'scanningState'>;

export function VistaEscanearAsistencia({ scanningState, ...rest }: PropsVistaEscanearAsistencia) {
    if (scanningState === 'SCANNING') {
        return <VistaRadarEscaneo {...rest} />;
    }

    if (scanningState === 'FINISHED') {
        return <VistaResumenEscaneo {...rest} />;
    }

    if (scanningState === 'PERMISSIONS_DENIED') {
        return <VistaPermisosDenegados {...rest} />;
    }

    // scanningState === 'READY'
    return <VistaPreEscaneo {...rest} />;
}

// ─── Vista 1: preparación / parámetros ───

function VistaPreEscaneo({
    tituloSesion,
    siglaGrupo,
    inscritos,
    onIniciarEscaneo,
    onVolverASesiones,
}: RestoProps) {
    return (
        <SafeAreaView style={styles.area}>
            <View style={styles.columna}>
                <EncabezadoPantalla
                    titulo={tituloSesion}
                    onRegresar={onVolverASesiones}
                    insignia={<Insignia texto={siglaGrupo} tono="informacion" />}
                />
                <TarjetaPrensa>
                    <FilaParametro
                        icono="📡"
                        titulo="Filtro de Proximidad"
                        detalle="RSSI ≥ -60 dBm"
                        complemento={<Insignia texto="Cerca" tono="exito" />}
                    />
                    <FilaParametro
                        icono="👥"
                        titulo="Estudiantes Inscritos"
                        detalle={`${inscritos} Alumnos`}
                    />
                    <ThemedText type="small" themeColor="textSecondary">
                        Presiona el botón e inicia la caminata por el aula acercándote a los bancos
                        de los alumnos.
                    </ThemedText>
                </TarjetaPrensa>
                <BotonAccion
                    titulo="Iniciar Escaneo de Asistencia"
                    variante="exito"
                    onPulsar={onIniciarEscaneo}
                />
            </View>
        </SafeAreaView>
    );
}

// ─── Vista 2: radar BLE activo + lista en vivo ───

function VistaRadarEscaneo({
    inscritos,
    presentes,
    detectedStudents,
    lastDetected,
    onDetenerEscaneo,
}: RestoProps) {
    const theme = useTheme();

    return (
        <SafeAreaView style={styles.area}>
            <View style={styles.columna}>
                <EncabezadoPantalla
                    titulo={`Presentes: ${presentes} / ${inscritos}`}
                    insignia={<Insignia texto="En directo" tono="exito" />}
                />
                <View style={[styles.cajaRadar, { backgroundColor: theme.backgroundElement }]}>
                    <RadarBluetooth />
                    <ThemedText type="smallBold">Escaneando estudiantes…</ThemedText>
                    <Insignia texto="Filtrando señales RSSI ≥ -60 dBm" tono="informacion" />
                </View>
                <PopupAlumnoDetectado lastDetected={lastDetected} />
                <ThemedText type="smallBold">Alumnos detectados ({presentes})</ThemedText>
                <ScrollView style={styles.lista} contentContainerStyle={styles.listaContenido}>
                    {detectedStudents.map((alumno) => (
                        <TarjetaAlumno key={alumno.registro} alumno={alumno} />
                    ))}
                </ScrollView>
                <BotonAccion
                    titulo="Detener Escaneo"
                    variante="destructivo"
                    onPulsar={onDetenerEscaneo}
                />
            </View>
        </SafeAreaView>
    );
}

// Tarjeta emergente temporal que confirma la última captura (spec CU11, se
// oculta sola a los ~2.8 segundos; la lista en vivo conserva la captura).
// El ocultado se marca cuando AÚN está visible (sin setState síncrono en el
// efecto): si llega una detección nueva, la tarjeta se destapa sola.
function PopupAlumnoDetectado({ lastDetected }: { lastDetected: AlumnoDetectado | null }) {
    const [oculta, setOculta] = useState<AlumnoDetectado | null>(null);
    const visible = lastDetected != null && oculta !== lastDetected;

    useEffect(() => {
        if (!lastDetected) return;
        const temporizador = setTimeout(() => setOculta(lastDetected), 2800);
        return () => clearTimeout(temporizador);
    }, [lastDetected]);

    if (!visible || !lastDetected) return null;

    return (
        <View style={styles.popup}>
            <Text style={styles.popupCheck}>✔</Text>
            <View style={styles.popupDatos}>
                <ThemedText type="smallBold" style={styles.textoBlanco} numberOfLines={1}>
                    {lastDetected.nombre}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.textoBlanco}>
                    Reg: {lastDetected.registro}
                </ThemedText>
            </View>
        </View>
    );
}

function TarjetaAlumno({ alumno }: { alumno: AlumnoDetectado }) {
    const theme = useTheme();
    return (
        <View style={[styles.tarjetaAlumno, { backgroundColor: theme.backgroundElement }]}>
            <View style={[styles.avatar, { backgroundColor: Tonos.exito.suave }]}>
                <ThemedText type="smallBold" style={styles.avatarTexto}>
                    {alumno.nombre.charAt(0).toUpperCase()}
                </ThemedText>
            </View>
            <View style={styles.datosAlumno}>
                <ThemedText type="smallBold" numberOfLines={1}>
                    {alumno.nombre}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                    Reg: {alumno.registro} · {horaAmPm(alumno.hora)}
                </ThemedText>
            </View>
            <Insignia texto={`${alumno.rssi} dBm`} tono="exito" />
        </View>
    );
}

// ─── Vista 3: resumen y cierre ───

function VistaResumenEscaneo({
    inscritos,
    presentes,
    ausentes,
    onVerListaCompleta,
    onVolverASesiones,
}: RestoProps) {
    const theme = useTheme();

    return (
        <SafeAreaView style={styles.area}>
            <View style={styles.columnaCentrada}>
                <CirculoResultado tono="exito" icono="✓" />
                <ThemedText type="subtitle">Escaneo Finalizado</ThemedText>
                <View
                    style={[styles.tarjetaMetricas, { backgroundColor: theme.backgroundElement }]}
                >
                    <FilaMetrica etiqueta="Presentes" valor={`${presentes}`} tono="exito" />
                    <FilaMetrica etiqueta="Ausentes" valor={`${ausentes}`} tono="advertencia" />
                    <FilaMetrica
                        etiqueta="Total Inscritos"
                        valor={`${inscritos}`}
                        tono="informacion"
                    />
                </View>
                <View style={styles.acciones}>
                    <BotonAccion
                        titulo="Ver Lista Completa de Asistencia"
                        onPulsar={onVerListaCompleta}
                    />
                    <BotonAccion
                        titulo="Volver a Sesiones"
                        variante="secundario"
                        onPulsar={onVolverASesiones}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
}

// ─── Excepción: permisos denegados / Bluetooth apagado ───

function VistaPermisosDenegados({ onAbrirAjustes, onVolverASesiones }: RestoProps) {
    return (
        <SafeAreaView style={styles.area}>
            <View style={styles.columnaCentrada}>
                <CirculoResultado tono="advertencia" icono="⚠️" />
                <ThemedText type="subtitle" style={styles.textoCentrado}>
                    Permisos Denegados
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.textoCentrado}>
                    Para escanear asistencia, la app necesita el permiso de Bluetooth y de ubicación
                    cercana.
                </ThemedText>
                <View style={styles.acciones}>
                    <BotonAccion titulo="Abrir Ajustes" onPulsar={onAbrirAjustes} />
                    <BotonAccion
                        titulo="Volver a Sesiones"
                        variante="secundario"
                        onPulsar={onVolverASesiones}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
}

// ─── Piezas pequeñas ───

function FilaParametro({
    icono,
    titulo,
    detalle,
    complemento,
}: {
    icono: string;
    titulo: string;
    detalle: string;
    complemento?: React.ReactNode;
}) {
    return (
        <View style={styles.filaParametro}>
            <Text style={styles.iconoParametro}>{icono}</Text>
            <View style={styles.datosParametro}>
                <ThemedText type="smallBold">{titulo}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                    {detalle}
                </ThemedText>
            </View>
            {complemento}
        </View>
    );
}

function FilaMetrica({ etiqueta, valor, tono }: { etiqueta: string; valor: string; tono: Tono }) {
    const paleta = Tonos[tono];
    return (
        <View style={styles.filaMetrica}>
            <ThemedText type="small" themeColor="textSecondary">
                {etiqueta}
            </ThemedText>
            <Text style={[styles.valorMetrica, { color: paleta.solido }]}>{valor}</Text>
        </View>
    );
}

function CirculoResultado({ tono, icono }: { tono: Tono; icono: string }) {
    const paleta = Tonos[tono];
    return (
        <View style={[styles.circuloResultado, { backgroundColor: paleta.suave }]}>
            <Text style={[styles.iconoResultado, { color: paleta.solido }]}>{icono}</Text>
        </View>
    );
}

// 'YYYY-MM-DD HH:MM:SS' → 'HH:MM AM' (hora visible en las tarjetas de CU11)
function horaAmPm(fechaHora: string): string {
    if (!fechaHora) return '';
    const partes = fechaHora.split(' ');
    if (partes.length < 2) return fechaHora;
    const [horas, minutos] = partes[1].split(':').map(Number);
    if (!Number.isFinite(horas) || !Number.isFinite(minutos)) return fechaHora;
    const esPm = horas >= 12;
    const horas12 = horas % 12 || 12;
    return `${String(horas12).padStart(2, '0')}:${String(minutos).padStart(2, '0')} ${esPm ? 'PM' : 'AM'}`;
}

const styles = StyleSheet.create({
    area: {
        flex: 1,
        padding: Spacing.four,
        gap: Spacing.four,
    },
    columna: {
        flex: 1,
        gap: Spacing.three,
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
        padding: Spacing.four,
        borderRadius: 20,
    },
    lista: {
        flex: 1,
    },
    listaContenido: {
        gap: Spacing.two,
        paddingBottom: Spacing.two,
    },
    filaParametro: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.three,
    },
    iconoParametro: {
        fontSize: 22,
    },
    datosParametro: {
        flex: 1,
        gap: 1,
    },
    popup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.two,
        backgroundColor: Tonos.exito.solido,
        borderRadius: 14,
        padding: Spacing.three,
    },
    popupCheck: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    popupDatos: {
        flex: 1,
        gap: 1,
    },
    textoBlanco: {
        color: '#FFFFFF',
    },
    tarjetaAlumno: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.two + 2,
        borderRadius: 14,
        padding: Spacing.two + 2,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarTexto: {
        color: Tonos.exito.solido,
    },
    datosAlumno: {
        flex: 1,
        gap: 1,
    },
    tarjetaMetricas: {
        alignSelf: 'stretch',
        borderRadius: 16,
        padding: Spacing.three,
        gap: Spacing.two + 2,
    },
    filaMetrica: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    valorMetrica: {
        fontSize: 20,
        fontWeight: '700',
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
