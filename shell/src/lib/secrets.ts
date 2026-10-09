import 'server-only';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { DEFAULT_ENV, SECRETS } from '@/generated/app';
import { dataDir, env } from './env';

// Secrets an instance needs but Hostinger's flow cannot ask for: made once on first start and
// kept in the data volume, so they survive updates. A value set in the environment always wins.

const make = (kind: 'base64-32' | 'hex-32') =>
  crypto.randomBytes(32).toString(kind === 'hex-32' ? 'hex' : 'base64');

/** Fills process.env with the generated secrets and the app's defaults. Runs before any request. */
export function loadSecrets(): void {
  const wanted: Record<string, 'base64-32' | 'hex-32'> = { APP_SECRET: 'hex-32', ...SECRETS };
  const file = path.join(dataDir(), 'secrets.json');
  let saved: Record<string, string> = {};
  try {
    saved = JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, string>;
  } catch {
    // First start, or no volume yet.
  }
  let changed = false;
  for (const [name, kind] of Object.entries(wanted)) {
    if (env(name)) continue;
    if (!saved[name]) {
      saved[name] = make(kind);
      changed = true;
    }
    process.env[name] = saved[name];
  }
  if (changed) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(saved, null, 2), { mode: 0o600 });
    console.log(`[instance] Created secrets in ${file}. Back up this volume.`);
  }
  for (const [name, value] of Object.entries(DEFAULT_ENV)) {
    if (!env(name)) process.env[name] = value;
  }
}
