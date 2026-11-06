import type { PluginDatabase, PluginPushMessage } from '@devquake/plugin-sdk';
import { describe, expect, it } from 'vitest';
import { amountText, notifyMembers } from './notify';

/**
 * group_members of group 7: 1 = owner (user 10), 2 = Ana (user 20), 3 = Mihai (by name, no
 * account), 4 = Lena (user 40, left the group). Group 8 has member 5 (user 50).
 */
const MEMBERS = [
  { id: 1, group_id: 7, user_id: 10, left: false },
  { id: 2, group_id: 7, user_id: 20, left: false },
  { id: 3, group_id: 7, user_id: null, left: false },
  { id: 4, group_id: 7, user_id: 40, left: true },
  { id: 5, group_id: 8, user_id: 50, left: false },
];

const db = {
  async query(_sql: string, params: unknown[] = []) {
    const [groupId, ...ids] = params.map(Number);
    return MEMBERS.filter(
      (m) => m.group_id === groupId && m.user_id !== null && !m.left && ids.includes(m.id),
    ).map((m) => ({ user_id: m.user_id, group_name: 'Lisbon' }));
  },
  async execute() {
    return { affectedRows: 0, insertId: 0 };
  },
} as unknown as PluginDatabase;

function recorder() {
  const sent: { userId: number; message: PluginPushMessage }[] = [];
  return {
    sent,
    push: {
      async send(userId: number, message: PluginPushMessage) {
        sent.push({ userId, message });
        return 1;
      },
    },
  };
}

describe('notifyMembers', () => {
  it('tells only active members with an account, never the actor', async () => {
    const { push, sent } = recorder();
    const n = await notifyMembers(
      { db, push, groupId: 7, actorMemberId: 1 },
      [1, 2, 3, 4, 2],
      'expense_added',
      ['Owner', 'Dinner · 45.00 EUR'],
      'expense:7:3',
    );
    expect(n).toBe(1);
    expect(sent).toEqual([
      {
        userId: 20,
        message: {
          kind: 'expense_added',
          args: ['Lisbon', 'Owner', 'Dinner · 45.00 EUR'],
          ref: 'expense:7:3',
        },
      },
    ]);
  });

  it('never reaches members of another group', async () => {
    const { push, sent } = recorder();
    await notifyMembers(
      { db, push, groupId: 7, actorMemberId: 1 },
      [5],
      'payment_added',
      ['A → B', '1.00 EUR'],
      'group:7',
    );
    expect(sent).toEqual([]);
  });

  it('does nothing without the push service or anyone to tell', async () => {
    expect(
      await notifyMembers({ db, push: undefined, groupId: 7, actorMemberId: 1 }, [2], 'x', [], ''),
    ).toBe(0);
    const { push, sent } = recorder();
    await notifyMembers({ db, push, groupId: 7, actorMemberId: 2 }, [2], 'x', [], '');
    expect(sent).toEqual([]);
  });
});

describe('amountText', () => {
  it('writes two decimals and the currency', () => {
    expect(amountText(45, 'EUR')).toBe('45.00 EUR');
    expect(amountText(126.4, 'RON')).toBe('126.40 RON');
  });
});
