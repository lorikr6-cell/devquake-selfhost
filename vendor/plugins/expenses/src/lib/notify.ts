// Phone notifications (ADR 0084), only to the people concerned (owner's rule), never to the
// person who made the change and never outside the group:
// - an expense added, changed or deleted: whoever paid it and everyone in its split (for a
//   change, before and after);
// - a payment: the two people it is between;
// - a comment: the expense's payer, the people in its split and whoever commented before;
// - someone joined by invite: the group's owner.
// Only members with an account who are still in the group are told.

import type { PluginDatabase as Db, PluginPush } from '@devquake/plugin-sdk';

export interface Notice {
  db: Db;
  push: PluginPush | undefined;
  groupId: number;
  /** The member (group record) who made the change. */
  actorMemberId: number;
}

/** "45.00 EUR": the same in every language (the app writes the words around it). */
export const amountText = (amount: number, currency: string) => `${amount.toFixed(2)} ${currency}`;

/** The people involved in an expense: its payer and its split (member ids). */
export async function expenseMembers(db: Db, expenseId: number): Promise<number[]> {
  const rows = await db.query<{ member_id: number }>(
    `SELECT paid_by AS member_id FROM expenses WHERE id = ?
     UNION SELECT member_id FROM expense_shares WHERE expense_id = ?`,
    [expenseId, expenseId],
  );
  return rows.map((r) => Number(r.member_id));
}

/** Who commented on an expense so far (member ids). */
export async function commenters(db: Db, expenseId: number): Promise<number[]> {
  const rows = await db.query<{ member_id: number }>(
    'SELECT DISTINCT member_id FROM expense_comments WHERE expense_id = ?',
    [expenseId],
  );
  return rows.map((r) => Number(r.member_id));
}

/**
 * Sends `kind` to the given members of the group: only active members with an account, never
 * the actor. args[0] is always the group's name. Never throws.
 */
export async function notifyMembers(
  notice: Notice,
  memberIds: number[],
  kind: string,
  args: string[],
  ref: string,
): Promise<number> {
  const { db, push, groupId, actorMemberId } = notice;
  const ids = [...new Set(memberIds)].filter((m) => m !== actorMemberId);
  if (!push || ids.length === 0) return 0;
  try {
    const rows = await db.query<{ user_id: number; group_name: string }>(
      `SELECT m.user_id, g.name AS group_name FROM group_members m
         JOIN expense_groups g ON g.id = m.group_id
        WHERE m.group_id = ? AND m.user_id IS NOT NULL AND m.left_at IS NULL
          AND m.id IN (${ids.map(() => '?').join(', ')})`,
      [groupId, ...ids],
    );
    let sent = 0;
    for (const r of rows) {
      sent += await push.send(Number(r.user_id), { kind, args: [r.group_name, ...args], ref });
    }
    return sent;
  } catch {
    return 0;
  }
}

/** The actor's name in the group (their group record), for the notification's text. */
export async function memberName(db: Db, memberId: number): Promise<string> {
  const [row] = await db.query<{ display_name: string }>(
    'SELECT display_name FROM group_members WHERE id = ?',
    [memberId],
  );
  return row?.display_name || '?';
}
