# Datos — capa de persistencia

Aquí viven los **8 archivos D** (base, una tabla = un D — ADR-010): `DConexion` (abre la base + crea las tablas), `DDispositivo`, `DPerfil`, `DGrupo`, `DEstudiante`, `DGrupoEstudiante`, `DSesion`, `DAsistencia`. Carpeta **plana**, sin subcarpetas.

- Diseño completo y firmas: `instructions/diseno-datos.md`
- DDL oficial: `instructions/presencia_ble_db_20260907_0052.sql`
- Reglas: esta capa declara los **tipos de dominio** (ADR-014): cada D es una clase que declara sus atributos (espejo de su tabla) y métodos `static`; las interfaces de flujo viven en su D. Negocio re-exporta los tipos; **ninguna pantalla importa esta capa jamás**.
- **Primera Ley**: antes de crear un archivo D, ¿puede ser un método de uno existente?
- Convención de nombres y estilo: `instructions/arquitectura-trabajo.md` §7
- Construidos en el slice CU01 (fase 2 del roadmap): `DConexion`, `DDispositivo`, `DPerfil`, `DEstudiante`. Espejos con atributos (nacidos con ADR-014): `DGrupo`, `DGrupoEstudiante`. Los 2 restantes (`DSesion`, `DAsistencia`) nacen en sus respectivos slices.
