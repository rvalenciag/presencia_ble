import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/Presentacion/componentes/ThemedText';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type EstadoVacioProps = {
  icono: string;
  titulo: string;
  mensaje?: string;
  accion?: ReactNode;
};

export function EstadoVacio({ icono, titulo, mensaje, accion }: EstadoVacioProps) {
  const theme = useTheme();
  return (
    <View style={styles.contenedor}>
      <View style={[styles.circuloIcono, { backgroundColor: theme.backgroundElement }]}>
        <ThemedText style={styles.icono}>{icono}</ThemedText>
      </View>
      <ThemedText type="smallBold" style={styles.titulo}>
        {titulo}
      </ThemedText>
      {mensaje ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.mensaje}>
          {mensaje}
        </ThemedText>
      ) : null}
      {accion ? <View style={styles.accion}>{accion}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    alignItems: 'center',
    gap: Spacing.two + 2,
    paddingVertical: Spacing.six,
    paddingHorizontal: Spacing.four,
  },
  circuloIcono: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icono: {
    fontSize: 40,
  },
  titulo: {
    fontSize: 17,
    textAlign: 'center',
  },
  mensaje: {
    textAlign: 'center',
    lineHeight: 20,
  },
  accion: {
    gap: Spacing.two + 2,
    alignSelf: 'stretch',
    marginTop: Spacing.two,
  },
});
