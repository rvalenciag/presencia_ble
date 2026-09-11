// CU03: Importar Lista de Estudiantes.
// Orquestador: lee el grupo de la ruta, llama a useImportacion y mueve la pantalla
// por los pasos del spec (FILE_PICKER · PREVIEW · SUCCESS) según la lectura del archivo.

import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { BotonAccion } from '@/Presentacion/componentes/BotonAccion';
import { EncabezadoPantalla } from '@/Presentacion/componentes/EncabezadoPantalla';
import { EstadoVacio } from '@/Presentacion/componentes/EstadoVacio';
import { VistaExitoImportacion } from '@/Presentacion/ImportarLista/VistaExitoImportacion';
import { VistaPreviaImportacion } from '@/Presentacion/ImportarLista/VistaPreviaImportacion';
import { VistaSelectorArchivo } from '@/Presentacion/ImportarLista/VistaSelectorArchivo';
import { resultadoInicial, type Paso } from '@/Presentacion/ImportarLista/tipos';
import { useImportacion } from '@/Negocio/NNomina';
import type { ResultadoImportacion } from '@/Negocio/NNomina';

export function PImportarLista() {
    // El grupo llega por la URL (lo manda la pantalla del grupo)
    const { grupoId } = useLocalSearchParams<{ grupoId?: string }>();
    const idGrupo = grupoId ? Number(grupoId) : null;

    const { grupo, nombreArchivo, alumnosImportados, errorMensaje, buscarArchivo, importar } =
        useImportacion(idGrupo);

    const [paso, setPaso] = useState<Paso>('FILE_PICKER');
    const [resultadoFinal, setResultadoFinal] = useState<ResultadoImportacion>(resultadoInicial);

    // Sin grupo activo todavía no hay nada que importar
    if (!grupo) {
        return (
            <SafeAreaView style={styles.seguro}>
                <View style={styles.contenedorColumna}>
                    <EncabezadoPantalla
                        titulo="Importar Estudiantes"
                        onRegresar={() => router.back()}
                    />
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

    // Abre el selector y, si el archivo se pudo leer, avanza a la vista previa
    const elegirArchivo = async () => {
        const listo = await buscarArchivo();
        if (listo) setPaso('PREVIEW');
    };

    // Confirma la importación: el hook filtra los alumnos NUEVO y los inserta
    const confirmarImportacion = () => {
        setResultadoFinal(importar());
        setPaso('SUCCESS');
    };

    if (paso === 'PREVIEW') {
        return (
            <VistaPreviaImportacion
                nombreArchivo={nombreArchivo ?? '—'}
                alumnosImportados={alumnosImportados}
                onConfirmar={confirmarImportacion}
                onElegirOtro={() => setPaso('FILE_PICKER')}
            />
        );
    }

    if (paso === 'SUCCESS') {
        return (
            <VistaExitoImportacion
                resultado={resultadoFinal}
                onVerLista={() =>
                    router.replace({
                        pathname: '/gestionar-estudiantes',
                        params: { grupoId: String(grupo.id) },
                    })
                }
                onRegresar={() => router.replace({ pathname: '/gestionar-grupos' })}
            />
        );
    }

    return (
        <VistaSelectorArchivo
            grupo={grupo}
            errorMensaje={errorMensaje}
            onRegresar={() => router.back()}
            onBuscar={elegirArchivo}
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
