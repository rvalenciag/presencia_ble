// CU07: Consultar Grupos Vinculados (lado estudiante).
// Orquestador: se autoprovee (ADR-001) con usePerfil (NPerfil) para el saludo y
// useGrupos (NGrupo) para la lista vinculada; el saludo además cae a los parámetros
// que manda CU01 al navegar (respaldo si el perfil guardado aún no existe).
// Aquí vive el refresco, la navegación y el aviso; la vista solo pinta.

import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Alert } from 'react-native';

import { useGrupos } from '@/Negocio/NGrupo';
import { usePerfil } from '@/Negocio/NPerfil';
import { VistaMisGrupos } from '@/Presentacion/MisGruposEstudiante/VistaMisGrupos';

export function PMisGruposEstudiante() {
    const { perfil: perfilDelHook } = usePerfil();
    // El registrar del estudiante viene del perfil (o de los params de CU01)
    const { nombre, apellido, registro } = useLocalSearchParams<{
        nombre?: string;
        apellido?: string;
        registro?: string;
    }>();
    const { misGrupos, refrescarMisGrupos } = useGrupos(perfilDelHook?.registro ?? registro);

    // El nombre/registro que se ve en pantalla: primero el hook, después los params
    const saludo =
        `${perfilDelHook?.nombre ?? nombre ?? ''} ${perfilDelHook?.apellidoPaterno ?? apellido ?? ''}`.trim();
    const registroVisible = perfilDelHook?.registro ?? registro ?? '';

    const [isRefreshing, setIsRefreshing] = useState(false);

    const refrescarGrupos = () => {
        setIsRefreshing(true);
        refrescarMisGrupos?.();
        setTimeout(() => setIsRefreshing(false), 800);
    };

    const entrarAlGrupo = () => {
        Alert.alert(
            'Aviso',
            'El panel de la materia corresponde a los módulos siguientes (CU08–CU13).',
        );
    };

    return (
        <VistaMisGrupos
            saludo={saludo}
            registro={registroVisible}
            misGrupos={misGrupos}
            isRefreshing={isRefreshing}
            onRefrescar={refrescarGrupos}
            onEntrarAlGrupo={entrarAlGrupo}
            onVincular={() => router.push('/vincular-dispositivo')}
            onConfigurarPerfil={() => router.navigate('/')}
        />
    );
}
