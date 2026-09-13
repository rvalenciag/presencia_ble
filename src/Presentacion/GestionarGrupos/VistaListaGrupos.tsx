// Vista 1 de CU02: la lista de grupos del docente.
// De solo visión: recibe los grupos y avisa al orquestador qué acción ocurrió.

import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { BotonAccion } from '@/Presentacion/componentes/BotonAccion';
import { EncabezadoPantalla } from '@/Presentacion/componentes/EncabezadoPantalla';
import { EstadoVacio } from '@/Presentacion/componentes/EstadoVacio';
import { Insignia } from '@/Presentacion/componentes/Insignia';
import { TarjetaPrensa } from '@/Presentacion/componentes/TarjetaPrensa';
import { ThemedText } from '@/Presentacion/componentes/ThemedText';
import type { Grupo } from '@/Negocio/NGrupo';

type PropsVistaListaGrupos = {
    grupos: Grupo[];
    conteoPorGrupo: Record<number, number>;
    onCrearGrupo: () => void;
    onEditarGrupo: (grupo: Grupo) => void;
    onBorrarGrupo: (grupo: Grupo) => void;
    onEntrarGrupo: (grupo: Grupo) => void;
};

export function VistaListaGrupos({
    grupos,
    conteoPorGrupo,
    onCrearGrupo,
    onEditarGrupo,
    onBorrarGrupo,
    onEntrarGrupo,
}: PropsVistaListaGrupos) {
    const theme = useTheme();

    return (
        <SafeAreaView style={styles.seguro}>
            <View style={styles.contenedorColumna}>
                <EncabezadoPantalla
                    titulo="Mis Grupos"
                    subtitulo="Gestión de materias académicas"
                    insignia={
                        <BotonAccion titulo="+ Nuevo Grupo" compacto onPulsar={onCrearGrupo} />
                    }
                />
                {grupos.length === 0 ? (
                    <EstadoVacio
                        icono="📚"
                        titulo="Aún no tienes grupos registrados"
                        mensaje="Presiona '+' para crear el primero."
                    />
                ) : (
                    <FlatList
                        data={grupos}
                        keyExtractor={(grupo) => String(grupo.id)}
                        contentContainerStyle={styles.lista}
                        renderItem={({ item }) => {
                            const cantidad = conteoPorGrupo[item.id] ?? 0;
                            return (
                                <TarjetaPrensa onPulsar={() => onEntrarGrupo(item)}>
                                    <View style={styles.filaGrupo}>
                                        <View style={styles.columnaGrupo}>
                                            <Text
                                                style={[styles.nombreGrupo, { color: theme.text }]}
                                            >
                                                {item.nombre}
                                            </Text>
                                            <ThemedText type="small" themeColor="textSecondary">
                                                {`Semestre ${item.semestre ?? '—'} / ${item.anio ?? '—'}`}
                                            </ThemedText>
                                            <ThemedText type="small" themeColor="textSecondary">
                                                {cantidad === 1
                                                    ? '1 estudiante'
                                                    : `${cantidad} estudiantes`}
                                            </ThemedText>
                                        </View>
                                        <Insignia
                                            texto={`Grupo ${item.extension ?? '—'}`}
                                            tono="informacion"
                                        />
                                    </View>
                                    <View style={styles.filaAcciones}>
                                        <Pressable
                                            onPress={() => onEditarGrupo(item)}
                                            hitSlop={8}
                                            style={({ pressed }) => [
                                                styles.botonAccion,
                                                { opacity: pressed ? 0.6 : 1 },
                                            ]}
                                        >
                                            <Text style={styles.iconoAccion}>✏️</Text>
                                        </Pressable>
                                        <Pressable
                                            onPress={() => onBorrarGrupo(item)}
                                            hitSlop={8}
                                            style={({ pressed }) => [
                                                styles.botonAccion,
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
            </View>
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
        gap: Spacing.three,
    },
    lista: {
        gap: Spacing.two + 2,
        paddingBottom: Spacing.three,
    },
    filaGrupo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: Spacing.two,
    },
    columnaGrupo: {
        flex: 1,
        gap: 2,
    },
    nombreGrupo: {
        fontSize: 17,
        fontWeight: '700',
    },
    filaAcciones: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: Spacing.three - 2,
    },
    botonAccion: {
        padding: Spacing.two - 2,
    },
    iconoAccion: {
        fontSize: 18,
    },
});
