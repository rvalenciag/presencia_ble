// Vistas 2 y 3 de CU02: formulario de creación y edición de un grupo.
// De solo visión: recibe los datos y avisos del orquestador y reporta los cambios.

import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { BotonAccion } from '@/Presentacion/componentes/BotonAccion';
import { CampoTexto } from '@/Presentacion/componentes/CampoTexto';
import { EncabezadoPantalla } from '@/Presentacion/componentes/EncabezadoPantalla';
import type { DatosFormulario, ErroresFormulario } from '@/Presentacion/GestionarGrupos/tipos';

type PropsVistaFormularioGrupo = {
    modo: 'FORM_CREATE' | 'FORM_EDIT';
    formData: DatosFormulario;
    errors: ErroresFormulario;
    onActualizarCampo: (campo: keyof DatosFormulario, valor: string | null) => void;
    onGuardar: () => void;
    onCancelar: () => void;
};

export function VistaFormularioGrupo({
    modo,
    formData,
    errors,
    onActualizarCampo,
    onGuardar,
    onCancelar,
}: PropsVistaFormularioGrupo) {
    return (
        <SafeAreaView style={styles.seguro}>
            <ScrollView contentContainerStyle={styles.contenido}>
                <EncabezadoPantalla
                    titulo={modo === 'FORM_CREATE' ? 'Nuevo Grupo' : 'Editar Grupo'}
                    onRegresar={onCancelar}
                />
                <CampoTexto
                    etiqueta="Nombre de la Materia"
                    valor={formData.nombre}
                    onCambiar={(valor) => onActualizarCampo('nombre', valor)}
                    error={errors.nombre}
                    placeholder="ej. Estructura de Datos"
                    autoCapitalize="words"
                />
                <CampoTexto
                    etiqueta="Extensión / Sigla"
                    valor={formData.extension}
                    onCambiar={(valor) => onActualizarCampo('extension', valor)}
                    placeholder="ej. SA, SB, G1"
                    autoCapitalize="characters"
                />
                <CampoTexto
                    etiqueta="Semestre"
                    valor={formData.semestre}
                    onCambiar={(valor) => onActualizarCampo('semestre', valor)}
                    error={errors.semestre}
                    placeholder="ej. 1"
                    keyboardType="numeric"
                    maxLength={2}
                />
                <CampoTexto
                    etiqueta="Año"
                    valor={formData.anio}
                    onCambiar={(valor) => onActualizarCampo('anio', valor)}
                    error={errors.anio}
                    placeholder="ej. 2026"
                    keyboardType="numeric"
                    maxLength={4}
                />
                <View style={styles.filaBotones}>
                    <BotonAccion
                        titulo={modo === 'FORM_CREATE' ? 'Guardar' : 'Guardar Cambios'}
                        onPulsar={onGuardar}
                    />
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
