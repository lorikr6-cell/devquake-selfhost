import 'server-only';
import mysql, { type Pool, type PoolConnection, type ResultSetHeader } from 'mysql2/promise';
import type { PluginDatabase, PluginExecuteResult } from '@devquake/plugin-sdk';
import { dbConfig } from './env';

// The instance's one MySQL database: the plugin's tables and the shell's own (dq_*). SQL with
// `?` placeholders only, never values pasted into the text.

const g = globalThis as unknown as { dqPool?: Pool };

function pool(): Pool {
  if (g.dqPool) return g.dqPool;
  const config = dbConfig();
  if (!config) {
    throw new Error('No database configured: set DB_NAME, DB_USER and DB_PASSWORD.');
  }
  const created = mysql.createPool({
    ...config,
    connectionLimit: 8,
    waitForConnections: true,
    timezone: 'Z',
    charset: 'utf8mb4_unicode_ci',
    enableKeepAlive: true,
  });
  created.pool.on('connection', (conn) => {
    conn.query("SET time_zone = '+00:00'");
  });
  g.dqPool = created;
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

/** The database as the plugin sees it (`ctx.db`), also used by the shell. */
export function database(): PluginDatabase {
  return {
    query: (sql, params) => bind(pool()).query(sql, params),
    execute: (sql, params) => bind(pool()).execute(sql, params),
    async transaction(fn) {
      const conn = await pool().getConnection();
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

/** A single connection that may run several statements (migrations only). */
export async function migrationConnection() {
  const config = dbConfig();
  if (!config) throw new Error('No database configured.');
  return mysql.createConnection({ ...config, multipleStatements: true, timezone: 'Z' });
}

export async function queryOne<T>(sql: string, params: unknown[] = []): Promise<T | null> {
  const rows = await database().query<T>(sql, params);
  return rows[0] ?? null;
}
