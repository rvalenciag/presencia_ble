import { StyleSheet, Text, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Tonos, type Tono } from './Colores';

export interface ElementoEstadistica {
  etiqueta: string;
  valor: number | string;
  tono: Tono;
  conCheck?: boolean;
}

type BarraEstadisticasProps = {
  elementos: ElementoEstadistica[];
};

export function BarraEstadisticas({ elementos }: BarraEstadisticasProps) {
  const theme = useTheme();
  return (
    <View style={styles.fila}>
      {elementos.map((elemento) => {
        const paleta = Tonos[elemento.tono];
        return (
          <View
            key={elemento.etiqueta}
            style={[styles.tarjeta, { backgroundColor: theme.backgroundElement }]}
          >
            <View style={[styles.circulo, { backgroundColor: paleta.suave }]}>
              <Text style={[styles.valor, { color: paleta.solido }]}>
                {elemento.conCheck ? `✔ ${elemento.valor}` : elemento.valor}
              </Text>
            </View>
            <Text style={[styles.etiqueta, { color: theme.textSecondary }]}>{elemento.etiqueta}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    gap: Spacing.two + 2,
  },
  tarjeta: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: 16,
    paddingVertical: Spacing.three - 2,
  },
  circulo: {
    minWidth: 44,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one + 2,
    borderRadius: 999,
    alignItems: 'center',
  },
  valor: {
    fontSize: 18,
    fontWeight: '800',
  },
  etiqueta: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
