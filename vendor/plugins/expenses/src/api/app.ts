import { api } from '../lib/api';
import {
  activityOf,
  commentsOf,
  expenseById,
  expensesOf,
  groupById,
  groupsOf,
  inviteCode,
  ledgerOf,
  membersOf,
  paymentsOf,
  requireMember,
  statsOf,
} from '../lib/data';
import { HttpError } from '../lib/http';
import { fromCents } from '../lib/split';
import { id } from '../lib/validate';

/**
 * What the native apps read (ADR 0062, signed in with the app's device session), versioned like
 * the other apps' state: a breaking change gets a new format. Writes use the same API as the
 * website (POST /api/groups, /api/groups/:id/expenses, …).
 */
export const APP_FORMAT = 1;

// GET /api/app/groups: the member's groups with their balance in each, newest activity first.
export const groups = api(async ({ db, user }) => ({
  format: APP_FORMAT,
  groups: await groupsOf(db, user.id),
}));

// GET /api/app/groups/:id: one group with everything its tabs show: members, expenses (with
// their split), payments, balances, the transfers to settle up, and the invite code; for the
// owner also their DevQuake referrals who are not in the group yet.
export const group = api(async ({ params, db, user, people, baseUrl }) => {
  const groupId = id(params.id);
  const me = await requireMember(db, groupId, user.id);
  const [info, members, expenses, payments, ledger, code] = await Promise.all([
    groupById(db, groupId),
    membersOf(db, groupId),
    expensesOf(db, groupId),
    paymentsOf(db, groupId),
    ledgerOf(db, groupId),
    inviteCode(db, groupId, user.id),
  ]);
  if (!info) throw new HttpError(404, 'groupNotFound');
  const inGroup = new Set(
    members.filter((m) => m.active && m.userId !== null).map((m) => m.userId as number),
  );
  const friends = me.isOwner
    ? ((await people?.referrals().catch(() => [])) ?? [])
        .filter((p) => !inGroup.has(p.id))
        .map((p) => ({ userId: p.id, name: p.displayName }))
    : [];
  return {
    format: APP_FORMAT,
    group: info,
    me: { memberId: me.memberId, isOwner: me.isOwner },
    members: members.map(({ userId, ...m }) => ({ ...m, isMe: userId === user.id })),
    expenses,
    payments,
    balances: members.map((m) => ({
      memberId: m.id,
      amount: fromCents(ledger.balance.get(m.id) ?? 0),
    })),
    transfers: ledger.transfers.map((t) => ({
      from: t.from,
      to: t.to,
      amount: fromCents(t.cents),
    })),
    invite: { code, url: `${baseUrl}/join/${code}` },
    friends,
  };
});

// GET /api/app/groups/:id/expenses/:expenseId: one expense with its comments.
export const expense = api(async ({ params, db, user }) => {
  const groupId = id(params.id);
  await requireMember(db, groupId, user.id);
  const found = await expenseById(db, groupId, id(params.expenseId));
  if (!found) throw new HttpError(404, 'expenseNotFound');
  return { format: APP_FORMAT, expense: found, comments: await commentsOf(db, found.id) };
});

// GET /api/app/groups/:id/activity: the group's latest changes.
export const activity = api(async ({ params, db, user }) => {
  const groupId = id(params.id);
  await requireMember(db, groupId, user.id);
  return { format: APP_FORMAT, activity: await activityOf(db, groupId) };
});

// GET /api/app/groups/:id/stats: spending by category, month and person.
export const stats = api(async ({ params, db, user }) => {
  const groupId = id(params.id);
  await requireMember(db, groupId, user.id);
  return { format: APP_FORMAT, ...(await statsOf(db, groupId)) };
});
