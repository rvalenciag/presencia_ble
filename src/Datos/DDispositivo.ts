// La identidad del teléfono: un uuid que se genera una sola vez y se guarda en MMKV.
// ADR-014: la clase declara su atributo; el atributo uuid lo generan DDispositivo.

import { createMMKV } from 'react-native-mmkv';
import * as Crypto from 'expo-crypto';

// El "bolsillo" rápido donde vive el uuid (sobrevive a cierres de la app)
const almacen = createMMKV();

export class DDispositivo {
    // Atributo: el identificador único de este teléfono
    uuid: string;

    // El constructor deja el uuid listo: el de siempre o uno recién generado
    constructor() {
        this.uuid = this.obtenerOGenerar();
    }

    private obtenerOGenerar(): string {
        const uuidGuardado = almacen.getString('uuid-dispositivo');
        if (uuidGuardado) {
            return uuidGuardado;
        }
        const uuidNuevo = Crypto.randomUUID();
        almacen.set('uuid-dispositivo', uuidNuevo);
        return uuidNuevo;
    }
}
