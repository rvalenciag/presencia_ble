// La puerta de la base de datos: abre presencia_ble.db una sola vez,
// activa las llaves foráneas y crea las tablas del DDL oficial si no existen.
// ADR-014: la clase declara sus atributos y el constructor hace el trabajo.

import { open, type DB } from '@op-engineering/op-sqlite';

export class DConexion {
    // Atributos de la conexión
    nombreBase: string = 'presencia_ble.db';
    esquemaSql: string;
    baseDatos: DB;

    constructor() {
        // El DDL oficial del proyecto (instructions/presencia_ble_db_20260907_0052.sql),
        // con IF NOT EXISTS para poder ejecutarlo siempre sin romper nada.
        this.esquemaSql = `
CREATE TABLE IF NOT EXISTS perfil (
  registro TEXT PRIMARY KEY,
  rol TEXT NOT NULL CHECK(rol IN ('DOCENTE', 'ESTUDIANTE')),
  nombre TEXT NOT NULL,
  apellido_paterno TEXT,
  apellido_materno TEXT,
  correo TEXT,
  carrera TEXT,
  uuid TEXT UNIQUE,
  fecha DATETIME DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS grupo (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  extension TEXT,
  semestre TEXT,
  anio INTEGER
);

CREATE TABLE IF NOT EXISTS estudiante (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  registro TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  apellido_paterno TEXT,
  apellido_materno TEXT,
  carrera TEXT,
  plan TEXT,
  telefono TEXT,
  correo TEXT,
  uuid TEXT UNIQUE,
  fecha DATETIME DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS grupo_estudiante (
  id_grupo INTEGER NOT NULL,
  id_estudiante INTEGER NOT NULL,
  fecha_inscripcion DATETIME DEFAULT (datetime('now', 'localtime')),
  estado_vinculacion TEXT DEFAULT 'PENDIENTE' CHECK(estado_vinculacion IN ('PENDIENTE', 'ENROLADO_BLE', 'CANCELADO')),
  PRIMARY KEY (id_grupo, id_estudiante),
  FOREIGN KEY (id_grupo) REFERENCES grupo(id) ON DELETE CASCADE,
  FOREIGN KEY (id_estudiante) REFERENCES estudiante(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sesion (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  id_grupo INTEGER NOT NULL,
  nombre TEXT NOT NULL,
  estado TEXT DEFAULT 'ABIERTA' CHECK(estado IN ('ABIERTA', 'CERRADA')),
  fecha_hora DATETIME DEFAULT (datetime('now', 'localtime')),
  FOREIGN KEY (id_grupo) REFERENCES grupo(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS asistencia (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  id_sesion INTEGER NOT NULL,
  id_estudiante INTEGER NOT NULL,
  estado TEXT DEFAULT 'AUSENTE' CHECK(estado IN ('PRESENTE', 'AUSENTE', 'LICENCIA')),
  metodo TEXT DEFAULT 'BLE_AUTOMATICO' CHECK(metodo IN ('BLE_AUTOMATICO', 'MANUAL')),
  rssi INTEGER,
  fecha_hora DATETIME DEFAULT (datetime('now', 'localtime')),
  CONSTRAINT uq_sesion_estudiante UNIQUE (id_sesion, id_estudiante),
  FOREIGN KEY (id_sesion) REFERENCES sesion(id) ON DELETE CASCADE,
  FOREIGN KEY (id_estudiante) REFERENCES estudiante(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_estudiante_uuid ON estudiante(uuid);
CREATE INDEX IF NOT EXISTS idx_asistencia_sesion_estudiante ON asistencia(id_sesion, id_estudiante);
CREATE INDEX IF NOT EXISTS idx_sesion_grupo ON sesion(id_grupo);
`;

        // Abre la base de datos (una sola vez, al importar este archivo)
        this.baseDatos = open({ name: this.nombreBase });

        // Sin esto, los ON DELETE CASCADE del DDL no funcionan
        this.baseDatos.executeSync('PRAGMA foreign_keys = ON;');

        // Crea las tablas si es la primera vez que se usa la app (IF NOT EXISTS = seguro)
        this.baseDatos.executeSync(this.esquemaSql);
    }
}

// La conexión única que comparten todos los archivos D
export const baseDatos: DB = new DConexion().baseDatos;
