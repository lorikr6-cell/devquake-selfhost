import { randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { cnpChecksum, parseCnp } from './cnp';
import { canEncrypt, openBytes, openText, sealBytes, sealText } from './crypto';
import { ROLES, can } from './roles';
import { personInput } from './validate';
import { INVITE_CODE_PATTERN, newInviteCode } from './model';

const KEY = randomBytes(32).toString('base64');
const OTHER = randomBytes(32).toString('base64');

/** A valid CNP from its first 12 digits. */
const cnp = (first12: string) => first12 + cnpChecksum(first12);

describe('CNP', () => {
  it('reads the date of birth and sex', () => {
    expect(parseCnp(cnp('140030512345'))).toEqual({ birthDate: '1940-03-05', sex: 'm' });
    expect(parseCnp(cnp('245123140001'))).toEqual({ birthDate: '1945-12-31', sex: 'f' });
    expect(parseCnp(cnp('600022940001'))).toEqual({ birthDate: '2000-02-29', sex: 'f' });
    expect(parseCnp(cnp('601022940001'))).toBeNull(); // 2001 is no leap year
  });

  it('refuses a wrong checksum, length or date', () => {
    const good = cnp('140030512345');
    const wrong = good.slice(0, 12) + ((Number(good[12]) + 1) % 10);
    expect(parseCnp(wrong)).toBeNull();
    expect(parseCnp(good.slice(0, 12))).toBeNull();
    expect(parseCnp(cnp('140023012345'))).toBeNull(); // 30 February
    expect(parseCnp(cnp('140130512345'))).toBeNull(); // month 13
    expect(parseCnp(cnp('140030599345'))).toBeNull(); // county 99
  });

  it('accepts spaces and gives no date for foreign residents', () => {
    const c = cnp('750010112345');
    expect(parseCnp(`${c.slice(0, 7)} ${c.slice(7)}`)).toEqual({ birthDate: null, sex: 'm' });
  });
});

describe('encryption', () => {
  it('round-trips text and bytes with the key, and nothing with another', () => {
    const text = sealText('1400305123456', KEY);
    expect(text).not.toContain('1400305123456');
    expect(openText(text, KEY)).toBe('1400305123456');
    expect(openText(text, OTHER)).toBeNull();

    const bytes = sealBytes(new Uint8Array([1, 2, 3, 250]), KEY);
    expect([...openBytes(bytes, KEY)!]).toEqual([1, 2, 3, 250]);
    expect(openBytes(bytes, OTHER)).toBeNull();
  });

  it('notices tampering and a missing key', () => {
    const bytes = sealBytes(new Uint8Array([9, 9, 9]), KEY);
    bytes[bytes.length - 1]! ^= 1;
    expect(openBytes(bytes, KEY)).toBeNull();
    expect(canEncrypt(KEY)).toBe(true);
    expect(canEncrypt('')).toBe(false);
    expect(canEncrypt(randomBytes(16).toString('base64'))).toBe(false);
    expect(() => sealText('x', '')).toThrow();
  });
});

describe('roles', () => {
  it('lets only the organiser see personal numbers and documents', () => {
    expect(ROLES.filter((r) => can(r, 'identity.view'))).toEqual(['organiser']);
  });

  it('lets the kitchen see the kitchen sheet but not plan meals', () => {
    expect(can('kitchen', 'kitchen.view')).toBe(true);
    expect(can('kitchen', 'meals.edit')).toBe(false);
    expect(can('driver', 'kitchen.view')).toBe(false);
    for (const r of ROLES) expect(can(r, 'org.view')).toBe(true);
  });

  it('opens the medical file to medical staff only', () => {
    expect(ROLES.filter((r) => can(r, 'medical.view'))).toEqual(['medical']);
    expect(ROLES.filter((r) => can(r, 'medical.edit'))).toEqual(['medical']);
  });

  it('keeps the kitchen and drivers out of the profiles', () => {
    for (const r of ['kitchen', 'driver'] as const) {
      expect(can(r, 'people.view')).toBe(false);
      expect(can(r, 'incidents.view')).toBe(false);
    }
  });
});

describe('date of birth', () => {
  const person = (birthDate: string) =>
    personInput({ firstName: 'Ana', lastName: 'Pop', address: 'Str. 1', birthDate }, '2026-10-19');

  it('accepts people born long before 2000', () => {
    expect(person('1957-09-17').birthDate).toBe('1957-09-17');
    expect(person('1900-01-01').birthDate).toBe('1900-01-01');
  });

  it('refuses impossible, too early and future dates', () => {
    expect(() => person('1899-12-31')).toThrow();
    expect(() => person('1957-02-30')).toThrow();
    expect(() => person('2026-10-20')).toThrow();
  });
});

describe('invitation codes', () => {
  it('are 12 characters without look-alikes', () => {
    for (let i = 0; i < 200; i++) {
      const code = newInviteCode((max) => Math.floor(Math.random() * max));
      expect(code).toMatch(INVITE_CODE_PATTERN);
      expect(code).not.toMatch(/[01ILO]/);
    }
  });
});
