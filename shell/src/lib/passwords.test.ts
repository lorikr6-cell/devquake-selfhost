import { describe, expect, it } from 'vitest';
import { hashPassword, randomToken, sha256, verifyPassword } from './passwords';

describe('passwords', () => {
  it('verifies the right password only', async () => {
    const stored = await hashPassword('correct horse battery');
    expect(stored).toMatch(/^scrypt\$16384\$/);
    expect(await verifyPassword('correct horse battery', stored)).toBe(true);
    expect(await verifyPassword('correct horse batterY', stored)).toBe(false);
  });

  it('salts every hash and refuses unknown formats', async () => {
    expect(await hashPassword('same')).not.toBe(await hashPassword('same'));
    expect(await verifyPassword('x', 'md5$abc')).toBe(false);
    expect(await verifyPassword('x', '')).toBe(false);
  });

  it('makes random tokens and stable hashes', () => {
    expect(randomToken()).not.toBe(randomToken());
    expect(randomToken(24)).toMatch(/^[A-Za-z0-9_-]{32}$/);
    expect(sha256('a')).toHaveLength(64);
  });
});
