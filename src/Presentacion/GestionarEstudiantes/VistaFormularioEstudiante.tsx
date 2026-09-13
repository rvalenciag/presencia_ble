// CU04 (vistas FORM_ADD y FORM_EDIT): formulario compartido de alumno.
// Recibe ya el formulario validado por el orquestador; aquí solo se dibuja y edita.

import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { BotonAccion } from '@/Presentacion/componentes/BotonAccion';
import { CampoTexto } from '@/Presentacion/componentes/CampoTexto';
import { EncabezadoPantalla } from '@/Presentacion/componentes/EncabezadoPantalla';
import type { DatosFormulario, ErroresFormulario } from './tipos';

type PropsVistaFormularioEstudiante = {
    titulo: string;
    readOnlyRegistro: boolean;
    formData: DatosFormulario;
    errores: ErroresFormulario;
    onChangeCampo: (campo: keyof DatosFormulario, valor: string) => void;
    onGuardar: () => void;
    onCancelar: () => void;
};

export function VistaFormularioEstudiante({
    titulo,
    readOnlyRegistro,
    formData,
    errores,
    onChangeCampo,
    onGuardar,
    onCancelar,
}: PropsVistaFormularioEstudiante) {
    return (
        <SafeAreaView style={styles.seguro}>
            <ScrollView contentContainerStyle={styles.contenido}>
                <EncabezadoPantalla titulo={titulo} onRegresar={onCancelar} />
                <CampoTexto
                    etiqueta="Registro Universitario"
                    valor={formData.registro}
                    onCambiar={(valor) => onChangeCampo('registro', valor)}
                    error={errores.registro}
                    keyboardType="numeric"
                    maxLength={10}
                    placeholder="ej. 21901234"
                    editable={!readOnlyRegistro}
                />
                <CampoTexto
                    etiqueta="Nombre"
                    valor={formData.nombre}
                    onCambiar={(valor) => onChangeCampo('nombre', valor)}
                    error={errores.nombre}
                    autoCapitalize="words"
                    placeholder="ej. María"
                />
                <CampoTexto
                    etiqueta="Apellido Paterno"
                    valor={formData.apellidoPaterno}
                    onCambiar={(valor) => onChangeCampo('apellidoPaterno', valor)}
                    error={errores.apellidoPaterno}
                    autoCapitalize="words"
                    placeholder="ej. Flores"
                />
                <CampoTexto
                    etiqueta="Apellido Materno"
                    valor={formData.apellidoMaterno}
                    onCambiar={(valor) => onChangeCampo('apellidoMaterno', valor)}
                    error={errores.apellidoMaterno}
                    autoCapitalize="words"
                    placeholder="ej. Quispe"
                />
                <CampoTexto
                    etiqueta="Carrera"
                    valor={formData.carrera}
                    onCambiar={(valor) => onChangeCampo('carrera', valor)}
                    error={errores.carrera}
                    keyboardType="numeric"
                    maxLength={3}
                    placeholder="ej. 187"
                />
                <CampoTexto
                    etiqueta="Plan"
                    valor={formData.plan}
                    onCambiar={(valor) => onChangeCampo('plan', valor)}
                    error={errores.plan}
                    keyboardType="numeric"
                    maxLength={1}
                    placeholder="ej. 6"
                />
                <CampoTexto
                    etiqueta="Teléfono"
                    valor={formData.telefono}
                    onCambiar={(valor) => onChangeCampo('telefono', valor)}
                    error={errores.telefono}
                    keyboardType="phone-pad"
                    maxLength={13}
                    placeholder="ej. 644 123 4567"
                />
                <CampoTexto
                    etiqueta="Correo"
                    valor={formData.correo}
                    onCambiar={(valor) => onChangeCampo('correo', valor)}
                    error={errores.correo}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholder="ej. usr@itson.edu.mx"
                />
                <View style={styles.filaBotones}>
                    <BotonAccion titulo="Guardar" onPulsar={onGuardar} />
                    <BotonAccion titulo="Cancelar" variante="secundario" onPulsar={onCancelar} />
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
        gap: Spacing.three - 2,
    },
    filaBotones: {
        flexDirection: 'row',
        gap: Spacing.two + 2,
        marginTop: Spacing.two,
    },
});
