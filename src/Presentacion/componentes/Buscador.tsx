import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type BuscadorProps = {
  valor: string;
  onCambiar: (valor: string) => void;
  placeholder?: string;
};

export function Buscador({ valor, onCambiar, placeholder = 'Buscar...' }: BuscadorProps) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.contenedor,
        { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected },
      ]}
    >
      <Text style={[styles.icono, { color: theme.textSecondary }]}>⌕</Text>
      <TextInput
        value={valor}
        onChangeText={onCambiar}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        style={[styles.entrada, { color: theme.text }]}
        autoCapitalize="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
  },
  icono: {
    fontSize: 20,
    fontWeight: '700',
  },
  entrada: {
    flex: 1,
    paddingVertical: Spacing.two + 4,
    fontSize: 15,
  },
});
