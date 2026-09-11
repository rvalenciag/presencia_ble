// Tema: intercambio de archivos Excel/CSV con el sistema (CU03 importar, CU14 exportar).
// Servicio transversal (ADR-020): leer libros, escribir reportes y compartir.
// Lo usan NNomina (lectura de la nómina) y NAsistencia/useReporte (escritura del
// reporte + menú compartir). El parseo a alumnos y la matriz P/A/L quedan en su N.

import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

// Lee el texto de un archivo por su uri (CSV de nómina)
export async function leerTextoDeArchivo(uri: string): Promise<string> {
    return new File(uri).text();
}

// Lee el base64 de un archivo por su uri (XLSX de nómina)
export async function leerBase64DeArchivo(uri: string): Promise<string> {
    return new File(uri).base64();
}

// Guarda un texto (CSV) en documentos y devuelve el archivo
export function escribirTextoEnDocumentos(nombre: string, contenido: string): File {
    const archivo = new File(Paths.document, nombre);
    archivo.write(contenido);
    return archivo;
}

// Guarda un base64 (XLSX) en documentos y devuelve el archivo
export function escribirBase64EnDocumentos(nombre: string, base64: string): File {
    const archivo = new File(Paths.document, nombre);
    archivo.write(base64, { encoding: 'base64' });
    return archivo;
}

// Tamaño en KB para la ficha del reporte (mínimo 1 para no mostrar 0)
export function tamanoKbDe(archivo: File): number {
    const bytes = archivo.info().size ?? 0;
    return Math.max(1, Math.round(bytes / 1024));
}

// Abre el menú compartir del sistema (WhatsApp, correo, nube); false si no disponible
export async function compartirArchivo(uri: string, mimeType?: string): Promise<boolean> {
    if (!(await Sharing.isAvailableAsync())) return false;
    await Sharing.shareAsync(uri, mimeType ? { mimeType } : undefined);
    return true;
}
