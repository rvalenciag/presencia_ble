// CU12 (vista ATTENDANCE_LIST): nómina consolidada de la sesión con métricas,
// buscador, filtros por estado y cambio de estado por alumno. No navega:
// avisa al orquestador qué alumno cambiar.

import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { BarraEstadisticas } from '@/Presentacion/componentes/BarraEstadisticas';
import { BotonAccion } from '@/Presentacion/componentes/BotonAccion';
import { Buscador } from '@/Presentacion/componentes/Buscador';
import { EncabezadoPantalla } from '@/Presentacion/componentes/EncabezadoPantalla';
import { EstadoVacio } from '@/Presentacion/componentes/EstadoVacio';
import { Insignia } from '@/Presentacion/componentes/Insignia';
import { TarjetaPrensa } from '@/Presentacion/componentes/TarjetaPrensa';
import { ThemedText } from '@/Presentacion/componentes/ThemedText';
import { Tonos } from '@/Presentacion/componentes/Colores';
import type { AlumnoConEstado, EstadoAsistencia } from '@/Negocio/NAsistencia';
import type { FiltroAsistencia, PropsVistaListaConsolidada } from './tipos';

const FILTROS: { id: FiltroAsistencia; titulo: string }[] = [
    { id: 'TODOS', titulo: 'Todos' },
    { id: 'PRESENTES', titulo: 'Presentes' },
    { id: 'AUSENTES', titulo: 'Ausentes' },
    { id: 'LICENCIAS', titulo: 'Licencias' },
];

// El chip de estado de cada tarjeta (mismos colores del spec)
function tonoDe(estado: EstadoAsistencia): 'exito' | 'error' | 'advertencia' {
    if (estado === 'PRESENTE') return 'exito';
    if (estado === 'LICENCIA') return 'advertencia';
    return 'error';
}

function pasaFiltro(alumno: AlumnoConEstado, filtro: FiltroAsistencia): boolean {
    if (filtro === 'TODOS') return true;
    if (filtro === 'PRESENTES') return alumno.estado === 'PRESENTE';
    if (filtro === 'AUSENTES') return alumno.estado === 'AUSENTE';
    return alumno.estado === 'LICENCIA';
}

export function VistaListaConsolidada({
    tituloSesion,
    fechaSesion,
    presentes,
    ausentes,
    licencias,
    alumnos,
    onVolver,
    onCambiarEstado,
}: PropsVistaListaConsolidada) {
    const theme = useTheme();
    const [busqueda, setBusqueda] = useState('');
    const [filtro, setFiltro] = useState<FiltroAsistencia>('TODOS');

    const texto = busqueda.trim().toLowerCase();
    const visibles = alumnos.filter(
        (alumno) =>
            pasaFiltro(alumno, filtro) &&
            (texto === '' ||
                alumno.nombre.toLowerCase().includes(texto) ||
                alumno.registro.toLowerCase().includes(texto)),
    );

    return (
        <SafeAreaView style={styles.seguro}>
            <View style={styles.columna}>
                <EncabezadoPantalla
                    titulo="Control de Asistencia"
                    onRegresar={onVolver}
                    insignia={<Insignia texto={tituloSesion} tono="informacion" />}
                />
                <ThemedText type="small" themeColor="textSecondary">
                    {fechaSesion}
                </ThemedText>
                <BarraEstadisticas
                    elementos={[
                        { etiqueta: 'Presentes', valor: presentes, tono: 'exito', conCheck: true },
                        { etiqueta: 'Ausentes', valor: ausentes, tono: 'error' },
                        { etiqueta: 'Licencias', valor: licencias, tono: 'advertencia' },
                    ]}
                />
                <Buscador
                    valor={busqueda}
                    onCambiar={setBusqueda}
                    placeholder="Buscar por nombre o registro..."
                />
                <View style={styles.filaFiltros}>
                    {FILTROS.map((opcion) => {
                        const activo = filtro === opcion.id;
                        return (
                            <Pressable
                                key={opcion.id}
                                onPress={() => setFiltro(opcion.id)}
                                style={[
                                    styles.chip,
                                    {
                                        backgroundColor: activo
                                            ? Tonos.informacion.suave
                                            : theme.backgroundElement,
                                        borderColor: activo
                                            ? Tonos.informacion.solido
                                            : 'transparent',
                                    },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.chipTexto,
                                        {
                                            color: activo
                                                ? Tonos.informacion.solido
                                                : theme.textSecondary,
                                        },
                                    ]}
                                >
                                    {opcion.titulo}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>

                {alumnos.length === 0 ? (
                    <View style={styles.cajaVacia}>
                        <EstadoVacio
                            icono="📝"
                            titulo="Sin alumnos en la lista"
                            mensaje="Este grupo aún no tiene nómina para controlar."
                            accion={
                                <BotonAccion
                                    titulo="Volver"
                                    variante="secundario"
                                    onPulsar={onVolver}
                                />
                            }
                        />
                    </View>
                ) : (
                    <FlatList
                        data={visibles}
                        keyExtractor={(alumno) => alumno.registro}
                        contentContainerStyle={styles.lista}
                        ListEmptyComponent={
                            <EstadoVacio
                                icono="🔍"
                                titulo="Sin coincidencias"
                                mensaje="Ningún alumno coincide con la búsqueda o el filtro."
                            />
                        }
                        renderItem={({ item }) => (
                            <TarjetaPrensa>
                                <View style={styles.filaTarjeta}>
                                    <View
                                        style={[
                                            styles.avatar,
                                            { backgroundColor: theme.backgroundSelected },
                                        ]}
                                    >
                                        <Text style={[styles.inicial, { color: theme.text }]}>
                                            {item.nombre.charAt(0).toUpperCase()}
                                        </Text>
                                    </View>
                                    <View style={styles.columnaTarjeta}>
                                        <Text style={[styles.nombre, { color: theme.text }]}>
                                            {item.nombre}
                                        </Text>
                                        <ThemedText type="small" themeColor="textSecondary">
                                            {`Reg: ${item.registro}`}
                                        </ThemedText>
                                    </View>
                                    <Insignia texto={item.estado} tono={tonoDe(item.estado)} />
                                </View>
                                <View style={styles.filaAcciones}>
                                    {item.metodo === 'MANUAL' ? (
                                        <Insignia texto="✏️ Manual" tono="neutro" />
                                    ) : null}
                                    <View style={styles.botonCambiar}>
                                        <BotonAccion
                                            titulo="Cambiar Estado"
                                            variante="secundario"
                                            compacto
                                            onPulsar={() => onCambiarEstado(item)}
                                        />
                                    </View>
                                </View>
                            </TarjetaPrensa>
                        )}
                    />
                )}
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
    filaFiltros: {
        flexDirection: 'row',
        gap: Spacing.two - 2,
    },
    chip: {
        flex: 1,
        borderRadius: 999,
        borderWidth: 1.5,
        paddingVertical: Spacing.two - 2,
        alignItems: 'center',
    },
    chipTexto: {
        fontSize: 13,
        fontWeight: '700',
    },
    cajaVacia: {
        flex: 1,
        justifyContent: 'center',
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
    filaAcciones: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.two,
        marginTop: Spacing.two,
    },
    botonCambiar: {
        flex: 1,
    },
});
