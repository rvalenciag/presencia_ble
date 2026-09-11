// Vista 1 de CU01: elegir entre Docente y Estudiante.
// Solo muestra las dos tarjetas y avisa cuál se eligió; el estado vive en el orquestador.

import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { EncabezadoPantalla } from '@/Presentacion/componentes/EncabezadoPantalla';
import { TarjetaPrensa } from '@/Presentacion/componentes/TarjetaPrensa';
import { ThemedText } from '@/Presentacion/componentes/ThemedText';
import type { Rol } from '@/Negocio/NPerfil';

type PropsVistaSeleccionRol = {
    onSeleccionarRol: (rol: Rol) => void;
};

export function VistaSeleccionRol({ onSeleccionarRol }: PropsVistaSeleccionRol) {
    const theme = useTheme();

    return (
        <SafeAreaView style={styles.seguro}>
            <ScrollView contentContainerStyle={styles.contenidoCentrado}>
                <EncabezadoPantalla
                    centrado
                    titulo="Bienvenido a Presencia BLE"
                    subtitulo="Selecciona tu rol en la plataforma para comenzar"
                />
                <TarjetaPrensa
                    onPulsar={() => onSeleccionarRol('DOCENTE')}
                    estilo={styles.tarjetaRol}
                >
                    <Text style={styles.iconoRol}>👨‍🏫</Text>
                    <Text style={[styles.tituloTarjetaRol, { color: theme.text }]}>Docente</Text>
                    <ThemedText
                        type="small"
                        themeColor="textSecondary"
                        style={styles.descripcionRol}
                    >
                        Crea grupos, habilita el enrolamiento y toma asistencia
                    </ThemedText>
                </TarjetaPrensa>
                <TarjetaPrensa
                    onPulsar={() => onSeleccionarRol('ESTUDIANTE')}
                    estilo={styles.tarjetaRol}
                >
                    <Text style={styles.iconoRol}>🎓</Text>
                    <Text style={[styles.tituloTarjetaRol, { color: theme.text }]}>Estudiante</Text>
                    <ThemedText
                        type="small"
                        themeColor="textSecondary"
                        style={styles.descripcionRol}
                    >
                        Vincúlate a materias y transmite tu presencia en el aula
                    </ThemedText>
                </TarjetaPrensa>
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
    tarjetaRol: {
        alignItems: 'center',
        paddingVertical: Spacing.four,
        gap: Spacing.two + 2,
    },
    iconoRol: {
        fontSize: 44,
    },
    tituloTarjetaRol: {
        fontSize: 22,
        fontWeight: '700',
    },
    descripcionRol: {
        textAlign: 'center',
    },
});
