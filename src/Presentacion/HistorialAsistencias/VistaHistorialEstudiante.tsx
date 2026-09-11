// CU13 (modo estudiante): resumen de desempeño con porcentaje global y lista
// cronológica de sesiones. La barra de progreso es lineal (desviación: el spec
// pedía circular; se documenta en flow/CU13).

import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { fechaLegible } from '@/Presentacion/GestionarSesiones/tipos';
import { BarraEstadisticas } from '@/Presentacion/componentes/BarraEstadisticas';
import { EncabezadoPantalla } from '@/Presentacion/componentes/EncabezadoPantalla';
import { Insignia } from '@/Presentacion/componentes/Insignia';
import { TarjetaPrensa } from '@/Presentacion/componentes/TarjetaPrensa';
import { ThemedText } from '@/Presentacion/componentes/ThemedText';
import { Tonos } from '@/Presentacion/componentes/Colores';
import type { EstadoAsistencia } from '@/Negocio/NAsistencia';
import type { PropsVistaHistorialEstudiante } from './tipos';

// Verde >= 80%, naranja 65–79%, rojo < 65% (spec CU13)
function tonoDe(porcentaje: number): 'exito' | 'advertencia' | 'error' {
    if (porcentaje >= 80) return 'exito';
    if (porcentaje >= 65) return 'advertencia';
    return 'error';
}

function tonoEstado(estado: EstadoAsistencia): 'exito' | 'error' | 'advertencia' {
    if (estado === 'PRESENTE') return 'exito';
    if (estado === 'LICENCIA') return 'advertencia';
    return 'error';
}

export function VistaHistorialEstudiante({ grupo, resumen, onVolver }: PropsVistaHistorialEstudiante) {
    const theme = useTheme();
    const tono = tonoDe(resumen.porcentaje);
    const sigla = `${grupo.nombre}${grupo.extension != null ? ' - ' + grupo.extension : ''}`;

    return (
        <SafeAreaView style={styles.seguro}>
            <View style={styles.columna}>
                <EncabezadoPantalla
                    titulo="Mi Historial de Asistencia"
                    onRegresar={onVolver}
                    insignia={<Insignia texto={sigla} tono="informacion" />}
                />
                <View style={[styles.tarjetaResumen, { backgroundColor: theme.backgroundElement }]}>
                    <Text style={[styles.porcentaje, { color: Tonos[tono].solido }]}>
                        {`${resumen.porcentaje}%`}
                    </Text>
                    <View style={[styles.pista, { backgroundColor: theme.backgroundSelected }]}>
                        <View
                            style={[
                                styles.relleno,
                                {
                                    backgroundColor: Tonos[tono].solido,
                                    width: `${resumen.porcentaje}%`,
                                },
                            ]}
                        />
                    </View>
                    <ThemedText type="small" themeColor="textSecondary">
                        Asistencia global
                    </ThemedText>
                </View>
                <BarraEstadisticas
                    elementos={[
                        { etiqueta: 'Presentes', valor: resumen.presentes, tono: 'exito', conCheck: true },
                        { etiqueta: 'Ausentes', valor: resumen.ausentes, tono: 'error' },
                        { etiqueta: 'Licencias', valor: resumen.licencias, tono: 'advertencia' },
                    ]}
                />
                <FlatList
                    data={resumen.lista}
                    keyExtractor={(marca) => String(marca.idSesion)}
                    contentContainerStyle={styles.lista}
                    renderItem={({ item }) => (
                        <TarjetaPrensa>
                            <View style={styles.filaTarjeta}>
                                <View style={styles.columnaTarjeta}>
                                    <Text style={[styles.tituloSesion, { color: theme.text }]}>
                                        {item.nombreSesion}
                                    </Text>
                                    <ThemedText type="small" themeColor="textSecondary">
                                        {fechaLegible(item.fechaHoraSesion)}
                                    </ThemedText>
                                </View>
                                <Insignia texto={item.estado} tono={tonoEstado(item.estado)} />
                            </View>
                        </TarjetaPrensa>
                    )}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    seguro: {
        flex: 1,
    },
    columna: {
        flex: 1,
        paddingHorizontal: Spacing.four,
        paddingVertical: Spacing.three,
        gap: Spacing.three - 2,
    },
    tarjetaResumen: {
        borderRadius: 16,
        padding: Spacing.four,
        gap: Spacing.two,
        alignItems: 'center',
    },
    porcentaje: {
        fontSize: 44,
        fontWeight: '800',
    },
    pista: {
        height: 12,
        borderRadius: 6,
        alignSelf: 'stretch',
        overflow: 'hidden',
    },
    relleno: {
        height: 12,
        borderRadius: 6,
    },
    lista: {
        gap: Spacing.two - 2,
        paddingBottom: Spacing.three,
    },
    filaTarjeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.two + 2,
    },
    columnaTarjeta: {
        flex: 1,
        gap: 2,
    },
    tituloSesion: {
        fontSize: 16,
        fontWeight: '700',
    },
});
