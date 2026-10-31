import { describe, expect, it, vi } from 'vitest';
import type { PluginDatabase } from '@devquake/plugin-sdk';
import { pushCall } from './calls';
import { pushPhones } from './phones';

/** A database that records the recipient queries and finds nobody (so nothing is sent). */
function fakeDb() {
  const seen: { sql: string; params: unknown[] }[] = [];
  const db = {
    query: vi.fn(async (sql: string, params: unknown[] = []) => {
      seen.push({ sql, params });
      return [];
    }),
    execute: vi.fn(),
  } as unknown as PluginDatabase;
  return { db, seen };
}

const call = { id: 1, tableId: 3, tableName: 'T5' };

describe('who gets a guest’s call or order (owner’s rule)', () => {
  it('a table with a waiter: only that waiter, in this venue', async () => {
    const { db, seen } = fakeDb();
    await pushCall(db, 7, { ...call, waiterStaffId: 42 }, { title: '', body: '', url: '' });
    await pushPhones(db, 7, { ...call, waiterStaffId: 42 });
    for (const q of seen) {
      expect(q.params).toEqual([7, 42]);
      expect(q.sql).toMatch(/venue_id = \?/);
      expect(q.sql).not.toMatch(/is_owner = 1/);
    }
  });

  it('a table without a waiter: the venue’s waiters and managers (and the owner’s browser)', async () => {
    const { db, seen } = fakeDb();
    await pushCall(db, 7, { ...call, waiterStaffId: null }, { title: '', body: '', url: '' });
    await pushPhones(db, 7, { ...call, waiterStaffId: null }, 'order');
    for (const q of seen) {
      expect(q.params).toEqual([7]);
      expect(q.sql).toMatch(/role IN \('waiter', 'manager'\)/);
    }
    expect(seen[0]!.sql).toMatch(/is_owner = 1/);
    expect(seen[1]!.sql).not.toMatch(/is_owner/);
  });
});
