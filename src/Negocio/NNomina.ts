// Tema: importación de la nómina (CU03). Vertical completo: la lectura del archivo
// (.xlsx/.csv) y el hook que expone la importación a la pantalla.
// Camino: Presentación → NNomina → (parser propio + DEstudiante/DGrupo en Datos).
// ADR-014: los tipos de la importación se toman aquí (versión publicada de Datos).

import { useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import * as XLSX from 'xlsx';

import { leerBase64DeArchivo, leerTextoDeArchivo } from '@/Negocio/Servicio/ExcelCsvServicio';

import { DEstudiante } from '@/Datos/DEstudiante';
import { DGrupo } from '@/Datos/DGrupo';
import type { AlumnoImportado, ResultadoImportacion } from '@/Datos/DEstudiante';

// Tipos que las vistas de CU03 importan desde Negocio
export type { AlumnoImportado, ResultadoImportacion } from '@/Datos/DEstudiante';

// Lo que devuelve el hook useImportacion (CU03)
export interface RespuestaUseImportacion {
    grupo: DGrupo | null;
    nombreArchivo: string | null;
    alumnosImportados: AlumnoImportado[];
    errorMensaje: string | null;
    buscarArchivo: () => Promise<boolean>;
    importar: () => ResultadoImportacion;
}

// La nómina sale del sistema universitario con nombres de columna variantes;
// estos sinónimos toleran esa variación al mapear las filas del archivo.
const COL_REGISTRO = [
    'registro',
    'matricula',
    'matrícula',
    'no. control',
    'no control',
    'codigo',
    'código',
    'expediente',
    'clave',
];
const COL_NOMBRE = ['nombres', 'nombre(s)', 'nombre'];
const COL_APELLIDO_PATERNO = ['apellido paterno', 'paterno'];
const COL_APELLIDO_MATERNO = ['apellido materno', 'materno'];
const COL_APELLIDOS_NOMBRES = [
    'apellidos y nombres',
    'apellidos y nombre',
    'apellidos',
    'nombre completo',
];
const COL_CARRERA = ['carrera', 'programa educativo', 'programa'];
const COL_PLAN = ['plan', 'plan de estudios'];
const COL_TELEFONO = ['telefono', 'tel', 'celular', 'cel'];
const COL_CORREO = ['correo', 'email', 'e-mail', 'correo electronico'];

// Quita acentos, mayúsculas y espacios dobles para comparar encabezados sin fricción
function normalizarEncabezado(encabezado: unknown): string {
    return String(encabezado ?? '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

// Busca el valor de una columna cuyo encabezado coincida con alguno de los sinónimos
function valorDeColumna(
    fila: Record<string, unknown>,
    sinonimos: string[],
): { encontrado: boolean; valor: unknown } {
    for (const [encabezado, valor] of Object.entries(fila)) {
        const normalizado = normalizarEncabezado(encabezado);
        const coincide = sinonimos.some((s) => normalizado.includes(s));
        if (coincide) return { encontrado: true, valor };
    }
    return { encontrado: false, valor: null };
}

// Convierte el valor de una celda en texto (los números del Excel pierden ceros a la izquierda)
function textoDeCelda(valor: unknown): string {
    if (valor == null) return '';
    return String(valor).trim();
}

// Convierte una fila del archivo en un DEstudiante (devuelve null si le falta Registro o Nombres).
// La nómina real trae una sola columna "Apellidos y Nombres" (Paterno + Materno + Nombres);
// si esa columna no existe, se usan las columnas separadas de Nombres/Apellidos.
function alumnoDeFila(fila: Record<string, unknown>): DEstudiante | null {
    const registro = valorDeColumna(fila, COL_REGISTRO);
    const apellidosNombre = valorDeColumna(fila, COL_APELLIDOS_NOMBRES);
    const carrera = valorDeColumna(fila, COL_CARRERA);
    const plan = valorDeColumna(fila, COL_PLAN);
    const telefono = valorDeColumna(fila, COL_TELEFONO);
    const correo = valorDeColumna(fila, COL_CORREO);

    const registroTexto = textoDeCelda(registro.valor);
    if (!registro.encontrado || registroTexto === '') return null;

    // Nombre: se prefiere la columna combinada y se aplica el orden de la nómina
    // (paterno, materno y el resto es el nombre). Con 2 palabras no hay materno.
    let nombreTexto = '';
    let apellidoPaternoTexto = '';
    let apellidoMaternoTexto: string | null = null;
    if (apellidosNombre.encontrado) {
        const partes = textoDeCelda(apellidosNombre.valor)
            .split(/\s+/)
            .filter((parte) => parte !== '');
        if (partes.length === 2) {
            apellidoPaternoTexto = partes[0];
            nombreTexto = partes[1];
        } else if (partes.length >= 3) {
            apellidoPaternoTexto = partes[0];
            apellidoMaternoTexto = partes[1];
            nombreTexto = partes.slice(2).join(' ');
        } else if (partes.length === 1) {
            apellidoPaternoTexto = partes[0];
        }
    } else {
        const nombre = valorDeColumna(fila, COL_NOMBRE);
        const apellidoPaterno = valorDeColumna(fila, COL_APELLIDO_PATERNO);
        const apellidoMaterno = valorDeColumna(fila, COL_APELLIDO_MATERNO);
        nombreTexto = textoDeCelda(nombre.valor);
        apellidoPaternoTexto = textoDeCelda(apellidoPaterno.valor);
        apellidoMaternoTexto = apellidoMaterno.encontrado
            ? textoDeCelda(apellidoMaterno.valor) || null
            : null;
    }
    if (nombreTexto === '') return null;

    const alumno = new DEstudiante();
    alumno.registro = registroTexto;
    alumno.nombre = nombreTexto;
    alumno.apellidoPaterno = apellidoPaternoTexto;
    alumno.apellidoMaterno = apellidoMaternoTexto;
    alumno.carrera = carrera.encontrado ? textoDeCelda(carrera.valor) || null : null;
    alumno.plan = plan.encontrado ? textoDeCelda(plan.valor) || null : null;
    alumno.telefono = telefono.encontrado ? textoDeCelda(telefono.valor) || null : null;
    alumno.correo = correo.encontrado ? textoDeCelda(correo.valor) || null : null;
    return alumno;
}

// Extrae los alumnos de la primera hoja de un libro de trabajo (xlsx o csv)
function alumnosDeLaHoja(libro: XLSX.WorkBook): DEstudiante[] {
    const hoja = libro.Sheets[libro.SheetNames[0]];
    if (!hoja) return [];
    const filas = XLSX.utils.sheet_to_json<Record<string, unknown>>(hoja, { defval: null });
    const alumnos: DEstudiante[] = [];
    const vistos = new Set<string>();
    for (const fila of filas) {
        const alumno = alumnoDeFila(fila);
        if (alumno == null) continue;
        // Ignora filas repetidas dentro del mismo archivo
        if (vistos.has(alumno.registro)) continue;
        vistos.add(alumno.registro);
        alumnos.push(alumno);
    }
    return alumnos;
}

async function leerXlsx(uri: string): Promise<DEstudiante[]> {
    const contenido = await leerBase64DeArchivo(uri);
    const libro = XLSX.read(contenido, { type: 'base64' });
    return alumnosDeLaHoja(libro);
}

async function leerCsv(uri: string): Promise<DEstudiante[]> {
    const contenido = await leerTextoDeArchivo(uri);
    const libro = XLSX.read(contenido, { type: 'string' });
    return alumnosDeLaHoja(libro);
}

export function useImportacion(idGrupo: number | null): RespuestaUseImportacion {
    // El grupo no cambia mientras la pantalla está montada: se lee directo de la base
    const grupo = idGrupo != null ? DGrupo.obtenerGrupoPorId(idGrupo) : null;

    const [nombreArchivo, setNombreArchivo] = useState<string | null>(null);
    const [alumnosImportados, setAlumnosImportados] = useState<AlumnoImportado[]>([]);
    const [errorMensaje, setErrorMensaje] = useState<string | null>(null);

    // Abre el selector de archivos, lee y parsea la nómina, y marca los duplicados
    // contra los que ya pertenecen al grupo. Devuelve true si hay vista previa que mostrar.
    const buscarArchivo = async (): Promise<boolean> => {
        if (idGrupo == null) return false;
        setErrorMensaje(null);
        try {
            const resultado = await DocumentPicker.getDocumentAsync({
                type: [
                    'application/vnd.ms-excel',
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'text/csv',
                    'text/comma-separated-values',
                    'application/csv',
                ],
                copyToCacheDirectory: true,
                multiple: false,
            });
            if (resultado.canceled) return false;

            const archivoElegido = resultado.assets[0];
            const extension = archivoElegido.name.toLowerCase().split('.').pop() ?? '';
            if (extension !== 'xlsx' && extension !== 'csv') {
                setErrorMensaje(
                    'Formato no válido. Debe seleccionar un archivo Excel (.xlsx) o CSV (.csv)',
                );
                return false;
            }

            const alumnosLeidos =
                extension === 'csv'
                    ? await leerCsv(archivoElegido.uri)
                    : await leerXlsx(archivoElegido.uri);
            if (alumnosLeidos.length === 0) {
                setErrorMensaje(
                    'El archivo no contiene datos procesables. Verifica que tenga una columna para el Registro Universitario y otra para los Nombres.',
                );
                return false;
            }

            const vinculados = DEstudiante.listarAlumnosDelGrupo(idGrupo);
            const registrosVinculados = new Set(vinculados.map((alumno) => alumno.registro));
            const alumnosMarcados: AlumnoImportado[] = alumnosLeidos.map((alumno) => ({
                ...alumno,
                estadoImportacion: registrosVinculados.has(alumno.registro) ? 'DUPLICADO' : 'NUEVO',
            }));

            setNombreArchivo(archivoElegido.name);
            setAlumnosImportados(alumnosMarcados);
            return true;
        } catch {
            setErrorMensaje(
                'No se pudo leer el archivo. Asegúrate de que sea una nómina válida (.xlsx o .csv).',
            );
            return false;
        }
    };

    // Confirma la importación: inserta a los nuevos en la base en una sola transacción.
    // El hook es el único que conoce la nómina marcada (NUEVO/DUPLICADO); la pantalla solo confirma.
    const importar = (): ResultadoImportacion => {
        if (idGrupo == null) return { nuevos: 0, duplicados: 0 };
        const alumnosNuevos = alumnosImportados.filter(
            (alumno) => alumno.estadoImportacion === 'NUEVO',
        );
        return DEstudiante.importarNomina(idGrupo, alumnosNuevos);
    };

    return { grupo, nombreArchivo, alumnosImportados, errorMensaje, buscarArchivo, importar };
}
