// CU13 (vista STUDENT_DETAIL): desglose individual de marcaciones de un alumno
// para el docente. Reusa la fila de sesión de la vista estudiante.

import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { fechaLegible } from '@/Presentacion/GestionarSesiones/tipos';
import { EncabezadoPantalla } from '@/Presentacion/componentes/EncabezadoPantalla';
import { Insignia } from '@/Presentacion/componentes/Insignia';
import { TarjetaPrensa } from '@/Presentacion/componentes/TarjetaPrensa';
import { ThemedText } from '@/Presentacion/componentes/ThemedText';
import type { EstadoAsistencia } from '@/Negocio/NAsistencia';
import type { PropsVistaDetalleEstudiante } from './tipos';

function tonoDe(estado: EstadoAsistencia): 'exito' | 'error' | 'advertencia' {
    if (estado === 'PRESENTE') return 'exito';
    if (estado === 'LICENCIA') return 'advertencia';
    return 'error';
}

export function VistaDetalleEstudiante({ alumno, marcas, onVolver }: PropsVistaDetalleEstudiante) {
    const theme = useTheme();
    const nombre = `${alumno.nombre} ${alumno.apellidoPaterno ?? ''} ${alumno.apellidoMaterno ?? ''}`.trim();

    return (
        <SafeAreaView style={styles.seguro}>
            <View style={styles.columna}>
                <EncabezadoPantalla
                    titulo={nombre}
                    subtitulo={`Reg: ${alumno.registro}`}
                    onRegresar={onVolver}
                    insignia={<Insignia texto={`${alumno.porcentaje}%`} tono="informacion" />}
                />
                <FlatList
                    data={marcas}
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
                                <Insignia texto={item.estado} tono={tonoDe(item.estado)} />
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
