import { Pressable, StyleSheet, Text } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Tonos } from './Colores';

type VarianteBoton = 'primario' | 'secundario' | 'destructivo' | 'exito';

type BotonAccionProps = {
  titulo: string;
  onPulsar?: () => void;
  variante?: VarianteBoton;
  deshabilitado?: boolean;
  compacto?: boolean;
};

export function BotonAccion({
  titulo,
  onPulsar,
  variante = 'primario',
  deshabilitado = false,
  compacto = false,
}: BotonAccionProps) {
  const theme = useTheme();
  const esTextoSobreFondo = variante === 'secundario';
  const fondo =
    variante === 'secundario'
      ? theme.backgroundElement
      : variante === 'destructivo'
        ? Tonos.error.solido
        : variante === 'exito'
          ? Tonos.exito.solido
          : Tonos.informacion.solido;
  const colorTexto = esTextoSobreFondo ? theme.text : '#FFFFFF';

  return (
    <Pressable
      onPress={onPulsar}
      disabled={deshabilitado}
      style={({ pressed }) => [
        styles.base,
        compacto && styles.compacto,
        {
          backgroundColor: fondo,
          borderColor: esTextoSobreFondo ? theme.backgroundSelected : fondo,
          opacity: deshabilitado ? 0.45 : pressed ? 0.8 : 1,
        },
      ]}
    >
      <Text style={[styles.texto, { color: colorTexto }]}>{titulo}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 14,
    paddingVertical: Spacing.three + 2,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    borderWidth: 1,
  },
  compacto: {
    paddingVertical: Spacing.two + 2,
    paddingHorizontal: Spacing.three,
    borderRadius: 10,
  },
  texto: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
});
