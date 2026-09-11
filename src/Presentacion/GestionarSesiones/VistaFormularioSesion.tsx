// CU09 (vista FORM_CREATE): formulario de nueva sesión. Solo pide el título; la
// fecha/hora la pone la base de datos al insertar y la sesión queda abierta.

import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { BotonAccion } from '@/Presentacion/componentes/BotonAccion';
import { CampoTexto } from '@/Presentacion/componentes/CampoTexto';
import { EncabezadoPantalla } from '@/Presentacion/componentes/EncabezadoPantalla';
import { ThemedText } from '@/Presentacion/componentes/ThemedText';
import type { PropsVistaFormularioSesion } from './tipos';

export function VistaFormularioSesion({
    formData,
    errorTitulo,
    onChangeTitulo,
    onAbrir,
    onCancelar,
}: PropsVistaFormularioSesion) {
    return (
        <SafeAreaView style={styles.seguro}>
            <View style={styles.contenido}>
                <EncabezadoPantalla titulo="Nueva Sesión" onRegresar={onCancelar} />
                <CampoTexto
                    etiqueta="Título / Tema de la clase"
                    valor={formData.titulo}
                    onCambiar={onChangeTitulo}
                    error={errorTitulo || null}
                    autoCapitalize="sentences"
                    placeholder="ej. Unidad 3 – Termodinámica"
                />
                <View style={styles.nota}>
                    <ThemedText type="small" themeColor="textSecondary">
                        La sesión se registrará con la fecha y hora actuales del teléfono y quedará
                        abierta para tomar asistencia.
                    </ThemedText>
                </View>
                <View style={styles.filaBotones}>
                    <BotonAccion titulo="Abrir Sesión" variante="exito" onPulsar={onAbrir} />
                    <BotonAccion titulo="Cancelar" variante="secundario" onPulsar={onCancelar} />
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    seguro: {
        flex: 1,
    },
    contenido: {
        flex: 1,
        paddingHorizontal: Spacing.four,
        paddingVertical: Spacing.three,
        gap: Spacing.three - 2,
    },
    nota: {
        marginTop: Spacing.two - 4,
    },
    filaBotones: {
        flexDirection: 'row',
        gap: Spacing.two + 2,
        marginTop: Spacing.two,
    },
});
