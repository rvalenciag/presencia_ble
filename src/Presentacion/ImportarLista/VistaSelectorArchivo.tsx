// CU03 (vista FILE_PICKER): botón para abrir el selector de archivos del teléfono,
// formato admitido y mensaje de error si el archivo no se pudo procesar.

import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { BotonAccion } from '@/Presentacion/componentes/BotonAccion';
import { EncabezadoPantalla } from '@/Presentacion/componentes/EncabezadoPantalla';
import { Insignia } from '@/Presentacion/componentes/Insignia';
import { ThemedText } from '@/Presentacion/componentes/ThemedText';
import { Tonos } from '@/Presentacion/componentes/Colores';
import type { DGrupo } from '@/Negocio/NGrupo';

type PropsVistaSelectorArchivo = {
    grupo: DGrupo;
    errorMensaje: string | null;
    onRegresar: () => void;
    onBuscar: () => void;
};

export function VistaSelectorArchivo({
    grupo,
    errorMensaje,
    onRegresar,
    onBuscar,
}: PropsVistaSelectorArchivo) {
    const theme = useTheme();
    const nombreCarrera = `${grupo.nombre} - Grupo ${grupo.extension ?? '—'}`;

    return (
        <SafeAreaView style={styles.seguro}>
            <ScrollView contentContainerStyle={styles.contenido}>
                <EncabezadoPantalla
                    titulo="Importar Estudiantes"
                    onRegresar={onRegresar}
                    insignia={<Insignia texto={nombreCarrera} tono="informacion" />}
                />
                <View style={[styles.areaCarga, { borderColor: theme.textSecondary }]}>
                    <Text style={styles.iconoDocumento}>📊</Text>
                    <Text style={[styles.instruccion, { color: theme.text }]}>
                        Selecciona la lista oficial de la materia
                    </Text>
                    <ThemedText type="small" themeColor="textSecondary">
                        Archivos aceptados: .xlsx, .csv
                    </ThemedText>
                    <BotonAccion titulo="Buscar Archivo en el Teléfono" onPulsar={onBuscar} />
                    {errorMensaje ? (
                        <Text style={[styles.error, { color: Tonos.error.solido }]}>
                            {errorMensaje}
                        </Text>
                    ) : null}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    seguro: {
        flex: 1,
    },
    contenido: {
        paddingHorizontal: Spacing.four,
        paddingVertical: Spacing.three,
        gap: Spacing.three,
    },
    areaCarga: {
        borderWidth: 2,
        borderStyle: 'dashed',
        borderRadius: 20,
        padding: Spacing.four,
        alignItems: 'center',
        gap: Spacing.two + 2,
    },
    iconoDocumento: {
        fontSize: 44,
    },
    instruccion: {
        fontSize: 17,
        fontWeight: '700',
        textAlign: 'center',
    },
    error: {
        fontSize: 14,
        textAlign: 'center',
        fontStyle: 'italic',
    },
});
