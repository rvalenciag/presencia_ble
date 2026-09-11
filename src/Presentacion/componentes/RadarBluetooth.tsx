import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { Tonos } from './Colores';

const TAMANO = 104;
const DURACION = 2000;

export function RadarBluetooth() {
  const [pulsos] = useState(() => [
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]);

  useEffect(() => {
    let activo = true;
    const animaciones: Animated.CompositeAnimation[] = [];

    // Animated.loop puede dejar el valor nativo en 1 al terminar el primer ciclo;
    // como el anillo vale opacidad 0 en 1, el radar parecía detenerse. Cada ciclo
    // reinicia explícitamente su anillo antes de volver a expandirlo.
    const repetirPulso = (pulso: Animated.Value, indice: number) => {
      pulso.setValue(0);
      const animacion = Animated.sequence([
        Animated.delay(indice * (DURACION / 3)),
        Animated.timing(pulso, { toValue: 1, duration: DURACION, useNativeDriver: true }),
      ]);
      animaciones[indice] = animacion;
      animacion.start(({ finished }) => {
        if (activo && finished) repetirPulso(pulso, indice);
      });
    };

    pulsos.forEach(repetirPulso);
    return () => {
      activo = false;
      animaciones.forEach((animacion) => animacion.stop());
    };
  }, [pulsos]);

  return (
    <View style={styles.contenedor}>
      {pulsos.map((pulso, indice) => {
        const escala = pulso.interpolate({ inputRange: [0, 1], outputRange: [0.22, 1] });
        const opacidad = pulso.interpolate({ inputRange: [0, 0.1, 1], outputRange: [0.65, 0.65, 0] });
        return (
          <Animated.View
            key={indice}
            style={[
              styles.anillo,
              { transform: [{ scale: escala }], opacity: opacidad },
            ]}
          />
        );
      })}
      <View style={styles.centro} />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    width: TAMANO,
    height: TAMANO,
    alignItems: 'center',
    justifyContent: 'center',
  },
  anillo: {
    position: 'absolute',
    width: TAMANO,
    height: TAMANO,
    borderRadius: TAMANO / 2,
    borderWidth: 2,
    borderColor: Tonos.informacion.solido,
  },
  centro: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Tonos.informacion.solido,
  },
});
