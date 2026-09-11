// CU04 (vista LISTA): nómina del grupo con buscador, acciones por alumno
// y modal de desvinculación. No navega: avisa al orquestador qué hacer.

import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { BotonAccion } from '@/Presentacion/componentes/BotonAccion';
import { Buscador } from '@/Presentacion/componentes/Buscador';
import { EncabezadoPantalla } from '@/Presentacion/componentes/EncabezadoPantalla';
import { EstadoVacio } from '@/Presentacion/componentes/EstadoVacio';
import { Insignia } from '@/Presentacion/componentes/Insignia';
import { ModalConfirmacion } from '@/Presentacion/componentes/ModalConfirmacion';
import { TarjetaPrensa } from '@/Presentacion/componentes/TarjetaPrensa';
import { ThemedText } from '@/Presentacion/componentes/ThemedText';
import type { DGrupo } from '@/Negocio/NGrupo';
import { textoCarrera, type AlumnoDeGrupo } from '@/Negocio/NEstudiante';

type PropsVistaListaEstudiantes = {
    grupo: DGrupo;
    alumnos: AlumnoDeGrupo[];
    onRegresar: () => void;
    onAgregar: () => void;
    onImportar: () => void;
    onEditar: (alumno: AlumnoDeGrupo) => void;
    onQuitar: (registro: string) => void;
    onHabilitarEnrolamiento: () => void;
};

export function VistaListaEstudiantes({
    grupo,
    alumnos,
    onRegresar,
    onAgregar,
    onImportar,
    onEditar,
    onQuitar,
    onHabilitarEnrolamiento,
}: PropsVistaListaEstudiantes) {
    const theme = useTheme();

    // Estado transitorio de esta pantalla: texto del buscador y alumno del modal
    const [searchQuery, setSearchQuery] = useState('');
    const [alumnoEnModal, setAlumnoEnModal] = useState<AlumnoDeGrupo | null>(null);

    // Búsqueda en tiempo real por nombre, apellidos o registro
    const consulta = searchQuery.trim().toLowerCase();
    const alumnosFiltrados = alumnos.filter((alumno) =>
        `${alumno.nombre} ${alumno.apellidoPaterno} ${alumno.apellidoMaterno ?? ''} ${alumno.registro}`
            .toLowerCase()
            .includes(consulta),
    );

    const nombreEnModal = alumnoEnModal
        ? `${alumnoEnModal.nombre} ${alumnoEnModal.apellidoPaterno} ${alumnoEnModal.apellidoMaterno ?? ''}`.trim()
        : '';

    return (
        <SafeAreaView style={styles.seguro}>
            <View style={styles.contenedorColumna}>
                <EncabezadoPantalla
                    titulo="Estudiantes"
                    onRegresar={onRegresar}
                    insignia={
                        <Insignia
                            texto={`${grupo.nombre} - Grupo ${grupo.extension ?? '—'}`}
                            tono="informacion"
                        />
                    }
                />
                <Buscador
                    valor={searchQuery}
                    onCambiar={setSearchQuery}
                    placeholder="Buscar por nombre, apellidos o registro"
                />
                {alumnos.length === 0 ? (
                    <EstadoVacio
                        icono="👥"
                        titulo="Aún no hay estudiantes en este grupo"
                        mensaje="Agrega la nómina oficial de la materia para comenzar."
                        accion={
                            <>
                                <BotonAccion titulo="Importar desde Excel" onPulsar={onImportar} />
                                <BotonAccion
                                    titulo="Agregar alumno manualmente"
                                    variante="secundario"
                                    onPulsar={onAgregar}
                                />
                            </>
                        }
                    />
                ) : (
                    <FlatList
                        data={alumnosFiltrados}
                        keyExtractor={(alumno) => alumno.registro}
                        contentContainerStyle={styles.lista}
                        ListEmptyComponent={
                            <EstadoVacio
                                icono="🔍"
                                titulo="Sin coincidencias"
                                mensaje="Prueba con otro nombre, apellido o registro."
                            />
                        }
                        renderItem={({ item }) => (
                            <TarjetaPrensa estilo={styles.tarjetaAlumno}>
                                <View style={styles.filaAlumno}>
                                    <View style={styles.columnaAlumno}>
                                        <Text
                                            style={[styles.registroAlumno, { color: theme.text }]}
                                        >
                                            {item.registro}
                                        </Text>
                                        <ThemedText type="small" style={styles.nombreAlumno}>
                                            {`${item.nombre} ${item.apellidoPaterno} ${item.apellidoMaterno ?? ''}`.trim()}
                                        </ThemedText>
                                        {textoCarrera(item.carrera, item.plan) ? (
                                            <ThemedText type="small" themeColor="textSecondary">
                                                {textoCarrera(item.carrera, item.plan)}
                                            </ThemedText>
                                        ) : null}
                                        {item.estadoVinculacion === 'ENROLADO_BLE' ? (
                                            <Insignia texto="✔ Vinculado" tono="exito" />
                                        ) : (
                                            <Insignia texto="Pendiente" tono="advertencia" />
                                        )}
                                    </View>
                                    <View style={styles.filaAcciones}>
                                        <Pressable
                                            onPress={() => onEditar(item)}
                                            hitSlop={8}
                                            style={({ pressed }) => [
                                                styles.botonIcono,
                                                { opacity: pressed ? 0.6 : 1 },
                                            ]}
                                        >
                                            <Text style={styles.iconoAccion}>✏️</Text>
                                        </Pressable>
                                        <Pressable
                                            onPress={() => setAlumnoEnModal(item)}
                                            hitSlop={8}
                                            style={({ pressed }) => [
                                                styles.botonIcono,
                                                { opacity: pressed ? 0.6 : 1 },
                                            ]}
                                        >
                                            <Text style={styles.iconoAccion}>🗑️</Text>
                                        </Pressable>
                                    </View>
                                </View>
                            </TarjetaPrensa>
                        )}
                    />
                )}
                {alumnos.length > 0 && (
                    <View style={styles.filaAccionesContenedor}>
                        <View style={styles.filaBotones}>
                            <BotonAccion titulo="+ Agregar" compacto onPulsar={onAgregar} />
                            <BotonAccion
                                titulo="Importar nómina"
                                compacto
                                variante="secundario"
                                onPulsar={onImportar}
                            />
                        </View>
                        <BotonAccion
                            titulo="Habilitar Enrolamiento BLE"
                            variante="exito"
                            onPulsar={onHabilitarEnrolamiento}
                        />
                    </View>
                )}
            </View>
            <ModalConfirmacion
                visible={alumnoEnModal !== null}
                titulo="¿Quitar estudiante del grupo?"
                mensaje={
                    <View style={styles.cuerpoModal}>
                        <Text style={[styles.mensajeModal, { color: theme.textSecondary }]}>
                            Se desvinculará a{' '}
                            <Text style={[styles.nombreModal, { color: theme.text }]}>
                                {nombreEnModal}
                            </Text>{' '}
                            únicamente de este grupo. Sus registros generales en otros grupos o
                            perfil de la app no se borrarán.
                        </Text>
                    </View>
                }
                textoConfirmar="Confirmar Desvinculación"
                onCancelar={() => setAlumnoEnModal(null)}
                onConfirmar={() => {
                    if (alumnoEnModal) onQuitar(alumnoEnModal.registro);
                    setAlumnoEnModal(null);
                }}
            />
        </SafeAreaView>
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
        gap: Spacing.three - 2,
    },
    lista: {
        gap: Spacing.two - 2,
        paddingBottom: Spacing.three,
    },
    tarjetaAlumno: {
        paddingVertical: Spacing.two + 2,
    },
    filaAlumno: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: Spacing.two,
    },
    columnaAlumno: {
        flex: 1,
        gap: 1,
    },
    registroAlumno: {
        fontSize: 15,
        fontWeight: '800',
    },
    nombreAlumno: {
        fontWeight: '600',
    },
    filaAcciones: {
        flexDirection: 'row',
        gap: Spacing.two,
    },
    botonIcono: {
        padding: Spacing.two - 2,
    },
    iconoAccion: {
        fontSize: 18,
    },
    filaAccionesContenedor: {
        marginTop: Spacing.two,
        gap: Spacing.two,
    },
    filaBotones: {
        flexDirection: 'row',
        gap: Spacing.two,
    },
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
