import 'server-only';
import mysql, { type Pool, type PoolConnection, type ResultSetHeader } from 'mysql2/promise';
import type { PluginDatabase, PluginExecuteResult } from '@devquake/plugin-sdk';
import { APP } from '@/generated/app';
import { dbConfig } from './env';

// The instance's MySQL. One app: its tables and the shell's own (dq_*) in DB_NAME. Several apps
// (Household, ADR 0056): the shell's tables in DB_NAME and each app in its own database,
// `<DB_NAME>_<app>`, as on DevQuake (ADR 0007). SQL with `?` placeholders only.

const g = globalThis as unknown as { dqPools?: Map<string, Pool> };
const pools = (g.dqPools ??= new Map());

/** The database an app's tables live in. */
export function databaseNameOf(app: string | null): string {
  const config = dbConfig();
  if (!config) throw new Error('No database configured: set DB_NAME, DB_USER and DB_PASSWORD.');
  if (!app || !APP.multi) return config.database;
  return `${config.database}_${app.replace(/-/g, '_')}`;
}

function pool(name: string): Pool {
  const existing = pools.get(name);
  if (existing) return existing;
  const config = dbConfig();
  if (!config) throw new Error('No database configured: set DB_NAME, DB_USER and DB_PASSWORD.');
  const created = mysql.createPool({
    ...config,
    database: name,
    connectionLimit: APP.multi ? 4 : 8,
    waitForConnections: true,
    timezone: 'Z',
    charset: 'utf8mb4_unicode_ci',
    enableKeepAlive: true,
  });
  created.pool.on('connection', (conn) => {
    conn.query("SET time_zone = '+00:00'");
  });
  pools.set(name, created);
  return created;
}

type Runner = Pick<Pool, 'query'> | Pick<PoolConnection, 'query'>;

function bind(runner: Runner): Omit<PluginDatabase, 'transaction'> {
  return {
    async query<T>(sql: string, params: unknown[] = []) {
      const [rows] = await runner.query(sql, params);
      return rows as T[];
    },
    async execute(sql: string, params: unknown[] = []): Promise<PluginExecuteResult> {
      const [result] = await runner.query<ResultSetHeader>(sql, params);
      return { affectedRows: result.affectedRows, insertId: result.insertId };
    },
  };
}

/** A database as the apps see it (`ctx.db`): the shell's own without `app`, else that app's. */
export function database(app: string | null = null): PluginDatabase {
  const name = databaseNameOf(app);
  return {
    query: (sql, params) => bind(pool(name)).query(sql, params),
    execute: (sql, params) => bind(pool(name)).execute(sql, params),
    async transaction(fn) {
      const conn = await pool(name).getConnection();
      try {
        await conn.beginTransaction();
        const result = await fn(bind(conn));
        await conn.commit();
        return result;
      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }
    },
  };
}

/** A single connection that may run several statements (migrations only), on `name`. */
export async function migrationConnection(name?: string) {
  const config = dbConfig();
  if (!config) throw new Error('No database configured.');
  return mysql.createConnection({
    ...config,
    database: name ?? config.database,
    multipleStatements: true,
    timezone: 'Z',
  });
}

export async function queryOne<T>(sql: string, params: unknown[] = []): Promise<T | null> {
  const rows = await database().query<T>(sql, params);
  return rows[0] ?? null;
}
