// CU12 (vista MODAL_CHANGE_STATUS): modal para cambiar el estado de un alumno.
// Reusa ModalConfirmacion ("Guardar Cambio" primario / "Cancelar") con las 3
// opciones del spec adentro. El temporal se reinicia por key del padre.

import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Insignia } from '@/Presentacion/componentes/Insignia';
import { ModalConfirmacion } from '@/Presentacion/componentes/ModalConfirmacion';
import { ThemedText } from '@/Presentacion/componentes/ThemedText';
import { Tonos } from '@/Presentacion/componentes/Colores';
import type { EstadoAsistencia } from '@/Negocio/NAsistencia';
import type { PropsVistaCambiarEstado } from './tipos';

const OPCIONES: { id: EstadoAsistencia; titulo: string; icono: string }[] = [
    { id: 'PRESENTE', titulo: 'Presente', icono: '✔' },
    { id: 'AUSENTE', titulo: 'Ausente', icono: '✖' },
    { id: 'LICENCIA', titulo: 'Licencia / Justificado', icono: '📄' },
];

function tonoDe(estado: EstadoAsistencia): 'exito' | 'error' | 'advertencia' {
    if (estado === 'PRESENTE') return 'exito';
    if (estado === 'LICENCIA') return 'advertencia';
    return 'error';
}

export function VistaCambiarEstado({ alumno, onGuardar, onCancelar }: PropsVistaCambiarEstado) {
    const theme = useTheme();
    const [temporal, setTemporal] = useState<EstadoAsistencia>(alumno.estado);

    return (
        <ModalConfirmacion
            visible
            icono="📝"
            tonoIcono="informacion"
            titulo="Modificar Asistencia"
            mensaje={
                <View style={styles.cuerpo}>
                    <ThemedText type="smallBold">{alumno.nombre}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                        {`Reg: ${alumno.registro}`}
                    </ThemedText>
                    <View style={styles.opciones}>
                        {OPCIONES.map((opcion) => {
                            const elegida = temporal === opcion.id;
                            return (
                                <Pressable
                                    key={opcion.id}
                                    onPress={() => setTemporal(opcion.id)}
                                    style={[
                                        styles.opcion,
                                        {
                                            backgroundColor: elegida
                                                ? Tonos[tonoDe(opcion.id)].suave
                                                : theme.backgroundElement,
                                            borderColor: elegida
                                                ? Tonos[tonoDe(opcion.id)].solido
                                                : 'transparent',
                                        },
                                    ]}
                                >
                                    <Text style={styles.icono}>{opcion.icono}</Text>
                                    <Text style={[styles.titulo, { color: theme.text }]}>
                                        {opcion.titulo}
                                    </Text>
                                    {elegida ? (
                                        <Insignia texto="✔" tono={tonoDe(opcion.id)} />
                                    ) : null}
                                </Pressable>
                            );
                        })}
                    </View>
                </View>
            }
            textoConfirmar="Guardar Cambio"
            tonoConfirmar="primario"
            onConfirmar={() => onGuardar(alumno.registro, temporal)}
            onCancelar={onCancelar}
        />
    );
}

const styles = StyleSheet.create({
    cuerpo: {
        gap: Spacing.two - 2,
        alignItems: 'center',
        alignSelf: 'stretch',
    },
    opciones: {
        gap: Spacing.two - 2,
        alignSelf: 'stretch',
    },
    opcion: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.two + 2,
        borderRadius: 12,
        borderWidth: 1.5,
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.two + 2,
    },
    icono: {
        fontSize: 18,
    },
    titulo: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
    },
});
