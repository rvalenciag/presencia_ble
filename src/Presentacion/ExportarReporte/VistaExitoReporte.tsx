// CU14 (vista SUCCESS_SHARE): ficha del archivo generado y menú compartir
// (WhatsApp, correo, nube vía el sheet del sistema). No genera: solo muestra
// y avisa al orquestador.

import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { BotonAccion } from '@/Presentacion/componentes/BotonAccion';
import { EncabezadoPantalla } from '@/Presentacion/componentes/EncabezadoPantalla';
import { ThemedText } from '@/Presentacion/componentes/ThemedText';
import { Tonos } from '@/Presentacion/componentes/Colores';
import type { PropsVistaExitoReporte } from './tipos';

export function VistaExitoReporte({
    archivo,
    formato,
    rango,
    onCompartir,
    onVolverAlGrupo,
}: PropsVistaExitoReporte) {
    const theme = useTheme();

    return (
        <SafeAreaView style={styles.seguro}>
            <View style={styles.columna}>
                <EncabezadoPantalla titulo="¡Reporte Generado con Éxito!" />
                <View style={[styles.check, { backgroundColor: Tonos.exito.suave }]}>
                    <Text style={styles.checkTexto}>✔</Text>
                </View>
                <View style={[styles.ficha, { backgroundColor: theme.backgroundElement }]}>
                    <FilaFicha etiqueta="Nombre" valor={archivo.nombre} />
                    <FilaFicha
                        etiqueta="Ubicación"
                        valor="Documentos de la app (se comparte desde aquí)"
                    />
                    <FilaFicha etiqueta="Tamaño" valor={`${archivo.tamanoKb} KB`} />
                    <FilaFicha
                        etiqueta="Contenido"
                        valor={`${formato} · ${rango === 'SEMESTRE' ? 'Todo el semestre' : 'Rango personalizado'}`}
                    />
                </View>
                <ThemedText type="smallBold">Compartir Directamente</ThemedText>
                <BotonAccion
                    titulo="📤 Compartir (WhatsApp, correo, nube)"
                    variante="primario"
                    onPulsar={onCompartir}
                />
                <BotonAccion
                    titulo="Volver al Grupo"
                    variante="secundario"
                    onPulsar={onVolverAlGrupo}
                />
            </View>
        </SafeAreaView>
    );
}

function FilaFicha({ etiqueta, valor }: { etiqueta: string; valor: string }) {
    const theme = useTheme();
    return (
        <View style={styles.filaFicha}>
            <ThemedText type="small" themeColor="textSecondary">
                {etiqueta}
            </ThemedText>
            <Text style={[styles.valorFicha, { color: theme.text }]}>{valor}</Text>
        </View>
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
    check: {
        width: 72,
        height: 72,
        borderRadius: 36,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
    },
    checkTexto: {
        fontSize: 34,
        color: Tonos.exito.solido,
    },
    ficha: {
        borderRadius: 16,
        padding: Spacing.three,
        gap: Spacing.two,
    },
    filaFicha: {
        gap: 1,
    },
    valorFicha: {
        fontSize: 15,
        fontWeight: '600',
    },
});
