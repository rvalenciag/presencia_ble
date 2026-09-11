// CU06: Vincular Dispositivo (lado estudiante).
// Orquestador auto-proveído (ADR-001): llama al hook useVinculacion (Negocio) y
// decide el flujo de pantalla (SCANNING/PAIRING/SUCCESS/REJECTED) según el permiso
// concedido y la respuesta del docente. Aquí vive la navegación; la vista pura
// (VincularDispositivo/VistaVinculacion) solo pinta.

import { useState } from 'react';
import { router } from 'expo-router';
import { Linking } from 'react-native';

import { useVinculacion } from '@/Negocio/NVinculacion';
import type { MateriaDetectada } from '@/Negocio/NVinculacion';
import { VistaVinculacion } from '@/Presentacion/VincularDispositivo/VistaVinculacion';
import type { Paso } from '@/Presentacion/VincularDispositivo/tipos';

export function PVincularDispositivo() {
    const { perfil, materiasDetectadas, seleccionarMateria, respuesta, motivoRechazo, reintentar } =
        useVinculacion();

    // El flujo de pantalla vive aquí (en el orquestador), no en la vista
    const [paso, setPaso] = useState<Paso>('SCANNING');
    const [materiaSeleccionada, setMateriaSeleccionada] = useState<MateriaDetectada | null>(null);
    const [avisoPermisosVisible, setAvisoPermisosVisible] = useState(false);

    // La respuesta del docente define el paso final (y gana al estado local)
    const pasoEfectivo: Paso =
        respuesta === 'ACEPTADO' ? 'SUCCESS' : respuesta === 'RECHAZADO' ? 'REJECTED' : paso;

    // Entra al paso PAIRING solo si la identidad pudo emitirse (permiso concedido)
    const seleccionar = async (materia: MateriaDetectada) => {
        const permisosOk = await seleccionarMateria(materia);
        if (!permisosOk) {
            setAvisoPermisosVisible(true);
            return;
        }
        setMateriaSeleccionada(materia);
        setPaso('PAIRING');
    };

    const reintentarVinculacion = () => {
        reintentar();
        setMateriaSeleccionada(null);
        setPaso('SCANNING');
    };

    return (
        <VistaVinculacion
            perfil={perfil}
            materiasDetectadas={materiasDetectadas}
            paso={pasoEfectivo}
            materiaSeleccionada={materiaSeleccionada}
            motivoRechazo={motivoRechazo}
            avisoPermisosVisible={avisoPermisosVisible}
            onSeleccionar={(materia) => void seleccionar(materia)}
            onReintentar={reintentarVinculacion}
            onCerrarAvisoPermisos={() => setAvisoPermisosVisible(false)}
            onRegresar={() => router.back()}
            onAbrirAjustes={() => {
                void Linking.openSettings();
            }}
            onIrAMisGrupos={() => router.replace('/mis-grupos')}
            onVolverInicio={() => router.navigate('/')}
        />
    );
}
