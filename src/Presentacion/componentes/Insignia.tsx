import { StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { Spacing } from '@/constants/theme';

type InsigniaProps = {
  texto: string;
  tono?: 'exito' | 'error' | 'advertencia' | 'informacion' | 'neutro';
  estilo?: StyleProp<ViewStyle>;
  estiloTexto?: StyleProp<TextStyle>;
};

const tonosInsignia = {
  exito: { fondo: 'rgba(52, 199, 89, 0.16)', texto: '#34C759' },
  error: { fondo: 'rgba(255, 59, 48, 0.14)', texto: '#FF3B30' },
  advertencia: { fondo: 'rgba(255, 149, 0, 0.16)', texto: '#FF9500' },
  informacion: { fondo: 'rgba(32, 138, 239, 0.16)', texto: '#208AEF' },
  neutro: { fondo: 'rgba(142, 142, 147, 0.18)', texto: '#8E8E93' },
} as const;

export function Insignia({ texto, tono = 'neutro', estilo, estiloTexto }: InsigniaProps) {
  const paleta = tonosInsignia[tono];
  return (
    <View style={[styles.base, { backgroundColor: paleta.fondo }, estilo]}>
      <Text style={[styles.texto, { color: paleta.texto }, estiloTexto]}>{texto}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 999,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: Spacing.one + 2,
    alignSelf: 'flex-start',
  },
  texto: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
});
