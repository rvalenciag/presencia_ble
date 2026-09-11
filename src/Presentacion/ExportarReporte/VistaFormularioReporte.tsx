// CU14 (vista EXPORT_FORM): panel de configuración del reporte. El formulario
// (formato, rango y fechas DD/MM/AAAA validadas) vive en la vista; el
// orquestador solo recibe el ConfigReporte limpio.

import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { BotonAccion } from '@/Presentacion/componentes/BotonAccion';
import { CampoTexto } from '@/Presentacion/componentes/CampoTexto';
import { EncabezadoPantalla } from '@/Presentacion/componentes/EncabezadoPantalla';
import { Insignia } from '@/Presentacion/componentes/Insignia';
import { ThemedText } from '@/Presentacion/componentes/ThemedText';
import { Tonos } from '@/Presentacion/componentes/Colores';
import type { FormatoReporte, TipoRango } from '@/Negocio/NAsistencia';
import type { PropsVistaFormularioReporte } from './tipos';

// 'DD/MM/AAAA' → 'YYYY-MM-DD' o null si no es fecha real
function aIso(texto: string): string | null {
    const partes = texto.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!partes) return null;
    const dia = Number(partes[1]);
    const mes = Number(partes[2]);
    const anio = Number(partes[3]);
    const fecha = new Date(anio, mes - 1, dia);
    if (
        fecha.getFullYear() !== anio ||
        fecha.getMonth() !== mes - 1 ||
        fecha.getDate() !== dia
    ) {
        return null;
    }
    return `${partes[3]}-${partes[2]}-${partes[1]}`;
}

const FORMATOS: { id: FormatoReporte; titulo: string }[] = [
    { id: 'XLSX', titulo: 'Libro de Excel (.xlsx)' },
    { id: 'CSV', titulo: 'Texto Plano (.csv)' },
];

const RANGOS: { id: TipoRango; titulo: string }[] = [
    { id: 'SEMESTRE', titulo: 'Todo el Semestre' },
    { id: 'CUSTOM', titulo: 'Rango Personalizado' },
];

export function VistaFormularioReporte({
    grupoNombre,
    sigla,
    inscritos,
    totalSesiones,
    onVolver,
    onGenerar,
}: PropsVistaFormularioReporte) {
    const theme = useTheme();
    const [formato, setFormato] = useState<FormatoReporte>('XLSX');
    const [rango, setRango] = useState<TipoRango>('SEMESTRE');
    const [inicio, setInicio] = useState('');
    const [fin, setFin] = useState('');
    const [errorRango, setErrorRango] = useState<string | null>(null);

    const generar = () => {
        if (rango === 'SEMESTRE') {
            onGenerar({ formato, rango, inicio: null, fin: null });
            return;
        }
        const desde = aIso(inicio);
        const hasta = aIso(fin);
        if (desde == null || hasta == null) {
            setErrorRango('Escribe fechas válidas con formato DD/MM/AAAA.');
            return;
        }
        if (desde > hasta) {
            setErrorRango('La fecha de inicio no puede ser posterior a la de fin.');
            return;
        }
        setErrorRango(null);
        onGenerar({ formato, rango, inicio: desde, fin: hasta });
    };

    return (
        <SafeAreaView style={styles.seguro}>
            <View style={styles.columna}>
                <EncabezadoPantalla
                    titulo="Exportar Asistencias"
                    onRegresar={onVolver}
                    insignia={<Insignia texto={sigla} tono="informacion" />}
                />
                <View style={[styles.tarjeta, { backgroundColor: theme.backgroundElement }]}>
                    <ThemedText type="smallBold">{grupoNombre}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                        {`${inscritos} Alumnos - ${totalSesiones} Clases`}
                    </ThemedText>
                </View>

                <ThemedText type="smallBold">Formato de Salida</ThemedText>
                <View style={styles.filaOpciones}>
                    {FORMATOS.map((opcion) => {
                        const activo = formato === opcion.id;
                        return (
                            <Pressable
                                key={opcion.id}
                                onPress={() => setFormato(opcion.id)}
                                style={[
                                    styles.chip,
                                    {
                                        backgroundColor: activo
                                            ? Tonos.informacion.suave
                                            : theme.backgroundElement,
                                        borderColor: activo
                                            ? Tonos.informacion.solido
                                            : 'transparent',
                                    },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.chipTexto,
                                        {
                                            color: activo
                                                ? Tonos.informacion.solido
                                                : theme.textSecondary,
                                        },
                                    ]}
                                >
                                    {opcion.titulo}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>

                <ThemedText type="smallBold">Rango de Fechas</ThemedText>
                <View style={styles.filaOpciones}>
                    {RANGOS.map((opcion) => {
                        const activo = rango === opcion.id;
                        return (
                            <Pressable
                                key={opcion.id}
                                onPress={() => setRango(opcion.id)}
                                style={[
                                    styles.chip,
                                    {
                                        backgroundColor: activo
                                            ? Tonos.informacion.suave
                                            : theme.backgroundElement,
                                        borderColor: activo
                                            ? Tonos.informacion.solido
                                            : 'transparent',
                                    },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.chipTexto,
                                        {
                                            color: activo
                                                ? Tonos.informacion.solido
                                                : theme.textSecondary,
                                        },
                                    ]}
                                >
                                    {opcion.titulo}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>

                {rango === 'CUSTOM' ? (
                    <View style={styles.filaFechas}>
                        <View style={styles.campoFecha}>
                            <CampoTexto
                                etiqueta="Fecha Inicio"
                                valor={inicio}
                                onCambiar={setInicio}
                                placeholder="DD/MM/AAAA"
                                maxLength={10}
                            />
                        </View>
                        <View style={styles.campoFecha}>
                            <CampoTexto
                                etiqueta="Fecha Fin"
                                valor={fin}
                                onCambiar={setFin}
                                placeholder="DD/MM/AAAA"
                                maxLength={10}
                            />
                        </View>
                    </View>
                ) : null}
                {errorRango ? (
                    <ThemedText type="small" style={{ color: Tonos.error.solido }}>
                        {errorRango}
                    </ThemedText>
                ) : null}

                <BotonAccion titulo="Generar Archivo" variante="exito" onPulsar={generar} />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    seguro: {
        flex: 1,
    },
    columna: {
        flex: 1,
        paddingHorizontal: Spacing.four,
        paddingVertical: Spacing.three,
        gap: Spacing.three - 2,
    },
    tarjeta: {
        borderRadius: 16,
        padding: Spacing.three,
        gap: 2,
    },
    filaOpciones: {
        flexDirection: 'row',
        gap: Spacing.two,
    },
    chip: {
        flex: 1,
        borderRadius: 12,
        borderWidth: 1.5,
        paddingVertical: Spacing.two + 2,
        alignItems: 'center',
    },
    chipTexto: {
        fontSize: 14,
        fontWeight: '700',
        textAlign: 'center',
    },
    filaFechas: {
        flexDirection: 'row',
        gap: Spacing.two,
    },
    campoFecha: {
        flex: 1,
    },
});
