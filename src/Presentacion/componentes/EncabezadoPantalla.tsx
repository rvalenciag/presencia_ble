import { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ThemedText } from '@/Presentacion/componentes/ThemedText';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type EncabezadoPantallaProps = {
  titulo: string;
  subtitulo?: string;
  onRegresar?: () => void;
  insignia?: ReactNode;
  centrado?: boolean;
};

export function EncabezadoPantalla({ titulo, subtitulo, onRegresar, insignia, centrado }: EncabezadoPantallaProps) {
  const theme = useTheme();

  if (centrado) {
    return (
      <View style={styles.columnaCentrada}>
        <Text style={[styles.tituloGrande, { color: theme.text }]}>{titulo}</Text>
        {subtitulo ? (
          <ThemedText type="small" themeColor="textSecondary" style={styles.subtituloCentrado}>
            {subtitulo}
          </ThemedText>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.fila}>
      {onRegresar ? (
        <Pressable
          onPress={onRegresar}
          hitSlop={12}
          style={({ pressed }) => [
            styles.botonRegresar,
            { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Text style={[styles.iconoRegresar, { color: theme.text }]}>←</Text>
        </Pressable>
      ) : null}
      <View style={styles.titulos}>
        <Text style={[styles.titulo, { color: theme.text }]}>{titulo}</Text>
        {subtitulo ? <ThemedText type="small" themeColor="textSecondary">{subtitulo}</ThemedText> : null}
      </View>
      {insignia}
    </View>
  );
}

const styles = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three - 4,
  },
  botonRegresar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconoRegresar: {
    fontSize: 20,
    fontWeight: '700',
  },
  titulos: {
    flex: 1,
    gap: 1,
  },
  titulo: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
  },
  columnaCentrada: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  tituloGrande: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtituloCentrado: {
    textAlign: 'center',
  },
});
