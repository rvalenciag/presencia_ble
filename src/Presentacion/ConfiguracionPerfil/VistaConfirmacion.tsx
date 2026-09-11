// Vista 3 de CU01: confirmación con el resumen del perfil guardado.
// Solo muestra el resultado; la navegación la decide el orquestador.

import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { BotonAccion } from '@/Presentacion/componentes/BotonAccion';
import { Insignia } from '@/Presentacion/componentes/Insignia';
import { TarjetaPrensa } from '@/Presentacion/componentes/TarjetaPrensa';
import { ThemedText } from '@/Presentacion/componentes/ThemedText';
import { Tonos } from '@/Presentacion/componentes/Colores';
import type { Rol } from '@/Negocio/NPerfil';
import type { DatosFormulario } from './tipos';

type PropsVistaConfirmacion = {
    rol: Rol | null;
    formData: DatosFormulario;
    uuid: string;
    onIrAMisGrupos: () => void;
};

export function VistaConfirmacion({ rol, formData, uuid, onIrAMisGrupos }: PropsVistaConfirmacion) {
    const theme = useTheme();

    const iniciales =
        `${formData.nombre.charAt(0)}${formData.apellidoPaterno.charAt(0)}`.toUpperCase();
    const nombreCompleto =
        `${formData.nombre} ${formData.apellidoPaterno} ${formData.apellidoMaterno}`.trim();

    return (
        <SafeAreaView style={styles.seguro}>
            <ScrollView contentContainerStyle={styles.contenidoCentrado}>
                <View style={[styles.circuloExito, { backgroundColor: Tonos.exito.suave }]}>
                    <Text style={styles.iconoExito}>✔</Text>
                </View>
                <Text style={[styles.tituloExito, { color: theme.text }]}>
                    ¡Perfil Configurado con Éxito!
                </Text>
                <TarjetaPrensa estilo={styles.tarjetaPerfil}>
                    <View style={styles.filaPerfil}>
                        <View style={[styles.avatar, { backgroundColor: Tonos.informacion.suave }]}>
                            <Text style={styles.iniciales}>{iniciales}</Text>
                        </View>
                        <View style={styles.columnaPerfil}>
                            <Text style={[styles.nombreCompleto, { color: theme.text }]}>
                                {nombreCompleto}
                            </Text>
                            <Insignia
                                texto={rol ?? ''}
                                tono={rol === 'DOCENTE' ? 'informacion' : 'exito'}
                            />
                        </View>
                    </View>
                    <View style={styles.datosPerfil}>
                        <View style={styles.datoPerfil}>
                            <ThemedText type="small" themeColor="textSecondary">
                                Registro
                            </ThemedText>
                            <ThemedText type="smallBold">{formData.registro}</ThemedText>
                        </View>
                        <View style={styles.datoPerfil}>
                            <ThemedText type="small" themeColor="textSecondary">
                                Correo
                            </ThemedText>
                            <ThemedText type="smallBold">{formData.correo}</ThemedText>
                        </View>
                        {rol === 'ESTUDIANTE' ? (
                            <View style={styles.datoPerfil}>
                                <ThemedText type="small" themeColor="textSecondary">
                                    Carrera
                                </ThemedText>
                                <ThemedText type="smallBold">{formData.carrera}</ThemedText>
                            </View>
                        ) : null}
                        <View style={styles.datoPerfil}>
                            <ThemedText type="small" themeColor="textSecondary">
                                UUID
                            </ThemedText>
                            <ThemedText type="code">{uuid}</ThemedText>
                        </View>
                    </View>
                </TarjetaPrensa>
                <BotonAccion
                    titulo={`Ir a Mis Grupos (${rol === 'DOCENTE' ? 'Docente' : 'Estudiante'})`}
                    onPulsar={onIrAMisGrupos}
                />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    seguro: {
        flex: 1,
    },
    contenidoCentrado: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: Spacing.four,
        paddingVertical: Spacing.four,
        gap: Spacing.three + 2,
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
        fontFamily: Fonts.mono,
    },
    tituloExito: {
        fontSize: 24,
        fontWeight: '700',
        textAlign: 'center',
    },
    tarjetaPerfil: {
        gap: Spacing.three,
    },
    filaPerfil: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.three - 2,
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iniciales: {
        fontSize: 22,
        fontWeight: '800',
        color: Tonos.informacion.solido,
    },
    nombreCompleto: {
        fontSize: 18,
        fontWeight: '700',
    },
    columnaPerfil: {
        flex: 1,
        gap: 2,
    },
    datosPerfil: {
        gap: Spacing.two + 2,
    },
    datoPerfil: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: Spacing.two,
    },
});
