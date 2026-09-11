// CU07: Consultar Grupos Vinculados y CU08: Desvincular Grupo (lado estudiante).
// Orquestador: se autoprovee (ADR-001) con usePerfil (NPerfil) para el saludo y
// useGrupos (NGrupo) para la lista vinculada; el saludo además cae a los parámetros
// que manda CU01 al navegar (respaldo si el perfil guardado aún no existe).
// Aquí vive el refresco, la navegación, el aviso y el modal de desvinculación;
// la vista solo pinta.

import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { useGrupos, type GrupoEstudiante } from '@/Negocio/NGrupo';
import { usePerfil } from '@/Negocio/NPerfil';
import { ModalConfirmacion } from '@/Presentacion/componentes/ModalConfirmacion';
import { VistaMisGrupos } from '@/Presentacion/MisGruposEstudiante/VistaMisGrupos';

export function PMisGruposEstudiante() {
    const theme = useTheme();
    const { perfil: perfilDelHook } = usePerfil();
    // El registrar del estudiante viene del perfil (o de los params de CU01)
    const { nombre, apellido, registro } = useLocalSearchParams<{
        nombre?: string;
        apellido?: string;
        registro?: string;
    }>();
    const { misGrupos, refrescarMisGrupos, desvincularGrupo } = useGrupos(
        perfilDelHook?.registro ?? registro,
    );

    // El nombre/registro que se ve en pantalla: primero el hook, después los params
    const saludo =
        `${perfilDelHook?.nombre ?? nombre ?? ''} ${perfilDelHook?.apellidoPaterno ?? apellido ?? ''}`.trim();
    const registroVisible = perfilDelHook?.registro ?? registro ?? '';

    const [isRefreshing, setIsRefreshing] = useState(false);
    const [grupoEnModal, setGrupoEnModal] = useState<GrupoEstudiante | null>(null);

    const refrescarGrupos = () => {
        setIsRefreshing(true);
        refrescarMisGrupos();
        setTimeout(() => setIsRefreshing(false), 800);
    };

    const entrarAlGrupo = () => {
        Alert.alert(
            'Aviso',
            'El panel de la materia corresponde a los módulos siguientes (CU09–CU13).',
        );
    };

    const desvincular = () => {
        if (grupoEnModal == null) return;
        const idGrupo = Number(grupoEnModal.id);
        const exito = desvincularGrupo(idGrupo);
        setGrupoEnModal(null);
        if (exito) {
            Alert.alert(
                'Materia desvinculada',
                'La materia ya no aparecerá en tu lista de grupos.',
            );
        } else {
            Alert.alert(
                'No se pudo remover el grupo',
                'No se pudo remover el grupo, intente nuevamente.',
            );
        }
    };

    return (
        <>
            <VistaMisGrupos
                saludo={saludo}
                registro={registroVisible}
                misGrupos={misGrupos}
                isRefreshing={isRefreshing}
                onRefrescar={refrescarGrupos}
                onEntrarAlGrupo={entrarAlGrupo}
                onTransmitirPresencia={(grupo) =>
                    router.push({
                        pathname: '/transmitir-presencia',
                        params: { grupoId: String(grupo.id) },
                    })
                }
                onDesvincular={setGrupoEnModal}
                onVincular={() => router.push('/vincular-dispositivo')}
                onConfigurarPerfil={() => router.navigate('/')}
            />
            <ModalConfirmacion
                visible={grupoEnModal !== null}
                titulo="¿Quitar materia de tu dispositivo?"
                mensaje={
                    <View style={styles.cuerpoModal}>
                        <Text style={[styles.mensajeModal, { color: theme.textSecondary }]}>
                            Se eliminará la materia{' '}
                            <Text style={[styles.nombreModal, { color: theme.text }]}>
                                {grupoEnModal?.nombre ?? ''}
                            </Text>{' '}
                            junto con todo tu historial local de asistencias de esta asignatura. La
                            materia ya no aparecerá en Mis Grupos.
                        </Text>
                    </View>
                }
                textoConfirmar="Confirmar Desvinculación"
                onCancelar={() => setGrupoEnModal(null)}
                onConfirmar={desvincular}
            />
        </>
    );
}

const styles = StyleSheet.create({
    cuerpoModal: {
        alignItems: 'center',
    },
    mensajeModal: {
        fontSize: 14,
        lineHeight: 21,
        textAlign: 'center',
    },
    nombreModal: {
        fontWeight: '800',
    },
});
