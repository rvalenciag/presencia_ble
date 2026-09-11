import { type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { BotonAccion } from './BotonAccion';
import { Tonos, type Tono } from './Colores';

type ModalConfirmacionProps = {
  visible: boolean;
  titulo: string;
  mensaje?: ReactNode;
  icono?: string;
  tonoIcono?: Tono;
  textoConfirmar: string;
  textoCancelar?: string | null;
  tonoConfirmar?: 'primario' | 'destructivo';
  onConfirmar: () => void;
  onCancelar: () => void;
};

export function ModalConfirmacion({
  visible,
  titulo,
  mensaje,
  icono = '⚠️',
  tonoIcono = 'error',
  textoConfirmar,
  textoCancelar = 'Cancelar',
  tonoConfirmar = 'destructivo',
  onConfirmar,
  onCancelar,
}: ModalConfirmacionProps) {
  const theme = useTheme();
  const paleta = Tonos[tonoIcono];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancelar}>
      <Pressable style={styles.fondo} onPress={onCancelar}>
        <Pressable style={[styles.tarjeta, { backgroundColor: theme.background }]} onPress={() => undefined}>
          <View style={[styles.circuloIcono, { backgroundColor: paleta.suave }]}>
            <Text style={styles.icono}>{icono}</Text>
          </View>
          <Text style={[styles.titulo, { color: theme.text }]}>{titulo}</Text>
          {mensaje ? (
            <View style={styles.cuerpo}>
              {typeof mensaje === 'string' ? (
                <Text style={[styles.mensaje, { color: theme.textSecondary }]}>{mensaje}</Text>
              ) : (
                mensaje
              )}
            </View>
          ) : null}
          <View style={styles.acciones}>
            <BotonAccion
              titulo={textoConfirmar}
              variante={tonoConfirmar}
              onPulsar={onConfirmar}
            />
            {textoCancelar ? (
              <BotonAccion titulo={textoCancelar} variante="secundario" onPulsar={onCancelar} />
            ) : null}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fondo: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  tarjeta: {
    borderRadius: 20,
    padding: Spacing.four,
    gap: Spacing.three - 4,
    alignSelf: 'stretch',
    maxWidth: 420,
  },
  circuloIcono: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  icono: {
    fontSize: 30,
  },
  titulo: {
    fontSize: 19,
    fontWeight: '700',
    textAlign: 'center',
  },
  cuerpo: {
    alignItems: 'center',
  },
  mensaje: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  acciones: {
    gap: Spacing.two + 2,
    marginTop: Spacing.two,
  },
});
