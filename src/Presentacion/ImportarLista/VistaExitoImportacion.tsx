// CU03 (vista SUCCESS): desglose de la importación y salida hacia la lista del grupo.

import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { BotonAccion } from '@/Presentacion/componentes/BotonAccion';
import { ThemedText } from '@/Presentacion/componentes/ThemedText';
import { Tonos } from '@/Presentacion/componentes/Colores';
import type { ResultadoImportacion } from '@/Negocio/NNomina';

type PropsVistaExitoImportacion = {
    resultado: ResultadoImportacion;
    onVerLista: () => void;
    onRegresar: () => void;
};

export function VistaExitoImportacion({
    resultado,
    onVerLista,
    onRegresar,
}: PropsVistaExitoImportacion) {
    const theme = useTheme();

    return (
        <SafeAreaView style={styles.seguro}>
            <ScrollView contentContainerStyle={styles.contenidoCentrado}>
                <View style={[styles.circuloExito, { backgroundColor: Tonos.exito.suave }]}>
                    <Text style={styles.iconoExito}>✔</Text>
                </View>
                <Text style={[styles.tituloExito, { color: theme.text }]}>
                    ¡Importación Completada!
                </Text>
                <ThemedText type="small" themeColor="textSecondary" style={styles.lineaResultado}>
                    {`${resultado.nuevos} alumnos importados correctamente al grupo`}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.lineaResultado}>
                    {`${resultado.duplicados} alumnos ignorados por estar registrados previamente`}
                </ThemedText>
                <BotonAccion titulo="Ver Lista del Grupo" onPulsar={onVerLista} />
                <BotonAccion titulo="Volver al Grupo" variante="secundario" onPulsar={onRegresar} />
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
        gap: Spacing.two + 2,
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
    },
    tituloExito: {
        fontSize: 24,
        fontWeight: '700',
        textAlign: 'center',
    },
    lineaResultado: {
        textAlign: 'center',
    },
});
