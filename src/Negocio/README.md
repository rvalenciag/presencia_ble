# Negocio — capa de orquestación

Aquí viven los archivos N, uno por tema. Carpeta **plana**, sin subcarpetas.

- `NPerfil` — perfil del usuario (CU01) y sesión de inicio.
- `NGrupo` — grupos del docente (CU02) y vinculados del estudiante (CU07/CU08) en un solo `useGrupos`.
- `NNomina` — **importación de la nómina** (CU03): parser del archivo + `useImportacion`.
- `NEstudiante` — gestión de la nómina (CU04): `useGestionEstudiantes` + `textoCarrera`.
- `NEnrolamiento` — enrolamiento BLE (CU05, docente): `useEnrolamiento` (faro + escucha, ADR-016).
- `NVinculacion` — vinculación del dispositivo (CU06, estudiante): `useVinculacion` (radar + identidad + respuesta, ADR-016).
- `Servicio/BluetoothServicio` — servicio BLE transversal (estado, codec de canales, escaneo, emisión; ADR-018).
- `NSesion`, `NAsistencia` — nacen en sus fases (CU09; NAsistencia = consola CU12–CU14). `NTransmitirPresencia` (CU10) y `NEscanearAsistencia` (CU11) — radio por rol (ADR-019).

- Diseño completo y firmas: `instructions/diseno-negocio.md` · protocolo BLE: `instructions/diseno-ble.md`
- Reglas: esta capa importa `Datos/` (jamás `Presentacion/`); re-exporta los tipos de Datos hacia las vistas (ADR-014)
- **Primera Ley**: antes de crear un archivo N, ¿puede ser un método de uno existente?
- Convención de nombres y estilo: `instructions/arquitectura-trabajo.md` §7
