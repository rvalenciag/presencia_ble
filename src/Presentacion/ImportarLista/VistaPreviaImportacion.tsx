// CU03 (vista PREVIEW): resumen y lista scrollable de lo leído del archivo,
// con cada alumno marcado como "Nuevo" o "Ya inscrito".

import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { BotonAccion } from '@/Presentacion/componentes/BotonAccion';
import { Insignia } from '@/Presentacion/componentes/Insignia';
import { TarjetaPrensa } from '@/Presentacion/componentes/TarjetaPrensa';
import { ThemedText } from '@/Presentacion/componentes/ThemedText';
import type { AlumnoImportado } from '@/Negocio/NNomina';
import { textoCarrera } from '@/Negocio/NEstudiante';

type PropsVistaPreviaImportacion = {
    nombreArchivo: string;
    alumnosImportados: AlumnoImportado[];
    onConfirmar: () => void;
    onElegirOtro: () => void;
};

export function VistaPreviaImportacion({
    nombreArchivo,
    alumnosImportados,
    onConfirmar,
    onElegirOtro,
}: PropsVistaPreviaImportacion) {
    const theme = useTheme();

    const total = alumnosImportados.length;
    const nuevos = alumnosImportados.filter(
        (alumno) => alumno.estadoImportacion === 'NUEVO',
    ).length;
    const duplicados = total - nuevos;

    return (
        <SafeAreaView style={styles.seguro}>
            <View style={styles.contenedorColumna}>
                <View style={styles.encabezadoPrevio}>
                    <Text style={[styles.nombreArchivo, { color: theme.text }]}>
                        {nombreArchivo}
                    </Text>
                    <ThemedText type="small" themeColor="textSecondary">
                        {`Total: ${total} | Nuevos: ${nuevos} | Duplicados: ${duplicados}`}
                    </ThemedText>
                </View>
                <FlatList
                    data={alumnosImportados}
                    keyExtractor={(alumno) => alumno.registro}
                    contentContainerStyle={styles.lista}
                    renderItem={({ item }) => (
                        <TarjetaPrensa estilo={styles.filaAlumno}>
                            <View style={styles.columnaAlumno}>
                                <Text style={[styles.registroAlumno, { color: theme.text }]}>
                                    {item.registro}
                                </Text>
                                <ThemedText type="small" style={styles.nombreAlumno}>
                                    {`${item.nombre} ${item.apellidoPaterno} ${item.apellidoMaterno ?? ''}`.trim()}
                                </ThemedText>
                                {textoCarrera(item.carrera, item.plan) ? (
                                    <ThemedText type="small" themeColor="textSecondary">
                                        {textoCarrera(item.carrera, item.plan)}
                                    </ThemedText>
                                ) : null}
                            </View>
                            <Insignia
                                texto={item.estadoImportacion === 'NUEVO' ? 'Nuevo' : 'Ya inscrito'}
                                tono={item.estadoImportacion === 'NUEVO' ? 'exito' : 'advertencia'}
                            />
                        </TarjetaPrensa>
                    )}
                />
                <View style={styles.barraInferior}>
                    <BotonAccion titulo="Confirmar Importación" onPulsar={onConfirmar} />
                    <BotonAccion
                        titulo="Elegir otro archivo"
                        variante="secundario"
                        onPulsar={onElegirOtro}
                    />
                </View>
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
    encabezadoPrevio: {
        gap: 2,
    },
    nombreArchivo: {
        fontSize: 18,
        fontWeight: '700',
    },
    lista: {
        gap: Spacing.two - 2,
        paddingBottom: Spacing.two,
    },
    filaAlumno: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: Spacing.two,
        paddingVertical: Spacing.two + 2,
    },
    columnaAlumno: {
        flex: 1,
        gap: 1,
    },
    registroAlumno: {
        fontSize: 15,
        fontWeight: '800',
    },
    nombreAlumno: {
        fontWeight: '600',
    },
    barraInferior: {
        gap: Spacing.two + 2,
    },
});
