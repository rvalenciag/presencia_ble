// Vista 2 de CU01: formulario del perfil con la caja de UUID.
// Es de solo visión: recibe los datos y avisos del orquestador y reporta los cambios.

import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { BotonAccion } from '@/Presentacion/componentes/BotonAccion';
import { CampoTexto } from '@/Presentacion/componentes/CampoTexto';
import { EncabezadoPantalla } from '@/Presentacion/componentes/EncabezadoPantalla';
import { Insignia } from '@/Presentacion/componentes/Insignia';
import { ThemedText } from '@/Presentacion/componentes/ThemedText';
import { Tonos } from '@/Presentacion/componentes/Colores';
import type { Rol } from '@/Negocio/NPerfil';
import type { DatosFormulario, ErroresFormulario } from './tipos';

type PropsVistaFormulario = {
    rol: Rol | null;
    formData: DatosFormulario;
    errors: ErroresFormulario;
    uuid: string;
    onActualizarCampo: (campo: keyof DatosFormulario, valor: string) => void;
    onRegresar: () => void;
    onGuardar: () => void;
};

export function VistaFormulario({
    rol,
    formData,
    errors,
    uuid,
    onActualizarCampo,
    onRegresar,
    onGuardar,
}: PropsVistaFormulario) {
    const theme = useTheme();

    return (
        <SafeAreaView style={styles.seguro}>
            <View style={styles.contenedorColumna}>
                <EncabezadoPantalla
                    titulo="Configurar Perfil"
                    onRegresar={onRegresar}
                    insignia={<Insignia texto={`Rol: ${rol ?? ''}`} tono="informacion" />}
                />
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={styles.flexible}
                >
                    <ScrollView
                        contentContainerStyle={styles.formulario}
                        keyboardShouldPersistTaps="handled"
                    >
                        <CampoTexto
                            etiqueta="Registro Universitario"
                            valor={formData.registro}
                            onCambiar={(valor) => onActualizarCampo('registro', valor)}
                            error={errors.registro}
                            keyboardType="numeric"
                            maxLength={rol === 'ESTUDIANTE' ? 9 : 10}
                            placeholder="ej. 21901234"
                        />
                        <CampoTexto
                            etiqueta="Nombre"
                            valor={formData.nombre}
                            onCambiar={(valor) => onActualizarCampo('nombre', valor)}
                            error={errors.nombre}
                            autoCapitalize="words"
                            placeholder="ej. Juan"
                        />
                        <CampoTexto
                            etiqueta="Apellido Paterno"
                            valor={formData.apellidoPaterno}
                            onCambiar={(valor) => onActualizarCampo('apellidoPaterno', valor)}
                            error={errors.apellidoPaterno}
                            autoCapitalize="words"
                            placeholder="ej. Pérez"
                        />
                        <CampoTexto
                            etiqueta="Apellido Materno"
                            valor={formData.apellidoMaterno}
                            onCambiar={(valor) => onActualizarCampo('apellidoMaterno', valor)}
                            error={errors.apellidoMaterno}
                            autoCapitalize="words"
                            placeholder="ej. Choque"
                        />
                        <CampoTexto
                            etiqueta="Correo Electrónico"
                            valor={formData.correo}
                            onCambiar={(valor) => onActualizarCampo('correo', valor)}
                            error={errors.correo}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            placeholder="ej. juan.perez@univ.edu"
                        />
                        {rol === 'ESTUDIANTE' ? (
                            <CampoTexto
                                etiqueta="Carrera"
                                valor={formData.carrera}
                                onCambiar={(valor) => onActualizarCampo('carrera', valor)}
                                error={errors.carrera}
                                autoCapitalize="words"
                                placeholder="ej. Ing. Informática"
                            />
                        ) : null}
                        <View
                            style={[styles.cajaUuid, { backgroundColor: theme.backgroundElement }]}
                        >
                            <Text style={styles.iconoBluetooth}>Ⓑ</Text>
                            <View style={styles.columnaUuid}>
                                <ThemedText type="small" themeColor="textSecondary">
                                    UUID del Dispositivo (Hardware)
                                </ThemedText>
                                <ThemedText type="code" style={styles.valorUuid}>
                                    {uuid}
                                </ThemedText>
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
                <BotonAccion titulo="Guardar Perfil" onPulsar={onGuardar} />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    seguro: {
        flex: 1,
    },
    flexible: {
        flex: 1,
    },
    contenedorColumna: {
        flex: 1,
        paddingHorizontal: Spacing.four,
        paddingVertical: Spacing.three,
        gap: Spacing.three,
    },
    formulario: {
        gap: Spacing.three - 2,
        paddingBottom: Spacing.three,
    },
    cajaUuid: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.three - 2,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(32, 138, 239, 0.4)',
        padding: Spacing.three - 2,
        marginTop: Spacing.two,
    },
    iconoBluetooth: {
        fontSize: 26,
        color: Tonos.informacion.solido,
    },
    columnaUuid: {
        flex: 1,
        gap: 2,
    },
    valorUuid: {
        fontSize: 13,
    },
});
