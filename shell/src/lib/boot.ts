import 'server-only';
import { APP } from '@/generated/app';
import { dbConfig } from './env';
import { migrate } from './migrate';
import { startScheduler } from './scheduler';
import { loadSecrets } from './secrets';

// The first thing a server process does (instrumentation.ts): secrets, the plugin's view of the
// environment, the database (waiting for its container), then the hourly background work.

const g = globalThis as unknown as { dqBoot?: Promise<BootState> };

export type BootState = { ok: true } | { ok: false; reason: 'no-database' | 'database-error' };

/** The plugin reads its database settings as <ID>_DB_* on DevQuake (ADR 0007): same here. */
function aliasDatabaseEnv() {
  const config = dbConfig();
  if (!config) return;
  const prefix = `${APP.plugin.toUpperCase().replace(/-/g, '_')}_DB`;
  process.env[`${prefix}_NAME`] = config.database;
  process.env[`${prefix}_USER`] = config.user;
  process.env[`${prefix}_PWD`] = config.password;
  process.env[`${prefix}_HOST`] = config.host;
  process.env[`${prefix}_PORT`] = String(config.port);
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function boot(): Promise<BootState> {
  loadSecrets();
  if (!dbConfig()) {
    console.error('[instance] No database: set DB_NAME, DB_USER and DB_PASSWORD (.env.example).');
    return { ok: false, reason: 'no-database' };
  }
  aliasDatabaseEnv();
  // The database container may still be starting: try for about two minutes.
  for (let attempt = 1; ; attempt++) {
    try {
      await migrate();
      break;
    } catch (err) {
      if (attempt >= 40) {
        console.error('[instance] The database could not be prepared:', err);
        return { ok: false, reason: 'database-error' };
      }
      if (attempt === 1) console.log('[instance] Waiting for the database…');
      await wait(3000);
    }
  }
  startScheduler();
  console.log(`[instance] ${APP.name} ${APP.version} is ready.`);
  return { ok: true };
}

/** Resolves once the instance can serve requests (started once per process). */
export function ready(): Promise<BootState> {
  // `next build` renders pages too: no secrets, migrations or timers there.
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return Promise.resolve({ ok: false, reason: 'no-database' });
  }
  g.dqBoot ??= boot();
  return g.dqBoot;
}
