import { readFileSync } from 'node:fs';
import { config } from './config.js';

export type Row = Record<string, any>;
export type Query = (text: string, params?: unknown[]) => Promise<Row[]>;
export interface Db {
  query: Query;
  /** Ejecuta `fn` en una transacción; si lanza, se revierte todo. */
  tx<T>(fn: (q: Query) => Promise<T>): Promise<T>;
  exec(sql: string): Promise<void>;
  close(): Promise<void>;
}

// Mismos tipos que espera la API: fechas como 'YYYY-MM-DD', timestamps ISO y numeric como number.
const DATE = 1082;
const TIMESTAMPTZ = 1184;
const NUMERIC = 1700;
const INT8 = 20;
const parsers = {
  [DATE]: (v: string) => v,
  [TIMESTAMPTZ]: (v: string) => new Date(v).toISOString(),
  [NUMERIC]: Number,
  [INT8]: Number,
};

/** Postgres real (Railway) si hay DATABASE_URL; si no, PGlite embebido (desarrollo y pruebas). */
async function open(): Promise<Db> {
  if (config.database.url) {
    const { default: pg } = await import('pg');
    for (const [oid, parse] of Object.entries(parsers)) pg.types.setTypeParser(Number(oid), parse);
    const pool = new pg.Pool({ connectionString: config.database.url, max: 10 });
    pool.on('error', (error) => console.error('[db] Error en una conexión inactiva:', error.message));
    return {
      query: async (text, params) => (await pool.query(text, params)).rows,
      async tx(fn) {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          const result = await fn(async (text, params) => (await client.query(text, params)).rows);
          await client.query('COMMIT');
          return result;
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }
      },
      exec: async (sql) => void (await pool.query(sql)),
      close: () => pool.end(),
    };
  }

  const { PGlite } = await import('@electric-sql/pglite');
  const pglite = new PGlite(config.database.path, { parsers });
  return {
    query: async (text, params) => (await pglite.query<Row>(text, params)).rows,
    tx: (fn) => pglite.transaction((t) => fn(async (text, params) => (await t.query<Row>(text, params)).rows)),
    exec: async (sql) => void (await pglite.exec(sql)),
    close: () => pglite.close(),
  };
}

export const db = await open();
await db.exec(readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'));

/** Columnas por tabla (de information_schema): lista blanca para filtros, orden e inserciones. */
export const columns = new Map<string, Map<string, string>>();
for (const row of await db.query(
  "SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema = 'public'",
)) {
  if (!columns.has(row.table_name)) columns.set(row.table_name, new Map());
  columns.get(row.table_name)!.set(row.column_name, row.data_type);
}
