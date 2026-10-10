import { describe, expect, it } from 'vitest';
import { resolveBuyer, signedOutCookie } from './buyer-session';
import { SIGNED_OUT } from './buyers-data';
import { buyerDetailsInput } from './validate';

// The shop on DevQuake (ADR 0059): recognising a connected member, signing out, saved details.

const row = { id: 7, store_id: 1, email: 'ana@example.com', platform_user_id: 42, locale: 'en' };

/** A database that answers the member lookup only (sessions are never valid here). */
function fakeDb() {
  const calls: string[] = [];
  return {
    calls,
    db: {
      async query<T>(sql: string, params?: unknown[]): Promise<T[]> {
        calls.push(sql);
        if (sql.includes('platform_user_id = ?') && params?.[1] === 42) return [row as T];
        return [];
      },
      async execute() {
        return { affectedRows: 0, insertId: 0 };
      },
    },
  };
}

const member = { id: 42, displayName: 'Ana', isAdmin: false };

describe('resolveBuyer', () => {
  it('recognises the account a signed-in member connected', async () => {
    const { db } = fakeDb();
    const buyer = await resolveBuyer(db, 1, undefined, member);
    expect(buyer?.id).toBe(7);
    expect(buyer?.platformUserId).toBe(42);
  });

  it('does not after the member signed out on this browser', async () => {
    const { db, calls } = fakeDb();
    expect(await resolveBuyer(db, 1, SIGNED_OUT, member)).toBeNull();
    expect(calls).toHaveLength(0);
  });

  it('finds nobody for visitors or members who never connected', async () => {
    const { db } = fakeDb();
    expect(await resolveBuyer(db, 1, undefined, null)).toBeNull();
    expect(await resolveBuyer(db, 1, undefined, { ...member, id: 5 })).toBeNull();
  });

  it('remembers signing out in the shop cookie', () => {
    expect(signedOutCookie(3, 'https://store.devquake.com')).toMatch(
      /^dq_store_buyer_3=out; .*HttpOnly; SameSite=Lax; Max-Age=\d+; Secure$/,
    );
  });
});

describe('buyerDetailsInput', () => {
  it('keeps the filled fields and checks the country', () => {
    expect(
      buyerDetailsInput({ phone: ' 0712 ', addressLine: '', city: 'Cluj', country: 'ro' }),
    ).toEqual({ phone: '0712', addressLine: null, city: 'Cluj', postalCode: null, country: 'RO' });
    expect(() => buyerDetailsInput({ country: 'ROU' })).toThrow();
  });
});
