// CU07: vista de "Mis Grupos" (lado estudiante).
// Vista pura: no navega ni toca hooks; pinta lo que le pasa el orquestador
// (PMisGruposEstudiante) y avisa con acciones claras.

import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { BotonAccion } from '@/Presentacion/componentes/BotonAccion';
import { Tonos } from '@/Presentacion/componentes/Colores';
import { EstadoVacio } from '@/Presentacion/componentes/EstadoVacio';
import { Insignia } from '@/Presentacion/componentes/Insignia';
import { TarjetaPrensa } from '@/Presentacion/componentes/TarjetaPrensa';
import type { PropsVistaMisGrupos } from './tipos';

export function VistaMisGrupos({
    saludo,
    registro,
    misGrupos,
    isRefreshing,
    onRefrescar,
    onEntrarAlGrupo,
    onVincular,
    onConfigurarPerfil,
}: PropsVistaMisGrupos) {
    const theme = useTheme();

    // Sin perfil configurado, primero hay que pasar por la bienvenida (CU01)
    if (!registro) {
        return (
            <SafeAreaView style={styles.seguro}>
                <View style={styles.cajaVacia}>
                    <EstadoVacio
                        icono="👤"
                        titulo="Configura tu perfil para ver tus grupos"
                        mensaje="Vuelve a la pantalla de bienvenida y registra tu perfil de estudiante."
                        accion={
                            <BotonAccion titulo="Configurar Perfil" onPulsar={onConfigurarPerfil} />
                        }
                    />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.seguro}>
            <View style={styles.contenedorColumna}>
                <View style={styles.encabezado}>
                    <Text style={[styles.saludo, { color: theme.text }]}>{`Hola, ${saludo}`}</Text>
                    <Insignia texto={`Estudiante • Reg: ${registro}`} tono="informacion" />
                </View>
                {misGrupos.length === 0 ? (
                    <View style={styles.cajaVacia}>
                        <EstadoVacio
                            icono="📡"
                            titulo="Aún no tienes grupos vinculados"
                            mensaje="Presiona 'Vincular Dispositivo' estando en el aula para registrar las materias impartidas por tu docente."
                            accion={
                                <BotonAccion titulo="Vincular Dispositivo" onPulsar={onVincular} />
                            }
                        />
                    </View>
                ) : (
                    <FlatList
                        data={misGrupos}
                        keyExtractor={(grupo) => grupo.id}
                        contentContainerStyle={styles.lista}
                        refreshControl={
                            <RefreshControl
                                refreshing={isRefreshing}
                                onRefresh={onRefrescar}
                                tintColor={theme.textSecondary}
                            />
                        }
                        renderItem={({ item }) => (
                            <TarjetaPrensa>
                                <Text style={[styles.nombreMateria, { color: theme.text }]}>
                                    {item.nombre}
                                </Text>
                                <View style={styles.filaMateria}>
                                    <Insignia texto={`Grupo ${item.sigla}`} tono="informacion" />
                                </View>
                                <BotonAccion
                                    titulo="Entrar al Grupo"
                                    variante="secundario"
                                    compacto
                                    onPulsar={onEntrarAlGrupo}
                                />
                            </TarjetaPrensa>
                        )}
                    />
                )}
                {misGrupos.length > 0 ? (
                    <Pressable
                        onPress={onVincular}
                        style={({ pressed }) => [
                            styles.fab,
                            {
                                backgroundColor: Tonos.informacion.solido,
                                opacity: pressed ? 0.85 : 1,
                            },
                        ]}
                    >
                        <Text style={styles.textoFab}>+ Vincular Materia</Text>
                    </Pressable>
                ) : null}
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
    },
    encabezado: {
        gap: Spacing.two,
        marginBottom: Spacing.three - 2,
    },
    saludo: {
        fontSize: 24,
        lineHeight: 30,
        fontWeight: '800',
    },
    cajaVacia: {
        flex: 1,
        justifyContent: 'center',
    },
    lista: {
        gap: Spacing.two + 2,
        paddingBottom: Spacing.six,
    },
    nombreMateria: {
        fontSize: 18,
        fontWeight: '700',
    },
    filaMateria: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.three - 2,
    },
    fab: {
        position: 'absolute',
        right: Spacing.four,
        bottom: Spacing.four,
        borderRadius: 999,
        paddingHorizontal: Spacing.four,
        paddingVertical: Spacing.three - 2,
        elevation: 6,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
    },
    textoFab: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '800',
    },
});
