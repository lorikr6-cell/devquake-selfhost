import { afterEach, describe, expect, it } from 'vitest';
import { configuredPublicUrl, dbConfig, flag } from './env';
import { isHttps, publicUrl, sameOrigin } from './url';

const saved = { ...process.env };
afterEach(() => {
  process.env = { ...saved };
});

const bag = (h: Record<string, string>) => ({ get: (k: string) => h[k.toLowerCase()] ?? null });

describe('environment', () => {
  it('reads the database from DB_* or DATABASE_URL', () => {
    delete process.env.DATABASE_URL;
    process.env.DB_NAME = 'pulse';
    process.env.DB_USER = 'pulse';
    process.env.DB_PASSWORD = 'secret';
    expect(dbConfig()).toEqual({
      host: 'localhost',
      port: 3306,
      database: 'pulse',
      user: 'pulse',
      password: 'secret',
    });
    process.env.DATABASE_URL = 'mysql://u%40x:p%23w@db:3307/name';
    expect(dbConfig()).toMatchObject({ host: 'db', port: 3307, user: 'u@x', password: 'p#w' });
  });

  it('has no database without its three values (empty counts as unset)', () => {
    delete process.env.DATABASE_URL;
    process.env.DB_NAME = 'pulse';
    process.env.DB_USER = 'pulse';
    process.env.DB_PASSWORD = '';
    expect(dbConfig()).toBeNull();
  });

  it('takes the address from PUBLIC_URL, else DOMAIN', () => {
    delete process.env.PUBLIC_URL;
    process.env.DOMAIN = 'pulse.example.com';
    expect(configuredPublicUrl()).toBe('https://pulse.example.com');
    process.env.PUBLIC_URL = 'http://10.0.0.5:8080/';
    expect(configuredPublicUrl()).toBe('http://10.0.0.5:8080');
    process.env.PUBLIC_URL = '';
    process.env.DOMAIN = 'bad domain/x';
    expect(configuredPublicUrl()).toBeNull();
  });

  it('reads switches', () => {
    process.env.SHOW_POWERED_BY = 'false';
    expect(flag('SHOW_POWERED_BY', true)).toBe(false);
    process.env.SHOW_POWERED_BY = '';
    expect(flag('SHOW_POWERED_BY', true)).toBe(true);
  });
});

describe('requests', () => {
  it('follows the forwarded scheme and host without PUBLIC_URL', () => {
    delete process.env.PUBLIC_URL;
    delete process.env.DOMAIN;
    const h = bag({ 'x-forwarded-proto': 'https', 'x-forwarded-host': 'darts.example.com' });
    expect(isHttps(h)).toBe(true);
    expect(publicUrl(h)).toBe('https://darts.example.com');
  });

  it('accepts same-origin changes only', () => {
    const h = bag({ host: 'pulse.example.com' });
    const req = (origin?: string) =>
      new Request('http://pulse.example.com/api/apps', {
        method: 'POST',
        headers: origin ? { origin } : {},
      });
    expect(sameOrigin(req('https://pulse.example.com'), h)).toBe(true);
    expect(sameOrigin(req(), h)).toBe(true);
    expect(sameOrigin(req('https://evil.example'), h)).toBe(false);
    expect(sameOrigin(req('null'), h)).toBe(false);
  });
});
