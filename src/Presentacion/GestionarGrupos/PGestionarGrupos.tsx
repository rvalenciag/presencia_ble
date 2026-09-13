// CU02: Gestionar Grupos (lado docente).
// Orquestador: guarda el estado de la pantalla y decide qué subvista mostrar.
// Las subvistas viven en ./GestionarGrupos/ (VistaListaGrupos, VistaFormularioGrupo).

import { useState } from 'react';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ModalConfirmacion } from '@/Presentacion/componentes/ModalConfirmacion';
import { VistaFormularioGrupo } from './VistaFormularioGrupo';
import { VistaListaGrupos } from './VistaListaGrupos';
import { datosIniciales } from './tipos';
import { useGrupos } from '@/Negocio/NGrupo';

import type {
    DatosFormulario,
    ErroresFormulario,
    Vista,
} from './tipos';

import type { Grupo } from '@/Negocio/NGrupo';

// Valida el formulario según el spec; devuelve los errores por campo (vacío = todo bien)
function validarFormulario(formData: DatosFormulario): ErroresFormulario {
    const errores: ErroresFormulario = {};
    if (formData.nombre.trim() === '') {
        errores.nombre = 'El nombre de la materia es obligatorio';
    }
    if (formData.semestre.trim() === '' || !/^\d{1,2}$/.test(formData.semestre)) {
        errores.semestre = 'Ingresa un semestre válido (ej. 1)';
    }
    if (!/^\d{4}$/.test(formData.anio)) {
        errores.anio = 'Ingresa un año válido (ej. 2026)';
    }
    return errores;
}

export function PGestionarGrupos() {
    const theme = useTheme();
    const { grupos, conteoPorGrupo, crearGrupo, actualizarGrupo, eliminarGrupo } = useGrupos();

    const [vista, setVista] = useState<Vista>('LIST');
    const [grupoSeleccionado, setGrupoSeleccionado] = useState<Grupo | null>(null);
    const [formData, setFormData] = useState<DatosFormulario>(datosIniciales);
    const [errors, setErrors] = useState<ErroresFormulario>({});

    const actualizarCampo = (campo: keyof DatosFormulario, valor: string | null) => {
        setFormData((previo) => ({ ...previo, [campo]: valor }));
        setErrors((previo) => ({ ...previo, [campo]: undefined }));
    };

    const abrirCreacion = () => {
        setFormData(datosIniciales);
        setErrors({});
        setVista('FORM_CREATE');
    };

    const abrirEdicion = (grupo: Grupo) => {
        setGrupoSeleccionado(grupo);
        setFormData({
            nombre: grupo.nombre,
            extension: grupo.extension ?? '',
            semestre: grupo.semestre ?? '',
            anio: grupo.anio !== null ? String(grupo.anio) : '',
        });
        setErrors({});
        setVista('FORM_EDIT');
    };

    const guardar = () => {
        const nuevosErrores = validarFormulario(formData);
        if (Object.keys(nuevosErrores).length > 0) {
            setErrors(nuevosErrores);
            return;
        }

        const datos = {
            nombre: formData.nombre.trim(),
            extension: formData.extension.trim() || null,
            semestre: formData.semestre.trim() || null,
            anio: Number(formData.anio),
        };

        if (vista === 'FORM_CREATE') {
            crearGrupo(datos);
        } else if (grupoSeleccionado) {
            actualizarGrupo(grupoSeleccionado.id, datos);
        }

        setFormData(datosIniciales);
        setGrupoSeleccionado(null);
        setErrors({});
        setVista('LIST');
    };

    const cancelar = () => {
        setFormData(datosIniciales);
        setGrupoSeleccionado(null);
        setErrors({});
        setVista('LIST');
    };

    const abrirBorrado = (grupo: Grupo) => {
        setGrupoSeleccionado(grupo);
        setVista('MODAL_DELETE');
    };

    const confirmarBorrado = () => {
        if (grupoSeleccionado) {
            eliminarGrupo(grupoSeleccionado.id);
        }
        setGrupoSeleccionado(null);
        setVista('LIST');
    };

    const cerrarBorrado = () => {
        setGrupoSeleccionado(null);
        setVista('LIST');
    };

    const entrarAlGrupo = (grupo: Grupo) => {
        router.push({ pathname: '/gestionar-estudiantes', params: { grupoId: String(grupo.id) } });
    };

    // Vistas 2 y 3: formulario de creación / edición
    if (vista === 'FORM_CREATE' || vista === 'FORM_EDIT') {
        return (
            <VistaFormularioGrupo
                modo={vista}
                formData={formData}
                errors={errors}
                onActualizarCampo={actualizarCampo}
                onGuardar={guardar}
                onCancelar={cancelar}
            />
        );
    }

    // Vista 1: lista de grupos (con el modal de borrado montado encima)
    return (
        <>
            <VistaListaGrupos
                grupos={grupos}
                conteoPorGrupo={conteoPorGrupo}
                onCrearGrupo={abrirCreacion}
                onEditarGrupo={abrirEdicion}
                onBorrarGrupo={abrirBorrado}
                onEntrarGrupo={entrarAlGrupo}
            />
            <ModalConfirmacion
                visible={vista === 'MODAL_DELETE'}
                titulo="¿Eliminar este grupo?"
                mensaje={
                    <View style={styles.cuerpoModal}>
                        <Text style={[styles.mensajeModal, { color: theme.textSecondary }]}>
                            Se borrarán permanentemente las listas de estudiantes, sesiones de clase
                            e historial de asistencias vinculados a este grupo.
                        </Text>
                        <Text style={[styles.nombreModal, { color: theme.text }]}>
                            {grupoSeleccionado?.nombre}
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
