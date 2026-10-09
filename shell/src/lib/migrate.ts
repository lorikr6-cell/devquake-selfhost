import 'server-only';
import { APP, MIGRATIONS, PLUGIN_IDS } from '@/generated/app';
import { databaseNameOf, migrationConnection } from './db';

// Runs on every start (instrumentation.ts): the shell's own tables, then the plugin's SQL files
// in order. Both are safe to re-run (IF NOT EXISTS / INSERT IGNORE).

/** The shell's tables, prefixed dq_ so they never meet the plugin's. Append only. */
export const SHELL_MIGRATIONS: Array<{ version: string; sql: string }> = [
  {
    version: '0001_instance',
    sql: `
CREATE TABLE IF NOT EXISTS dq_users (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  email          VARCHAR(190) NOT NULL,
  display_name   VARCHAR(80)  NOT NULL,
  password_hash  VARCHAR(255) NOT NULL,
  role           ENUM('admin','member') NOT NULL DEFAULT 'member',
  active         TINYINT(1)   NOT NULL DEFAULT 1,
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at   DATETIME     NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_dq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS dq_sessions (
  token_hash  CHAR(64)     NOT NULL,
  user_id     INT UNSIGNED NOT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at  DATETIME     NOT NULL,
  PRIMARY KEY (token_hash),
  KEY idx_dq_sessions_user (user_id),
  CONSTRAINT fk_dq_sessions_user FOREIGN KEY (user_id) REFERENCES dq_users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS dq_invites (
  code_hash   CHAR(64)     NOT NULL,
  created_by  INT UNSIGNED NOT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at  DATETIME     NOT NULL,
  used_by     INT UNSIGNED NULL,
  used_at     DATETIME     NULL,
  PRIMARY KEY (code_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS dq_state (
  name   VARCHAR(80) NOT NULL,
  value  TEXT        NOT NULL,
  PRIMARY KEY (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`,
  },
];

async function apply(
  conn: Awaited<ReturnType<typeof migrationConnection>>,
  table: string,
  list: Array<{ version: string; sql: string }>,
  label: string,
) {
  await conn.query(`CREATE TABLE IF NOT EXISTS ${table} (
    version VARCHAR(100) NOT NULL PRIMARY KEY,
    applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  const [rows] = await conn.query(`SELECT version FROM ${table}`);
  const applied = new Set((rows as Array<{ version: string }>).map((r) => r.version));
  let count = 0;
  for (const m of list) {
    if (applied.has(m.version)) continue;
    console.log(`[instance] ${label}: applying ${m.version}`);
    await conn.query(m.sql);
    await conn.query(`INSERT IGNORE INTO ${table} (version) VALUES (?)`, [m.version]);
    count++;
  }
  return count;
}

export async function migrate(): Promise<void> {
  let applied = 0;
  const conn = await migrationConnection();
  try {
    await conn.query("SET time_zone = '+00:00'");
    applied += await apply(conn, 'dq_migrations', SHELL_MIGRATIONS, 'instance');
    if (!APP.multi) {
      // One app: its tables next to the shell's; its files record themselves in
      // schema_migrations, as on DevQuake (ADR 0007).
      applied += await apply(conn, 'schema_migrations', MIGRATIONS[PLUGIN_IDS[0]!] ?? [], 'app');
      console.log(`[instance] Database ready (${applied} migration(s) applied).`);
      return;
    }
    // Several apps (ADR 0056): each in its own database, created here.
    for (const id of PLUGIN_IDS) {
      const name = databaseNameOf(id);
      if (!/^[A-Za-z0-9_]{1,64}$/.test(name)) throw new Error(`Bad database name: ${name}`);
      await conn.query(
        `CREATE DATABASE IF NOT EXISTS \`${name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
      );
    }
  } finally {
    await conn.end();
  }
  for (const id of PLUGIN_IDS) {
    const own = await migrationConnection(databaseNameOf(id));
    try {
      await own.query("SET time_zone = '+00:00'");
      applied += await apply(own, 'schema_migrations', MIGRATIONS[id] ?? [], id);
    } finally {
      await own.end();
    }
  }
  console.log(`[instance] Databases ready (${applied} migration(s) applied).`);
}
