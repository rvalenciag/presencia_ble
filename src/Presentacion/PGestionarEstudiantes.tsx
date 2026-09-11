// CU04: Gestionar Estudiantes (nómina del grupo, lado docente).
// Orquestador: lee el grupo de la ruta, llama a useGestionEstudiantes, valida el
// formulario y monta la vista correspondiente (lista o formulario de alumno).

import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { BotonAccion } from '@/Presentacion/componentes/BotonAccion';
import { EncabezadoPantalla } from '@/Presentacion/componentes/EncabezadoPantalla';
import { EstadoVacio } from '@/Presentacion/componentes/EstadoVacio';
import { VistaFormularioEstudiante } from '@/Presentacion/GestionarEstudiantes/VistaFormularioEstudiante';
import { VistaListaEstudiantes } from '@/Presentacion/GestionarEstudiantes/VistaListaEstudiantes';
import {
    datosIniciales,
    formularioDeAlumno,
    type DatosFormulario,
    type ErroresFormulario,
    type Vista,
} from '@/Presentacion/GestionarEstudiantes/tipos';
import { useGestionEstudiantes } from '@/Negocio/NEstudiante';
import type { AlumnoDeGrupo, CambiosEstudiante } from '@/Negocio/NEstudiante';

export function PGestionarEstudiantes() {
    // El grupo llega por la URL (lo manda la lista de grupos)
    const { grupoId } = useLocalSearchParams<{ grupoId?: string }>();
    const idGrupo = grupoId ? Number(grupoId) : null;

    const { grupo, alumnos, agregarAlumno, actualizarAlumno, quitarAlumno } =
        useGestionEstudiantes(idGrupo);

    const [vista, setVista] = useState<Vista>('LIST');
    const [formData, setFormData] = useState<DatosFormulario>(datosIniciales);
    const [errores, setErrores] = useState<ErroresFormulario>({});

    // Sin grupo activo todavía no hay nómina que gestionar
    if (!grupo) {
        return (
            <SafeAreaView style={styles.seguro}>
                <View style={styles.contenedorColumna}>
                    <EncabezadoPantalla titulo="Estudiantes" onRegresar={() => router.back()} />
                    <EstadoVacio
                        icono="📚"
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

    const cambiarCampo = (campo: keyof DatosFormulario, valor: string) => {
        setFormData((previo) => ({ ...previo, [campo]: valor }));
        setErrores((previo) => ({ ...previo, [campo]: undefined }));
    };

    const abrirAlta = () => {
        setFormData(datosIniciales);
        setErrores({});
        setVista('FORM_ADD');
    };

    const abrirEdicion = (alumno: AlumnoDeGrupo) => {
        setFormData(formularioDeAlumno(alumno));
        setErrores({});
        setVista('FORM_EDIT');
    };

    const guardar = () => {
        // Validaciones del spec: vacíos, registro solo números y sin duplicados en el grupo
        const nuevosErrores: ErroresFormulario = {};
        if (formData.registro.trim() === '') {
            nuevosErrores.registro = 'Campo obligatorio';
        }
        if (formData.nombre.trim() === '') {
            nuevosErrores.nombre = 'Campo obligatorio';
        }
        if (formData.apellidoPaterno.trim() === '') {
            nuevosErrores.apellidoPaterno = 'Campo obligatorio';
        }

        if (vista === 'FORM_ADD') {
            if (!nuevosErrores.registro && !/^\d+$/.test(formData.registro)) {
                nuevosErrores.registro = 'Ingresa un Registro Universitario válido (solo números)';
            }
            const registro = formData.registro.trim();
            if (!nuevosErrores.registro && alumnos.some((alumno) => alumno.registro === registro)) {
                nuevosErrores.registro =
                    'El estudiante con este Registro ya forma parte de la lista';
            }
        }

        if (Object.keys(nuevosErrores).length > 0) {
            setErrores(nuevosErrores);
            return;
        }

        if (vista === 'FORM_ADD') {
            agregarAlumno({
                registro: formData.registro.trim(),
                nombre: formData.nombre.trim(),
                apellidoPaterno: formData.apellidoPaterno.trim(),
                apellidoMaterno: formData.apellidoMaterno.trim() || null,
                carrera: formData.carrera.trim() || null,
                plan: formData.plan.trim() || null,
                telefono: formData.telefono.trim() || null,
                correo: formData.correo.trim() || null,
            });
        } else {
            const cambios: CambiosEstudiante = {
                nombre: formData.nombre.trim(),
                apellidoPaterno: formData.apellidoPaterno.trim(),
                apellidoMaterno: formData.apellidoMaterno.trim() || null,
                carrera: formData.carrera.trim() || null,
                plan: formData.plan.trim() || null,
                telefono: formData.telefono.trim() || null,
                correo: formData.correo.trim() || null,
            };
            actualizarAlumno(formData.registro.trim(), cambios);
        }
        setFormData(datosIniciales);
        setVista('LIST');
    };

    const cancelar = () => {
        setFormData(datosIniciales);
        setErrores({});
        setVista('LIST');
    };

    if (vista === 'FORM_ADD' || vista === 'FORM_EDIT') {
        return (
            <VistaFormularioEstudiante
                titulo={vista === 'FORM_ADD' ? 'Agregar Estudiante' : 'Editar Estudiante'}
                readOnlyRegistro={vista === 'FORM_EDIT'}
                formData={formData}
                errores={errores}
                onChangeCampo={cambiarCampo}
                onGuardar={guardar}
                onCancelar={cancelar}
            />
        );
    }

    return (
        <VistaListaEstudiantes
            grupo={grupo}
            alumnos={alumnos}
            onRegresar={() => router.back()}
            onAgregar={abrirAlta}
            onImportar={() =>
                router.push({
                    pathname: '/importar-lista',
                    params: { grupoId: String(grupo.id) },
                })
            }
            onEditar={abrirEdicion}
            onQuitar={quitarAlumno}
            onHabilitarEnrolamiento={() =>
                router.push({
                    pathname: '/habilitar-enrolamiento',
                    params: { grupoId: String(grupo.id) },
                })
            }
            onGestionarSesiones={() =>
                router.push({
                    pathname: '/gestionar-sesiones',
                    params: { grupoId: String(grupo.id) },
                })
            }
        />
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
});
