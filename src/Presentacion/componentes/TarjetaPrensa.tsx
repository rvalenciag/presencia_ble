import { type ReactNode } from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type TarjetaPrensaProps = {
  children: ReactNode;
  onPulsar?: () => void;
  estilo?: StyleProp<ViewStyle>;
};

export function TarjetaPrensa({ children, onPulsar, estilo }: TarjetaPrensaProps) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPulsar}
      disabled={onPulsar === undefined}
      style={({ pressed }) => [
        styles.tarjeta,
        { backgroundColor: theme.backgroundElement },
        onPulsar !== undefined && { opacity: pressed ? 0.85 : 1 },
        estilo,
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    borderRadius: 16,
    padding: Spacing.three,
    gap: Spacing.two,
  },
});
