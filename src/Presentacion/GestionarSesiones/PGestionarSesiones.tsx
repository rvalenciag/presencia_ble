// CU09: Gestionar Sesiones (lado docente).
// Orquestador: lee el grupo de la ruta, llama a useSesiones, valida el formulario
// y monta la vista correspondiente (lista o formulario de sesión).
// El modal de borrado vive aquí (como PGestionarGrupos).

import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { BotonAccion } from '@/Presentacion/componentes/BotonAccion';
import { EncabezadoPantalla } from '@/Presentacion/componentes/EncabezadoPantalla';
import { EstadoVacio } from '@/Presentacion/componentes/EstadoVacio';
import { ModalConfirmacion } from '@/Presentacion/componentes/ModalConfirmacion';
import { VistaFormularioSesion } from './VistaFormularioSesion';
import { VistaListaSesiones } from './VistaListaSesiones';
import {
    datosIniciales,
    fechaLegible,
    type DatosFormulario,
    type Vista,
} from './tipos';
import { useSesiones, type Sesion } from '@/Negocio/NSesion';

export function PGestionarSesiones() {
    const theme = useTheme();
    const { grupoId } = useLocalSearchParams<{ grupoId?: string }>();
    const idGrupo = grupoId ? Number(grupoId) : null;

    const { grupo, sesiones, sesionActiva, crearSesion, cerrarSesion, eliminarSesion } =
        useSesiones(idGrupo);

    const [vista, setVista] = useState<Vista>('LIST');
    const [formData, setFormData] = useState<DatosFormulario>(datosIniciales);
    const [errorTitulo, setErrorTitulo] = useState('');
    const [sesionSeleccionada, setSesionSeleccionada] = useState<Sesion | null>(null);

    // Sin grupo activo todavía no hay sesiones que gestionar
    if (!grupo) {
        return (
            <SafeAreaView style={styles.seguro}>
                <View style={styles.contenedorColumna}>
                    <EncabezadoPantalla
                        titulo="Sesiones / Clases"
                        onRegresar={() => router.back()}
                    />
                    <EstadoVacio
                        icono="📋"
                        titulo="Sin grupo activo"
                        mensaje="Vuelve a la lista de grupos para elegir una materia."
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

    // --- Acciones ---

    const abrirCreacion = () => {
        if (sesionActiva) {
            Alert.alert(
                'Sesión en curso',
                'Ya tienes una sesión abierta en este grupo. Debes cerrar la sesión anterior antes de iniciar una nueva.',
            );
            return;
        }
        setFormData(datosIniciales);
        setErrorTitulo('');
        setVista('FORM_CREATE');
    };

    const guardar = () => {
        const titulo = formData.titulo.trim();
        if (titulo === '') {
            setErrorTitulo('Ingresa un título o tema para la sesión');
            return;
        }
        if (sesionActiva) {
            Alert.alert(
                'Sesión en curso',
                'Ya tienes una sesión abierta en este grupo. Debes cerrar la sesión anterior antes de iniciar una nueva.',
            );
            setVista('LIST');
            return;
        }
        crearSesion(titulo);
        setFormData(datosIniciales);
        setErrorTitulo('');
        setVista('LIST');
    };

    const cancelar = () => {
        setFormData(datosIniciales);
        setErrorTitulo('');
        setVista('LIST');
    };

    const abrirBorrado = (sesion: Sesion) => {
        setSesionSeleccionada(sesion);
        setVista('MODAL_DELETE');
    };

    const confirmarBorrado = () => {
        if (sesionSeleccionada) eliminarSesion(sesionSeleccionada.id);
        setSesionSeleccionada(null);
        setVista('LIST');
    };

    const cerrarBorrado = () => {
        setSesionSeleccionada(null);
        setVista('LIST');
    };

    const irAEscanear = (sesion: Sesion) => {
        router.push({ pathname: '/escanear-asistencia', params: { sesionId: String(sesion.id) } });
    };

    const verAsistencias = (sesion: Sesion) => {
        router.push({
            pathname: '/gestionar-asistencia-manual',
            params: { sesionId: String(sesion.id) },
        });
    };

    const verHistorial = () => {
        router.push({
            pathname: '/historial-asistencias',
            params: { grupoId: String(idGrupo) },
        });
    };

    const exportarReporte = () => {
        router.push({
            pathname: '/exportar-reporte',
            params: { grupoId: String(idGrupo) },
        });
    };

    // --- Subvistas ---

    if (vista === 'FORM_CREATE') {
        return (
            <VistaFormularioSesion
                formData={formData}
                errorTitulo={errorTitulo}
                onChangeTitulo={(titulo) => {
                    setFormData({ titulo });
                    setErrorTitulo('');
                }}
                onAbrir={guardar}
                onCancelar={cancelar}
            />
        );
    }

    return (
        <>
            <VistaListaSesiones
                grupo={grupo}
                sesiones={sesiones}
                sesionActiva={sesionActiva}
                onRegresar={() => router.back()}
                onAgregarSesion={abrirCreacion}
                onCerrarSesion={cerrarSesion}
                onBorrarSesion={abrirBorrado}
                onIrAEscanear={irAEscanear}
                onVerAsistencias={verAsistencias}
                onVerHistorial={verHistorial}
                onExportarReporte={exportarReporte}
            />
            <ModalConfirmacion
                visible={vista === 'MODAL_DELETE'}
                titulo="¿Eliminar esta sesión?"
                mensaje={
                    <View style={styles.cuerpoModal}>
                        <Text style={[styles.mensajeModal, { color: theme.textSecondary }]}>
                            Se borrará la sesión:
                        </Text>
                        <Text style={[styles.nombreModal, { color: theme.text }]}>
                            {sesionSeleccionada?.nombre} (
                            {sesionSeleccionada ? fechaLegible(sesionSeleccionada.fechaHora) : ''})
                        </Text>
                        <Text style={[styles.mensajeModal, { color: theme.textSecondary }]}>
                            y todos los registros de asistencia tomados ese día, sin posibilidad de
                            recuperarlos.
                        </Text>
                    </View>
                }
                textoConfirmar="Confirmar Eliminación"
                onCancelar={cerrarBorrado}
                onConfirmar={confirmarBorrado}
            />
        </>
    );
}

const styles = StyleSheet.create({
    seguro: {
        flex: 1,
    },
    contenedorColumna: {
        flex: 1,
        paddingHorizontal: Spacing.four,
        paddingVertical: Spacing.three,
        gap: Spacing.three,
    },
    cuerpoModal: {
        gap: Spacing.two,
        alignItems: 'center',
    },
    mensajeModal: {
        fontSize: 14,
        lineHeight: 20,
        textAlign: 'center',
    },
    nombreModal: {
        fontSize: 16,
        fontWeight: '800',
        textAlign: 'center',
    },
});
