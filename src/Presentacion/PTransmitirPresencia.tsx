// Orquestador del CU10 (Transmitir Presencia): arma los datos desde el grupo
// seleccionado y el perfil, conecta la vista con los hooks de Negocio y muestra
// el aviso de permisos cuando la transmisión no puede arrancar.

import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Linking, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTransmision } from '@/Negocio/NTransmitirPresencia';
import { Spacing } from '@/constants/theme';
import { BotonAccion } from '@/Presentacion/componentes/BotonAccion';
import { EstadoVacio } from '@/Presentacion/componentes/EstadoVacio';
import { ModalConfirmacion } from '@/Presentacion/componentes/ModalConfirmacion';
import { VistaTransmitirPresencia } from '@/Presentacion/TransmitirPresencia/VistaTransmitirPresencia';

export function PTransmitirPresencia() {
    const { grupoId } = useLocalSearchParams<{ grupoId?: string }>();
    const idGrupo = grupoId ? Number(grupoId) : null;

    const {
        grupo,
        perfil,
        uuidDispositivo,
        paso,
        confirmationData,
        iniciarTransmision,
        detenerTransmision,
        reintentar,
    } = useTransmision(idGrupo);
    const [avisoPermisosVisible, setAvisoPermisosVisible] = useState(false);

    const iniciar = async () => {
        const permisosOk = await iniciarTransmision();
        if (!permisosOk) {
            setAvisoPermisosVisible(true);
        }
    };

    if (!grupo || !perfil) {
        return (
            <SafeAreaView style={styles.area}>
                <View style={styles.contenedorCentrado}>
                    <EstadoVacio
                        icono="📚"
                        titulo="Sin materia activa"
                        mensaje="Selecciona una materia en Mis Grupos para transmitir tu presencia."
                        accion={
                            <BotonAccion
                                titulo="Volver"
                                variante="secundario"
                                onPulsar={() => router.back()}
                            />
                        }
                    />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <>
            <VistaTransmitirPresencia
                tituloMateria={grupo.nombre}
                siglaGrupo={grupo.extension ?? ''}
                registro={perfil.registro}
                uuid={uuidDispositivo}
                paso={paso}
                confirmationData={confirmationData}
                onIniciar={() => void iniciar()}
                onDetener={detenerTransmision}
                onReintentar={reintentar}
                onVolverAMisGrupos={() => router.replace('/mis-grupos')}
            />
            <ModalConfirmacion
                visible={avisoPermisosVisible}
                icono="📍"
                tonoIcono="error"
                titulo="Permiso necesario"
                mensaje="Para transmitir tu señal por Bluetooth, concede el permiso de 'Dispositivos cercanos'. Si lo rechazaste antes, actívalo desde los Ajustes del teléfono."
                textoConfirmar="Abrir Ajustes"
                tonoConfirmar="primario"
                textoCancelar="Cancelar"
                onConfirmar={() => {
                    setAvisoPermisosVisible(false);
                    void Linking.openSettings();
                }}
                onCancelar={() => setAvisoPermisosVisible(false)}
            />
        </>
    );
}

const styles = StyleSheet.create({
    area: {
        flex: 1,
        padding: Spacing.four,
    },
    contenedorCentrado: {
        flex: 1,
        justifyContent: 'center',
    },
});
