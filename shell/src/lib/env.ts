import path from 'node:path';
import { instanceDomain } from './hosts';

// Every setting of an instance comes from the environment (Hostinger's single-tenant rule;
// .env.example lists them). Defaults keep a bare `docker compose up` working.

export function env(name: string): string | undefined {
  return process.env[name]?.trim() || undefined;
}

export function flag(name: string, fallback: boolean): boolean {
  const v = env(name)?.toLowerCase();
  if (v === undefined) return fallback;
  return !['0', 'false', 'no', 'off'].includes(v);
}

/** Where the instance keeps what it creates itself (generated secrets). A Docker volume. */
export function dataDir(): string {
  return env('DATA_DIR') ?? path.join(process.cwd(), 'data');
}

export interface DbConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

/** DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD, or one DATABASE_URL (mysql://…). */
export function dbConfig(): DbConfig | null {
  const url = env('DATABASE_URL');
  if (url) {
    const u = new URL(url);
    if (u.protocol !== 'mysql:') throw new Error('DATABASE_URL must start with mysql://');
    return {
      host: u.hostname,
      port: Number(u.port || 3306),
      database: decodeURIComponent(u.pathname.replace(/^\//, '')),
      user: decodeURIComponent(u.username),
      password: decodeURIComponent(u.password),
    };
  }
  const database = env('DB_NAME');
  const user = env('DB_USER');
  const password = env('DB_PASSWORD');
  if (!database || !user || !password) return null;
  return {
    host: env('DB_HOST') ?? 'localhost',
    port: Number(env('DB_PORT') ?? 3306),
    database,
    user,
    password,
  };
}

/**
 * PUBLIC_URL without a trailing slash (the home, with several apps); else https://DOMAIN or the
 * sslip.io name from PUBLIC_IP (Caddy's automatic HTTPS); else null, to take it from each request.
 */
export function configuredPublicUrl(): string | null {
  const domain = instanceDomain({ DOMAIN: env('DOMAIN'), PUBLIC_IP: env('PUBLIC_IP') });
  const v =
    env('PUBLIC_URL') ??
    (domain && /^[a-z0-9.-]+$/i.test(domain) ? `https://${domain}` : undefined);
  if (!v) return null;
  try {
    const u = new URL(v);
    return `${u.protocol}//${u.host}${u.pathname.replace(/\/+$/, '')}`;
  } catch {
    return null;
  }
}

/** The instance's domain for several apps on their own hostnames (ADR 0056), or null. */
export function domainSetting(): string | null {
  return instanceDomain({ DOMAIN: env('DOMAIN'), PUBLIC_IP: env('PUBLIC_IP') });
}
