// CU13 (modo docente): métricas generales del grupo y nómina con conteos,
// porcentaje y acceso al desglose individual. El buscador vive en la vista.

import { useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { BarraEstadisticas } from '@/Presentacion/componentes/BarraEstadisticas';
import { Buscador } from '@/Presentacion/componentes/Buscador';
import { EncabezadoPantalla } from '@/Presentacion/componentes/EncabezadoPantalla';
import { EstadoVacio } from '@/Presentacion/componentes/EstadoVacio';
import { Insignia } from '@/Presentacion/componentes/Insignia';
import { TarjetaPrensa } from '@/Presentacion/componentes/TarjetaPrensa';
import { ThemedText } from '@/Presentacion/componentes/ThemedText';
import { Tonos } from '@/Presentacion/componentes/Colores';
import type { PropsVistaHistorialDocente } from './tipos';

export function VistaHistorialDocente({ grupo, resumen, onVolver, onVerDetalle }: PropsVistaHistorialDocente) {
    const theme = useTheme();
    const [busqueda, setBusqueda] = useState('');
    const sigla = `${grupo.nombre}${grupo.extension != null ? ' - ' + grupo.extension : ''}`;

    const texto = busqueda.trim().toLowerCase();
    const visibles = resumen.matriz.filter(
        (alumno) =>
            texto === '' ||
            `${alumno.nombre} ${alumno.apellidoPaterno ?? ''} ${alumno.apellidoMaterno ?? ''}`
                .toLowerCase()
                .includes(texto) ||
            alumno.registro.toLowerCase().includes(texto),
    );

    return (
        <SafeAreaView style={styles.seguro}>
            <View style={styles.columna}>
                <EncabezadoPantalla
                    titulo="Historial de Asistencia del Grupo"
                    onRegresar={onVolver}
                    insignia={<Insignia texto={sigla} tono="informacion" />}
                />
                <BarraEstadisticas
                    elementos={[
                        { etiqueta: 'Promedio', valor: `${resumen.promedio}%`, tono: 'exito', conCheck: true },
                        { etiqueta: 'Clases', valor: resumen.totalSesiones, tono: 'informacion' },
                    ]}
                />
                <Buscador
                    valor={busqueda}
                    onCambiar={setBusqueda}
                    placeholder="Buscar por nombre o registro..."
                />
                <FlatList
                    data={visibles}
                    keyExtractor={(alumno) => alumno.registro}
                    contentContainerStyle={styles.lista}
                    ListEmptyComponent={
                        <EstadoVacio
                            icono="🔍"
                            titulo="Sin coincidencias"
                            mensaje="Ningún alumno coincide con la búsqueda."
                        />
                    }
                    renderItem={({ item }) => (
                        <TarjetaPrensa onPulsar={() => onVerDetalle(item)}>
                            <View style={styles.filaTarjeta}>
                                <View
                                    style={[styles.avatar, { backgroundColor: theme.backgroundSelected }]}
                                >
                                    <Text style={[styles.inicial, { color: theme.text }]}>
                                        {item.nombre.charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                                <View style={styles.columnaTarjeta}>
                                    <Text style={[styles.nombre, { color: theme.text }]}>
                                        {`${item.nombre} ${item.apellidoPaterno ?? ''} ${item.apellidoMaterno ?? ''}`.trim()}
                                    </Text>
                                    <ThemedText type="small" themeColor="textSecondary">
                                        {`Reg: ${item.registro} · ${item.presentes} Presentes / ${item.ausentes} Faltas`}
                                    </ThemedText>
                                    <View
                                        style={[
                                            styles.pista,
                                            { backgroundColor: theme.backgroundSelected },
                                        ]}
                                    >
                                        <View
                                            style={[
                                                styles.relleno,
                                                {
                                                    backgroundColor: Tonos.exito.solido,
                                                    width: `${item.porcentaje}%`,
                                                },
                                            ]}
                                        />
                                    </View>
                                </View>
                                <Text style={[styles.flecha, { color: theme.textSecondary }]}>›</Text>
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
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    inicial: {
        fontSize: 20,
        fontWeight: '800',
    },
    columnaTarjeta: {
        flex: 1,
        gap: 2,
    },
    nombre: {
        fontSize: 16,
        fontWeight: '700',
    },
    pista: {
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
        marginTop: Spacing.two - 4,
    },
    relleno: {
        height: 8,
        borderRadius: 4,
    },
    flecha: {
        fontSize: 24,
        fontWeight: '700',
    },
});
