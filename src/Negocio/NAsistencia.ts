// Tema: asistencia (espejo de la tabla asistencia) — consola docente.
// CU12 (useAsistenciaManual), CU13 (useHistorial) y CU14 (useReporte) vivirán aquí.
// El radio ya vive separado por rol: NTransmitirPresencia (CU10, estudiante) y
// NEscanearAsistencia (CU11, docente); ambos importan el service BluetoothServicio.
// ADR-014: cuando nazcan, este archivo re-exportará los tipos que usen sus vistas.
// ADR-019: split por rol — este shell es casa futura decidida, no código anticipado.
export {};
