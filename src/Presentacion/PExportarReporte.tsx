// Orquestador del CU14 (Exportar Reporte): resuelve el grupo del parámetro,
// se autoprovee de useReporte y despacha formulario / generando / éxito /
// excepción (nombres EXACTOS del spec). La validación del formulario vive en
// la vista; aquí solo se genera, se comparte y se muestran los errores.

import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
    useReporte,
    type ArchivoGenerado,
    type ConfigReporte,
    type FormatoReporte,
    type TipoRango,
} from '@/Negocio/NAsistencia';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { BotonAccion } from '@/Presentacion/componentes/BotonAccion';
import { EstadoVacio } from '@/Presentacion/componentes/EstadoVacio';
import { ModalConfirmacion } from '@/Presentacion/componentes/ModalConfirmacion';
import { VistaExitoReporte } from '@/Presentacion/ExportarReporte/VistaExitoReporte';
import { VistaFormularioReporte } from '@/Presentacion/ExportarReporte/VistaFormularioReporte';
import type { MotivoExcepcion, VistaReporte } from '@/Presentacion/ExportarReporte/tipos';

export function PExportarReporte() {
    const theme = useTheme();
    const { grupoId } = useLocalSearchParams<{ grupoId?: string }>();
    const idGrupo = grupoId ? Number(grupoId) : null;

    const { grupo, inscritos, totalSesiones, generarReporte, compartirReporte } =
        useReporte(idGrupo);
    const [vista, setVista] = useState<VistaReporte>('EXPORT_FORM');
    const [archivo, setArchivo] = useState<ArchivoGenerado | null>(null);
    const [formato, setFormato] = useState<FormatoReporte>('XLSX');
    const [rangoElegido, setRangoElegido] = useState<TipoRango>('SEMESTRE');
    const [motivo, setMotivo] = useState<MotivoExcepcion | null>(null);

    const generar = (config: ConfigReporte) => {
        setVista('GENERATING');
        setFormato(config.formato);
        setRangoElegido(config.rango);
        const resultado = generarReporte(config);
        if (resultado.archivo) {
            setArchivo(resultado.archivo);
            setVista('SUCCESS_SHARE');
            return;
        }
        setMotivo(resultado.error === 'NO_DATA' ? 'NO_DATA' : 'ERROR_ARCHIVO');
        setVista('EXCEPTION_ALERT');
    };

    const compartir = async () => {
        if (!archivo) return;
        const ok = await compartirReporte(archivo.uri, formato);
        if (!ok) {
            Alert.alert(
                'No se pudo compartir',
                'El archivo quedó guardado en Documentos de la app.',
            );
        }
    };

    if (!grupo) {
        return (
            <SafeAreaView style={styles.area}>
                <View style={styles.contenedorCentrado}>
                    <EstadoVacio
                        icono="📚"
                        titulo="Grupo no encontrado"
                        mensaje="Selecciona una materia para exportar su reporte."
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

    const sigla = `${grupo.nombre}${grupo.extension != null ? ' - ' + grupo.extension : ''}`;

    if (vista === 'SUCCESS_SHARE' && archivo) {
        return (
            <VistaExitoReporte
                archivo={archivo}
                formato={formato}
                rango={rangoElegido}
                onCompartir={() => void compartir()}
                onVolverAlGrupo={() => router.back()}
            />
        );
    }

    return (
        <>
            {vista === 'GENERATING' ? (
                <SafeAreaView style={styles.area}>
                    <View style={styles.contenedorCentrado}>
                        <ActivityIndicator size="large" />
                        <Text style={[styles.textoGenerando, { color: theme.textSecondary }]}>
                            Consultando base de datos SQLite y estructurando matriz de alumnos vs.
                            fechas...
                        </Text>
                    </View>
                </SafeAreaView>
            ) : (
                <VistaFormularioReporte
                    grupoNombre={grupo.nombre}
                    sigla={sigla}
                    inscritos={inscritos}
                    totalSesiones={totalSesiones}
                    onVolver={() => router.back()}
                    onGenerar={generar}
                />
            )}
            <ModalConfirmacion
                visible={vista === 'EXCEPTION_ALERT'}
                icono={motivo === 'NO_DATA' ? '📭' : '⚠️'}
                tonoIcono={motivo === 'NO_DATA' ? 'informacion' : 'error'}
                titulo={motivo === 'NO_DATA' ? 'Sin Registros' : 'No se pudo crear el archivo'}
                mensaje={
                    motivo === 'NO_DATA'
                        ? 'No se encontraron clases ni marcaciones de asistencia dentro del rango de fechas seleccionado.'
                        : 'Ocurrió un error al generar el archivo. Intenta nuevamente.'
                }
                textoConfirmar={motivo === 'NO_DATA' ? 'Cambiar Rango' : 'Entendido'}
                textoCancelar={null}
                tonoConfirmar="primario"
                onConfirmar={() => setVista('EXPORT_FORM')}
                onCancelar={() => setVista('EXPORT_FORM')}
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
        alignItems: 'center',
        gap: Spacing.three,
        padding: Spacing.four,
    },
    textoGenerando: {
        fontSize: 15,
        lineHeight: 22,
        textAlign: 'center',
    },
});
