import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { ThemedText } from '@/Presentacion/componentes/ThemedText';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Tonos } from './Colores';

type CampoTextoProps = {
  etiqueta: string;
  valor: string;
  onCambiar: (valor: string) => void;
  error?: string | null;
} & Pick<
  TextInputProps,
  'keyboardType' | 'autoCapitalize' | 'maxLength' | 'placeholder' | 'editable'
>;

export function CampoTexto({ etiqueta, valor, onCambiar, error, ...props }: CampoTextoProps) {
  const theme = useTheme();
  const deshabilitado = props.editable === false;

  return (
    <View style={styles.contenedor}>
      <ThemedText type="smallBold">{etiqueta}</ThemedText>
      <TextInput
        value={valor}
        onChangeText={onCambiar}
        placeholderTextColor={theme.textSecondary}
        style={[
          styles.entrada,
          {
            backgroundColor: theme.backgroundElement,
            color: theme.text,
            borderColor: error ? Tonos.error.solido : 'transparent',
          },
          deshabilitado && styles.entradaDeshabilitada,
        ]}
        {...props}
      />
      {error ? (
        <ThemedText type="small" style={{ color: Tonos.error.solido }}>
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    gap: Spacing.two - 2,
  },
  entrada: {
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
    fontSize: 16,
  },
  entradaDeshabilitada: {
    opacity: 0.55,
  },
});
