import { randomInt } from 'node:crypto';
import type { PluginDatabase, PluginUser } from '@devquake/plugin-sdk';
import type { IsoDate } from './dates';
import { HttpError } from './http';
import { LIMITS, newInviteCode, type Category, type GroupKind, type Role } from './model';
import {
  balances,
  fromCents,
  settleUp,
  splitExpense,
  toCents,
  type SplitMode,
  type Transfer,
} from './split';
import type { ExpenseInput, GroupInput, PaymentInput } from './validate';

/**
 * Data access for Shared expenses, on its OWN database (ctx.db, ADR 0007). Visibility rule: a
 * person sees only groups they are an active member of (group_members with their user id and no
 * left_at). Members are group records: expenses, shares, payments and comments point at
 * group_members.id (ADR 0055). Every function checks access first.
 */

export { HttpError };

type Db = Omit<PluginDatabase, 'transaction'>;

const DAY = (col: string, as: string) => `DATE_FORMAT(${col}, '%Y-%m-%d') AS ${as}`;
const num = (v: unknown) => Number(v);
const money = (v: unknown) => Number(v);
const iso = (v: Date | string) => new Date(v).toISOString();

// ---------------------------------------------------------------------------------------------
// Access

export interface Me {
  groupId: number;
  memberId: number;
  role: Role;
  isOwner: boolean;
}

/** The visitor's place in a group, or null when they are not (or no longer) a member. */
export async function membership(db: Db, groupId: number, userId: number): Promise<Me | null> {
  const [row] = await db.query<{ id: number; role: Role }>(
    'SELECT id, role FROM group_members WHERE group_id = ? AND user_id = ? AND left_at IS NULL',
    [groupId, userId],
  );
  if (!row) return null;
  return { groupId, memberId: num(row.id), role: row.role, isOwner: row.role === 'owner' };
}

export async function requireMember(db: Db, groupId: number, userId: number): Promise<Me> {
  const me = await membership(db, groupId, userId);
  if (!me) throw new HttpError(404, 'groupNotFound');
  return me;
}

export async function requireOwner(db: Db, groupId: number, userId: number): Promise<Me> {
  const me = await requireMember(db, groupId, userId);
  if (!me.isOwner) throw new HttpError(403, 'ownerOnly');
  return me;
}

// ---------------------------------------------------------------------------------------------
// Groups

export interface Group {
  id: number;
  ownerUserId: number;
  name: string;
  kind: GroupKind;
  currency: string;
  createdAt: string;
}

interface GroupRow {
  id: number;
  owner_user_id: number;
  name: string;
  kind: GroupKind;
  currency: string;
  created_at: Date | string;
}

const toGroup = (r: GroupRow): Group => ({
  id: num(r.id),
  ownerUserId: num(r.owner_user_id),
  name: r.name,
  kind: r.kind,
  currency: r.currency,
  createdAt: iso(r.created_at),
});

export async function groupById(db: Db, groupId: number): Promise<Group | null> {
  const [row] = await db.query<GroupRow>(
    'SELECT id, owner_user_id, name, kind, currency, created_at FROM expense_groups WHERE id = ?',
    [groupId],
  );
  return row ? toGroup(row) : null;
}

export interface GroupSummary extends Group {
  members: number;
  expenses: number;
  total: number;
  /** The visitor's balance in this group (positive = they are owed). */
  myBalance: number;
}

/** The visitor's groups, newest activity first, with their balance in each. */
export async function groupsOf(db: Db, userId: number): Promise<GroupSummary[]> {
  const rows = await db.query<
    GroupRow & {
      member_id: number;
      members: number | string;
      expenses: number | string;
      total: string | null;
      paid: string | null;
      owed: string | null;
      sent: string | null;
      received: string | null;
    }
  >(
    `SELECT g.id, g.owner_user_id, g.name, g.kind, g.currency, g.created_at, m.id AS member_id,
            (SELECT COUNT(*) FROM group_members x WHERE x.group_id = g.id AND x.left_at IS NULL) AS members,
            (SELECT COUNT(*) FROM expenses e WHERE e.group_id = g.id) AS expenses,
            (SELECT SUM(e.amount) FROM expenses e WHERE e.group_id = g.id) AS total,
            (SELECT SUM(e.amount) FROM expenses e WHERE e.paid_by = m.id) AS paid,
            (SELECT SUM(s.amount) FROM expense_shares s WHERE s.member_id = m.id) AS owed,
            (SELECT SUM(p.amount) FROM payments p WHERE p.from_member = m.id) AS sent,
            (SELECT SUM(p.amount) FROM payments p WHERE p.to_member = m.id) AS received,
            GREATEST(g.updated_at,
                     COALESCE((SELECT MAX(a.created_at) FROM group_activity a WHERE a.group_id = g.id), g.updated_at)) AS last_change
       FROM group_members m JOIN expense_groups g ON g.id = m.group_id
      WHERE m.user_id = ? AND m.left_at IS NULL
      ORDER BY last_change DESC, g.id DESC`,
    [userId],
  );
  return rows.map((r) => ({
    ...toGroup(r),
    members: num(r.members),
    expenses: num(r.expenses),
    total: money(r.total ?? 0),
    myBalance: fromCents(
      toCents(money(r.paid ?? 0)) +
        toCents(money(r.sent ?? 0)) -
        toCents(money(r.owed ?? 0)) -
        toCents(money(r.received ?? 0)),
    ),
  }));
}

export async function createGroup(
  db: PluginDatabase,
  user: PluginUser,
  input: GroupInput,
): Promise<number> {
  const [count] = await db.query<{ n: number }>(
    'SELECT COUNT(*) AS n FROM group_members WHERE user_id = ? AND left_at IS NULL',
    [user.id],
  );
  if (num(count?.n ?? 0) >= LIMITS.groupsPerUser) {
    throw new HttpError(400, 'tooManyGroups', { max: LIMITS.groupsPerUser });
  }
  return db.transaction(async (tx) => {
    const res = await tx.execute(
      'INSERT INTO expense_groups (owner_user_id, name, kind, currency) VALUES (?, ?, ?, ?)',
      [user.id, input.name, input.kind, input.currency],
    );
    await tx.execute(
      `INSERT INTO group_members (group_id, user_id, display_name, role) VALUES (?, ?, ?, 'owner')`,
      [res.insertId, user.id, user.displayName.slice(0, LIMITS.memberName)],
    );
    return res.insertId;
  });
}

/** Whether the group has any expense or payment (then its currency can no longer change). */
export async function hasMoney(db: Db, groupId: number): Promise<boolean> {
  const [row] = await db.query<{ n: number | string }>(
    `SELECT (EXISTS (SELECT 1 FROM expenses WHERE group_id = ?)
          OR EXISTS (SELECT 1 FROM payments WHERE group_id = ?)) AS n`,
    [groupId, groupId],
  );
  return num(row?.n ?? 0) === 1;
}

/** The owner renames the group or changes its kind; the currency only while it has no expenses. */
export async function updateGroup(db: Db, groupId: number, userId: number, input: GroupInput) {
  await requireOwner(db, groupId, userId);
  const group = await groupById(db, groupId);
  if (!group) throw new HttpError(404, 'groupNotFound');
  if (group.currency !== input.currency && (await hasMoney(db, groupId))) {
    throw new HttpError(400, 'currencyLocked');
  }
  await db.execute('UPDATE expense_groups SET name = ?, kind = ?, currency = ? WHERE id = ?', [
    input.name,
    input.kind,
    input.currency,
    groupId,
  ]);
}

/** The owner deletes the group with everything in it (the database cascades). */
export async function deleteGroup(db: PluginDatabase, groupId: number, userId: number) {
  await requireOwner(db, groupId, userId);
  await db.transaction(async (tx) => {
    // Shares, comments and payments point at members: remove them before the group cascades.
    await tx.execute(
      'DELETE s FROM expense_shares s JOIN expenses e ON e.id = s.expense_id WHERE e.group_id = ?',
      [groupId],
    );
    await tx.execute(
      'DELETE c FROM expense_comments c JOIN expenses e ON e.id = c.expense_id WHERE e.group_id = ?',
      [groupId],
    );
    await tx.execute('DELETE FROM expenses WHERE group_id = ?', [groupId]);
    await tx.execute('DELETE FROM payments WHERE group_id = ?', [groupId]);
    await tx.execute('DELETE FROM expense_groups WHERE id = ?', [groupId]);
  });
}

// ---------------------------------------------------------------------------------------------
// Members

export interface Member {
  id: number;
  userId: number | null;
  name: string;
  role: Role;
  /** Still in the group (former members stay in old expenses and the balances). */
  active: boolean;
  /** Has a DevQuake account linked (false for people the owner added by name). */
  hasAccount: boolean;
}

/** Everyone who is or was in the group: active members first, the owner on top. */
export async function membersOf(db: Db, groupId: number): Promise<Member[]> {
  const rows = await db.query<{
    id: number;
    user_id: number | null;
    display_name: string;
    role: Role;
    left_at: Date | string | null;
  }>(
    `SELECT id, user_id, display_name, role, left_at FROM group_members WHERE group_id = ?
      ORDER BY left_at IS NOT NULL, role = 'owner' DESC, display_name, id`,
    [groupId],
  );
  return rows.map((r) => ({
    id: num(r.id),
    userId: r.user_id === null ? null : num(r.user_id),
    name: r.display_name,
    role: r.role,
    active: r.left_at === null,
    hasAccount: r.user_id !== null,
  }));
}

async function activeCount(db: Db, groupId: number): Promise<number> {
  const [row] = await db.query<{ n: number }>(
    'SELECT COUNT(*) AS n FROM group_members WHERE group_id = ? AND left_at IS NULL',
    [groupId],
  );
  return num(row?.n ?? 0);
}

async function logActivity(
  db: Db,
  groupId: number,
  memberId: number | null,
  kind: string,
  extra: {
    expenseId?: number | null;
    title?: string | null;
    amount?: number | null;
    otherId?: number | null;
  } = {},
) {
  await db.execute(
    `INSERT INTO group_activity (group_id, member_id, kind, expense_id, title, amount, other_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      groupId,
      memberId,
      kind,
      extra.expenseId ?? null,
      extra.title ?? null,
      extra.amount ?? null,
      extra.otherId ?? null,
    ],
  );
}

/** The owner adds someone without a DevQuake account, by name (a friend on the trip). */
export async function addGuest(db: Db, groupId: number, userId: number, name: string) {
  const me = await requireOwner(db, groupId, userId);
  if ((await activeCount(db, groupId)) >= LIMITS.membersPerGroup) {
    throw new HttpError(400, 'tooManyMembers', { max: LIMITS.membersPerGroup });
  }
  const res = await db.execute(
    `INSERT INTO group_members (group_id, user_id, display_name, role, invited_by)
     VALUES (?, NULL, ?, 'member', ?)`,
    [groupId, name, userId],
  );
  await logActivity(db, groupId, me.memberId, 'member_joined', { otherId: res.insertId });
  return res.insertId;
}

/** The owner adds someone from their DevQuake referrals (checked by the caller). */
export async function addAccountMember(
  db: Db,
  groupId: number,
  owner: PluginUser,
  person: { id: number; displayName: string },
) {
  const me = await requireOwner(db, groupId, owner.id);
  if (await membership(db, groupId, person.id)) throw new HttpError(400, 'alreadyMember');
  if ((await activeCount(db, groupId)) >= LIMITS.membersPerGroup) {
    throw new HttpError(400, 'tooManyMembers', { max: LIMITS.membersPerGroup });
  }
  const res = await db.execute(
    `INSERT INTO group_members (group_id, user_id, display_name, role, invited_by)
     VALUES (?, ?, ?, 'member', ?)`,
    [groupId, person.id, person.displayName.slice(0, LIMITS.memberName), owner.id],
  );
  await logActivity(db, groupId, me.memberId, 'member_joined', { otherId: res.insertId });
}

/**
 * A member leaves, or the owner removes a member: only with a zero balance (settle up first).
 * They stay in old expenses as a former member; their account link is dropped.
 */
export async function removeMember(db: Db, groupId: number, memberId: number, userId: number) {
  const me = await requireMember(db, groupId, userId);
  if (memberId !== me.memberId && !me.isOwner) throw new HttpError(403, 'ownerOnly');
  const [row] = await db.query<{ role: Role }>(
    'SELECT role FROM group_members WHERE id = ? AND group_id = ? AND left_at IS NULL',
    [memberId, groupId],
  );
  if (!row) throw new HttpError(404, 'memberNotFound');
  if (row.role === 'owner') throw new HttpError(400, 'ownerCannotLeave');
  const ledger = await ledgerOf(db, groupId);
  if ((ledger.balance.get(memberId) ?? 0) !== 0) throw new HttpError(400, 'settleFirst');
  await db.execute(
    'UPDATE group_members SET left_at = UTC_TIMESTAMP(), user_id = NULL WHERE id = ?',
    [memberId],
  );
  await logActivity(db, groupId, me.memberId, 'member_left', { otherId: memberId });
}

/** The owner renames someone they added by name. */
export async function renameGuest(
  db: Db,
  groupId: number,
  memberId: number,
  userId: number,
  name: string,
) {
  await requireOwner(db, groupId, userId);
  const res = await db.execute(
    `UPDATE group_members SET display_name = ?
      WHERE id = ? AND group_id = ? AND user_id IS NULL AND left_at IS NULL`,
    [name, memberId, groupId],
  );
  if (res.affectedRows === 0) throw new HttpError(404, 'memberNotFound');
}

// ---------------------------------------------------------------------------------------------
// Invites

export async function activeInvite(db: Db, groupId: number): Promise<string | null> {
  const [row] = await db.query<{ code: string }>(
    'SELECT code FROM group_invites WHERE group_id = ? AND revoked_at IS NULL ORDER BY id DESC LIMIT 1',
    [groupId],
  );
  return row?.code ?? null;
}

/** The group's invite code, made on first use (any member may share it). */
export async function inviteCode(
  db: PluginDatabase,
  groupId: number,
  userId: number,
): Promise<string> {
  await requireMember(db, groupId, userId);
  return (await activeInvite(db, groupId)) ?? newInvite(db, groupId, userId, false);
}

/** A new code (the old link stops working); `check` = the owner asked for it. */
export async function newInvite(
  db: PluginDatabase,
  groupId: number,
  userId: number,
  check = true,
): Promise<string> {
  if (check) await requireOwner(db, groupId, userId);
  return db.transaction(async (tx) => {
    await tx.execute(
      'UPDATE group_invites SET revoked_at = UTC_TIMESTAMP() WHERE group_id = ? AND revoked_at IS NULL',
      [groupId],
    );
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = newInviteCode(randomInt);
      const [taken] = await tx.query<{ id: number }>(
        'SELECT id FROM group_invites WHERE code = ?',
        [code],
      );
      if (taken) continue;
      await tx.execute('INSERT INTO group_invites (group_id, code, created_by) VALUES (?, ?, ?)', [
        groupId,
        code,
        userId,
      ]);
      return code;
    }
    throw new Error('could not make a unique invite code');
  });
}

export interface InvitedGroup {
  id: number;
  name: string;
  kind: GroupKind;
  owner: string | null;
  members: number;
  inviter: number | null;
}

export async function groupByInvite(db: Db, code: string): Promise<InvitedGroup | null> {
  const [row] = await db.query<{
    id: number;
    name: string;
    kind: GroupKind;
    owner: string | null;
    members: number | string;
    created_by: number | null;
  }>(
    `SELECT g.id, g.name, g.kind, i.created_by,
            (SELECT m.display_name FROM group_members m WHERE m.group_id = g.id AND m.role = 'owner' LIMIT 1) AS owner,
            (SELECT COUNT(*) FROM group_members m WHERE m.group_id = g.id AND m.left_at IS NULL) AS members
       FROM group_invites i JOIN expense_groups g ON g.id = i.group_id
      WHERE i.code = ? AND i.revoked_at IS NULL`,
    [code],
  );
  if (!row) return null;
  return {
    id: num(row.id),
    name: row.name,
    kind: row.kind,
    owner: row.owner,
    members: num(row.members),
    inviter: row.created_by === null ? null : num(row.created_by),
  };
}

/** Joins the group behind an invite; returns it and who invited (free access, ADR 0043). */
export async function joinByInvite(db: Db, code: string, user: PluginUser) {
  const group = await groupByInvite(db, code);
  if (!group) throw new HttpError(404, 'inviteInvalid');
  if (await membership(db, group.id, user.id)) return { groupId: group.id, inviter: null };
  if (group.members >= LIMITS.membersPerGroup) {
    throw new HttpError(400, 'tooManyMembers', { max: LIMITS.membersPerGroup });
  }
  const inviter = group.inviter !== null && group.inviter !== user.id ? group.inviter : null;
  const res = await db.execute(
    `INSERT INTO group_members (group_id, user_id, display_name, role, invited_by)
     VALUES (?, ?, ?, 'member', ?)`,
    [group.id, user.id, user.displayName.slice(0, LIMITS.memberName), inviter],
  );
  await logActivity(db, group.id, res.insertId, 'member_joined', { otherId: res.insertId });
  return { groupId: group.id, inviter };
}

/** Who brought this user into a group (the platform's invitedBy hook, ADR 0043). */
export async function inviterOf(db: Db, userId: number): Promise<number | null> {
  const [row] = await db
    .query<{ invited_by: number }>(
      `SELECT invited_by FROM group_members
        WHERE user_id = ? AND invited_by IS NOT NULL AND left_at IS NULL ORDER BY id LIMIT 1`,
      [userId],
    )
    .catch(() => []);
  return row ? num(row.invited_by) : null;
}

// ---------------------------------------------------------------------------------------------
// Expenses

export interface Share {
  memberId: number;
  amount: number;
  /** What was typed: shares, a percentage or an amount (null for equal splits). */
  input: number | null;
}

export interface Expense {
  id: number;
  title: string;
  amount: number;
  paidBy: number;
  splitMode: SplitMode;
  category: string;
  spentOn: IsoDate;
  note: string | null;
  /** Added by another app ("utilities:bill:42"), or null. */
  source: string | null;
  createdBy: number | null;
  createdAt: string;
  updatedAt: string;
  shares: Share[];
  comments: number;
}

interface ExpenseRow {
  id: number;
  title: string;
  amount: string;
  paid_by: number;
  split_mode: SplitMode;
  category: string;
  spent_on: string;
  note: string | null;
  source: string | null;
  created_by: number | null;
  created_at: Date | string;
  updated_at: Date | string;
  comments: number | string;
}

const EXPENSE_COLUMNS = `e.id, e.title, e.amount, e.paid_by, e.split_mode, e.category,
  ${DAY('e.spent_on', 'spent_on')}, e.note, e.source, e.created_by, e.created_at, e.updated_at,
  (SELECT COUNT(*) FROM expense_comments c WHERE c.expense_id = e.id) AS comments`;

async function sharesOf(db: Db, expenseIds: number[]): Promise<Map<number, Share[]>> {
  const out = new Map<number, Share[]>();
  if (expenseIds.length === 0) return out;
  const rows = await db.query<{
    expense_id: number;
    member_id: number;
    amount: string;
    input: string | null;
  }>(
    `SELECT expense_id, member_id, amount, input FROM expense_shares
      WHERE expense_id IN (${expenseIds.map(() => '?').join(',')})`,
    expenseIds,
  );
  for (const r of rows) {
    const list = out.get(num(r.expense_id)) ?? [];
    list.push({
      memberId: num(r.member_id),
      amount: money(r.amount),
      input: r.input === null ? null : money(r.input),
    });
    out.set(num(r.expense_id), list);
  }
  return out;
}

function toExpense(r: ExpenseRow, shares: Share[]): Expense {
  return {
    id: num(r.id),
    title: r.title,
    amount: money(r.amount),
    paidBy: num(r.paid_by),
    splitMode: r.split_mode,
    category: r.category,
    spentOn: r.spent_on,
    note: r.note,
    source: r.source,
    createdBy: r.created_by === null ? null : num(r.created_by),
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at),
    shares,
    comments: num(r.comments),
  };
}

/** The group's expenses, newest day first (at most `limit`). */
export async function expensesOf(db: Db, groupId: number, limit = 500): Promise<Expense[]> {
  const rows = await db.query<ExpenseRow>(
    `SELECT ${EXPENSE_COLUMNS} FROM expenses e WHERE e.group_id = ?
      ORDER BY e.spent_on DESC, e.id DESC LIMIT ${Math.max(1, Math.min(limit, 5000))}`,
    [groupId],
  );
  const shares = await sharesOf(
    db,
    rows.map((r) => num(r.id)),
  );
  return rows.map((r) => toExpense(r, shares.get(num(r.id)) ?? []));
}

export async function expenseById(
  db: Db,
  groupId: number,
  expenseId: number,
): Promise<Expense | null> {
  const [row] = await db.query<ExpenseRow>(
    `SELECT ${EXPENSE_COLUMNS} FROM expenses e WHERE e.id = ? AND e.group_id = ?`,
    [expenseId, groupId],
  );
  if (!row) return null;
  const shares = await sharesOf(db, [expenseId]);
  return toExpense(row, shares.get(expenseId) ?? []);
}

/** Checks the payer and participants are active members and splits the amount (in cents). */
async function prepareShares(db: Db, groupId: number, input: ExpenseInput) {
  const members = await membersOf(db, groupId);
  const active = new Set(members.filter((m) => m.active).map((m) => m.id));
  if (!active.has(input.paidBy)) throw new HttpError(400, 'payerNotMember');
  if (input.entries.some((e) => !active.has(e.memberId))) throw new HttpError(400, 'notAMember');
  const split = splitExpense(toCents(input.amount), input.splitMode, input.entries, input.paidBy);
  if (!split.ok) throw new HttpError(400, split.error);
  const typed = new Map(input.entries.map((e) => [e.memberId, e.value]));
  return split.parts.map((p) => ({
    memberId: p.memberId,
    amount: fromCents(p.cents),
    input: input.splitMode === 'equal' ? null : (typed.get(p.memberId) ?? null),
  }));
}

async function writeShares(db: Db, expenseId: number, shares: Share[]) {
  await db.execute('DELETE FROM expense_shares WHERE expense_id = ?', [expenseId]);
  for (const s of shares) {
    await db.execute(
      'INSERT INTO expense_shares (expense_id, member_id, amount, input) VALUES (?, ?, ?, ?)',
      [expenseId, s.memberId, s.amount, s.input],
    );
  }
}

export async function createExpense(
  db: PluginDatabase,
  groupId: number,
  userId: number,
  input: ExpenseInput,
  /** Another app's key for what it added ("utilities:bill:42"): at most one expense per group. */
  source: string | null = null,
): Promise<number> {
  const me = await requireMember(db, groupId, userId);
  const [count] = await db.query<{ n: number }>(
    'SELECT COUNT(*) AS n FROM expenses WHERE group_id = ?',
    [groupId],
  );
  if (num(count?.n ?? 0) >= LIMITS.expensesPerGroup) {
    throw new HttpError(400, 'tooManyExpenses', { max: LIMITS.expensesPerGroup });
  }
  const shares = await prepareShares(db, groupId, input);
  return db.transaction(async (tx) => {
    const res = await tx.execute(
      `INSERT INTO expenses (group_id, title, amount, paid_by, split_mode, category, spent_on, note, source, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        groupId,
        input.title,
        input.amount,
        input.paidBy,
        input.splitMode,
        input.category,
        input.spentOn,
        input.note,
        source,
        me.memberId,
      ],
    );
    await writeShares(tx, res.insertId, shares);
    await logActivity(tx, groupId, me.memberId, 'expense_added', {
      expenseId: res.insertId,
      title: input.title,
      amount: input.amount,
    });
    return res.insertId;
  });
}

/** Any member may correct an expense; the feed says who changed it. */
export async function updateExpense(
  db: PluginDatabase,
  groupId: number,
  expenseId: number,
  userId: number,
  input: ExpenseInput,
) {
  const me = await requireMember(db, groupId, userId);
  if (!(await expenseById(db, groupId, expenseId))) throw new HttpError(404, 'expenseNotFound');
  const shares = await prepareShares(db, groupId, input);
  await db.transaction(async (tx) => {
    await tx.execute(
      `UPDATE expenses SET title = ?, amount = ?, paid_by = ?, split_mode = ?, category = ?,
              spent_on = ?, note = ?
        WHERE id = ? AND group_id = ?`,
      [
        input.title,
        input.amount,
        input.paidBy,
        input.splitMode,
        input.category,
        input.spentOn,
        input.note,
        expenseId,
        groupId,
      ],
    );
    await writeShares(tx, expenseId, shares);
    await logActivity(tx, groupId, me.memberId, 'expense_edited', {
      expenseId,
      title: input.title,
      amount: input.amount,
    });
  });
}

export async function deleteExpense(
  db: PluginDatabase,
  groupId: number,
  expenseId: number,
  userId: number,
) {
  const me = await requireMember(db, groupId, userId);
  const expense = await expenseById(db, groupId, expenseId);
  if (!expense) throw new HttpError(404, 'expenseNotFound');
  await db.transaction(async (tx) => {
    await tx.execute('DELETE FROM expense_shares WHERE expense_id = ?', [expenseId]);
    await tx.execute('DELETE FROM expense_comments WHERE expense_id = ?', [expenseId]);
    await tx.execute('DELETE FROM expenses WHERE id = ?', [expenseId]);
    await logActivity(tx, groupId, me.memberId, 'expense_deleted', {
      title: expense.title,
      amount: expense.amount,
    });
  });
}

// ---------------------------------------------------------------------------------------------
// Payments

export interface Payment {
  id: number;
  from: number;
  to: number;
  amount: number;
  paidOn: IsoDate;
  note: string | null;
  createdBy: number | null;
}

export async function paymentsOf(db: Db, groupId: number, limit = 500): Promise<Payment[]> {
  const rows = await db.query<{
    id: number;
    from_member: number;
    to_member: number;
    amount: string;
    paid_on: string;
    note: string | null;
    created_by: number | null;
  }>(
    `SELECT id, from_member, to_member, amount, ${DAY('paid_on', 'paid_on')}, note, created_by
       FROM payments WHERE group_id = ? ORDER BY paid_on DESC, id DESC
      LIMIT ${Math.max(1, Math.min(limit, 5000))}`,
    [groupId],
  );
  return rows.map((r) => ({
    id: num(r.id),
    from: num(r.from_member),
    to: num(r.to_member),
    amount: money(r.amount),
    paidOn: r.paid_on,
    note: r.note,
    createdBy: r.created_by === null ? null : num(r.created_by),
  }));
}

export async function createPayment(db: Db, groupId: number, userId: number, input: PaymentInput) {
  const me = await requireMember(db, groupId, userId);
  const members = await membersOf(db, groupId);
  const known = new Map(members.map((m) => [m.id, m]));
  // Former members can still be paid back or pay back what they owed.
  if (!known.has(input.from) || !known.has(input.to)) throw new HttpError(400, 'notAMember');
  const res = await db.execute(
    `INSERT INTO payments (group_id, from_member, to_member, amount, paid_on, note, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [groupId, input.from, input.to, input.amount, input.paidOn, input.note, me.memberId],
  );
  await logActivity(db, groupId, me.memberId, 'payment_added', {
    amount: input.amount,
    title: `${known.get(input.from)!.name} → ${known.get(input.to)!.name}`,
    otherId: res.insertId,
  });
  return res.insertId;
}

export async function deletePayment(db: Db, groupId: number, paymentId: number, userId: number) {
  const me = await requireMember(db, groupId, userId);
  const [row] = await db.query<{ amount: string; from_name: string; to_name: string }>(
    `SELECT p.amount, f.display_name AS from_name, t.display_name AS to_name
       FROM payments p JOIN group_members f ON f.id = p.from_member JOIN group_members t ON t.id = p.to_member
      WHERE p.id = ? AND p.group_id = ?`,
    [paymentId, groupId],
  );
  if (!row) throw new HttpError(404, 'paymentNotFound');
  await db.execute('DELETE FROM payments WHERE id = ?', [paymentId]);
  await logActivity(db, groupId, me.memberId, 'payment_deleted', {
    amount: money(row.amount),
    title: `${row.from_name} → ${row.to_name}`,
  });
}

// ---------------------------------------------------------------------------------------------
// Balances

export interface Ledger {
  /** Balance in cents by member id (positive = the group owes them). */
  balance: Map<number, number>;
  /** The suggested transfers to settle up. */
  transfers: Transfer[];
}

export async function ledgerOf(db: Db, groupId: number): Promise<Ledger> {
  const [members, expenses, shares, payments] = await Promise.all([
    db.query<{ id: number }>('SELECT id FROM group_members WHERE group_id = ?', [groupId]),
    db.query<{ id: number; paid_by: number; amount: string }>(
      'SELECT id, paid_by, amount FROM expenses WHERE group_id = ?',
      [groupId],
    ),
    db.query<{ expense_id: number; member_id: number; amount: string }>(
      `SELECT s.expense_id, s.member_id, s.amount FROM expense_shares s
         JOIN expenses e ON e.id = s.expense_id WHERE e.group_id = ?`,
      [groupId],
    ),
    db.query<{ from_member: number; to_member: number; amount: string }>(
      'SELECT from_member, to_member, amount FROM payments WHERE group_id = ?',
      [groupId],
    ),
  ]);
  const byExpense = new Map<number, Array<{ memberId: number; cents: number }>>();
  for (const s of shares) {
    const list = byExpense.get(num(s.expense_id)) ?? [];
    list.push({ memberId: num(s.member_id), cents: toCents(money(s.amount)) });
    byExpense.set(num(s.expense_id), list);
  }
  const balance = balances(
    members.map((m) => num(m.id)),
    expenses.map((e) => ({
      paidBy: num(e.paid_by),
      amountCents: toCents(money(e.amount)),
      shares: byExpense.get(num(e.id)) ?? [],
    })),
    payments.map((p) => ({
      from: num(p.from_member),
      to: num(p.to_member),
      amountCents: toCents(money(p.amount)),
    })),
  );
  return { balance, transfers: settleUp(balance) };
}

// ---------------------------------------------------------------------------------------------
// Comments and activity

export interface Comment {
  id: number;
  memberId: number;
  body: string;
  createdAt: string;
}

export async function commentsOf(db: Db, expenseId: number): Promise<Comment[]> {
  const rows = await db.query<{
    id: number;
    member_id: number;
    body: string;
    created_at: Date | string;
  }>(
    'SELECT id, member_id, body, created_at FROM expense_comments WHERE expense_id = ? ORDER BY created_at, id',
    [expenseId],
  );
  return rows.map((r) => ({
    id: num(r.id),
    memberId: num(r.member_id),
    body: r.body,
    createdAt: iso(r.created_at),
  }));
}

export async function addComment(
  db: Db,
  groupId: number,
  expenseId: number,
  userId: number,
  body: string,
) {
  const me = await requireMember(db, groupId, userId);
  const expense = await expenseById(db, groupId, expenseId);
  if (!expense) throw new HttpError(404, 'expenseNotFound');
  if (expense.comments >= LIMITS.commentsPerExpense) {
    throw new HttpError(400, 'tooManyComments', { max: LIMITS.commentsPerExpense });
  }
  await db.execute('INSERT INTO expense_comments (expense_id, member_id, body) VALUES (?, ?, ?)', [
    expenseId,
    me.memberId,
    body,
  ]);
  await logActivity(db, groupId, me.memberId, 'comment_added', {
    expenseId,
    title: expense.title,
  });
}

/** The author or the group's owner removes a comment. */
export async function deleteComment(db: Db, groupId: number, commentId: number, userId: number) {
  const me = await requireMember(db, groupId, userId);
  const [row] = await db.query<{ member_id: number }>(
    `SELECT c.member_id FROM expense_comments c JOIN expenses e ON e.id = c.expense_id
      WHERE c.id = ? AND e.group_id = ?`,
    [commentId, groupId],
  );
  if (!row) throw new HttpError(404, 'commentNotFound');
  if (num(row.member_id) !== me.memberId && !me.isOwner) throw new HttpError(403, 'notYours');
  await db.execute('DELETE FROM expense_comments WHERE id = ?', [commentId]);
}

export interface Activity {
  id: number;
  memberId: number | null;
  kind: string;
  expenseId: number | null;
  title: string | null;
  amount: number | null;
  otherId: number | null;
  createdAt: string;
}

export async function activityOf(db: Db, groupId: number, limit = 100): Promise<Activity[]> {
  const rows = await db.query<{
    id: number;
    member_id: number | null;
    kind: string;
    expense_id: number | null;
    title: string | null;
    amount: string | null;
    other_id: number | null;
    created_at: Date | string;
  }>(
    // expense_id only while the expense still exists, so the feed never links to a deleted one.
    `SELECT a.id, a.member_id, a.kind, e.id AS expense_id, a.title, a.amount, a.other_id, a.created_at
       FROM group_activity a LEFT JOIN expenses e ON e.id = a.expense_id
      WHERE a.group_id = ? ORDER BY a.created_at DESC, a.id DESC
      LIMIT ${Math.max(1, Math.min(limit, 500))}`,
    [groupId],
  );
  return rows.map((r) => ({
    id: num(r.id),
    memberId: r.member_id === null ? null : num(r.member_id),
    kind: r.kind,
    expenseId: r.expense_id === null ? null : num(r.expense_id),
    title: r.title,
    amount: r.amount === null ? null : money(r.amount),
    otherId: r.other_id === null ? null : num(r.other_id),
    createdAt: iso(r.created_at),
  }));
}

// ---------------------------------------------------------------------------------------------
// Statistics

export interface Stats {
  total: number;
  byCategory: Array<{ category: string; amount: number }>;
  /** What each member paid for the group and what their share of it was. */
  byMember: Array<{ memberId: number; paid: number; share: number }>;
  /** Spending per month ("2026-10"), oldest first. */
  byMonth: Array<{ month: string; amount: number }>;
}

export async function statsOf(db: Db, groupId: number): Promise<Stats> {
  const [cats, paid, shares, months] = await Promise.all([
    db.query<{ category: string; amount: string }>(
      `SELECT category, SUM(amount) AS amount FROM expenses WHERE group_id = ?
        GROUP BY category ORDER BY amount DESC`,
      [groupId],
    ),
    db.query<{ member_id: number; amount: string }>(
      'SELECT paid_by AS member_id, SUM(amount) AS amount FROM expenses WHERE group_id = ? GROUP BY paid_by',
      [groupId],
    ),
    db.query<{ member_id: number; amount: string }>(
      `SELECT s.member_id, SUM(s.amount) AS amount FROM expense_shares s
         JOIN expenses e ON e.id = s.expense_id WHERE e.group_id = ? GROUP BY s.member_id`,
      [groupId],
    ),
    db.query<{ month: string; amount: string }>(
      `SELECT DATE_FORMAT(spent_on, '%Y-%m') AS month, SUM(amount) AS amount FROM expenses
        WHERE group_id = ? GROUP BY month ORDER BY month`,
      [groupId],
    ),
  ]);
  const byMember = new Map<number, { memberId: number; paid: number; share: number }>();
  const entry = (id: number) => {
    const e = byMember.get(id) ?? { memberId: id, paid: 0, share: 0 };
    byMember.set(id, e);
    return e;
  };
  for (const p of paid) entry(num(p.member_id)).paid = money(p.amount);
  for (const s of shares) entry(num(s.member_id)).share = money(s.amount);
  const byCategory = cats.map((c) => ({ category: c.category, amount: money(c.amount) }));
  return {
    total: fromCents(byCategory.reduce((a, c) => a + toCents(c.amount), 0)),
    byCategory,
    byMember: [...byMember.values()].sort((a, b) => b.paid - a.paid),
    byMonth: months.map((m) => ({ month: m.month, amount: money(m.amount) })),
  };
}

// ---------------------------------------------------------------------------------------------
// A user's data (platform hooks, ADR 0007 and 0042)

/**
 * Removes or anonymises a user: groups where they are the only active member are deleted with
 * everything in them; in shared groups their member row loses its account and its name becomes
 * `name` (so the others' balances stay right); groups they owned pass to the longest-standing
 * member with an account.
 */
export async function forgetUser(db: PluginDatabase, userId: number, name: string) {
  await db.transaction(async (tx) => {
    const alone = await tx.query<{ group_id: number }>(
      `SELECT m.group_id FROM group_members m
        WHERE m.user_id = ? AND m.left_at IS NULL
          AND NOT EXISTS (SELECT 1 FROM group_members o
                           WHERE o.group_id = m.group_id AND o.id <> m.id
                             AND o.user_id IS NOT NULL AND o.left_at IS NULL)`,
      [userId],
    );
    for (const { group_id } of alone) {
      const g = num(group_id);
      await tx.execute(
        'DELETE s FROM expense_shares s JOIN expenses e ON e.id = s.expense_id WHERE e.group_id = ?',
        [g],
      );
      await tx.execute(
        'DELETE c FROM expense_comments c JOIN expenses e ON e.id = c.expense_id WHERE e.group_id = ?',
        [g],
      );
      await tx.execute('DELETE FROM expenses WHERE group_id = ?', [g]);
      await tx.execute('DELETE FROM payments WHERE group_id = ?', [g]);
      await tx.execute('DELETE FROM expense_groups WHERE id = ?', [g]);
    }
    // Owned shared groups: the member with an account who joined first becomes the owner.
    await tx.execute(
      `UPDATE expense_groups g
          JOIN (SELECT m.group_id, MIN(m.id) AS heir FROM group_members m
                 WHERE m.user_id IS NOT NULL AND m.user_id <> ? AND m.left_at IS NULL
                 GROUP BY m.group_id) h ON h.group_id = g.id
          JOIN group_members n ON n.id = h.heir
          SET g.owner_user_id = n.user_id
        WHERE g.owner_user_id = ?`,
      [userId, userId],
    );
    await tx.execute(
      `UPDATE group_members m JOIN expense_groups g ON g.id = m.group_id
          SET m.role = IF(m.user_id = g.owner_user_id, 'owner', 'member')
        WHERE m.group_id IN (SELECT group_id FROM (SELECT group_id FROM group_members WHERE user_id = ?) x)`,
      [userId],
    );
    await tx.execute(
      `UPDATE group_members SET user_id = NULL, display_name = ?, role = 'member',
              left_at = COALESCE(left_at, UTC_TIMESTAMP()), invited_by = NULL
        WHERE user_id = ?`,
      [name.slice(0, LIMITS.memberName), userId],
    );
    await tx.execute('UPDATE group_members SET invited_by = NULL WHERE invited_by = ?', [userId]);
    await tx.execute('UPDATE group_invites SET created_by = NULL WHERE created_by = ?', [userId]);
  });
}

/** Whether they took part in a group someone else still uses (ADR 0042). */
export async function sharesWithOthers(db: Db, userId: number): Promise<boolean> {
  const [row] = await db.query<{ n: number | string }>(
    `SELECT EXISTS (SELECT 1 FROM group_members m
                     WHERE m.user_id = ?
                       AND EXISTS (SELECT 1 FROM group_members o
                                    WHERE o.group_id = m.group_id AND o.id <> m.id
                                      AND o.user_id IS NOT NULL AND o.left_at IS NULL)) AS n`,
    [userId],
  );
  return num(row?.n ?? 0) === 1;
}

// ---------------------------------------------------------------------------------------------
// Other apps (link points groups.overview and expense.add, ADR 0035)

export interface GroupOverview {
  id: number;
  name: string;
  kind: GroupKind;
  currency: string;
  /** Platform user ids of the active members with an account, to check who can share. */
  userIds: number[];
}

/** The member's groups for another app: names, currencies and who is in them (by user id). */
export async function groupsOverview(db: Db, userId: number): Promise<GroupOverview[]> {
  const groups = await groupsOf(db, userId);
  if (groups.length === 0) return [];
  const ids = groups.map((g) => g.id);
  const rows = await db.query<{ group_id: number; user_id: number }>(
    `SELECT group_id, user_id FROM group_members
      WHERE group_id IN (${ids.map(() => '?').join(',')}) AND user_id IS NOT NULL AND left_at IS NULL`,
    ids,
  );
  return groups.map((g) => ({
    id: g.id,
    name: g.name,
    kind: g.kind,
    currency: g.currency,
    userIds: rows.filter((r) => num(r.group_id) === g.id).map((r) => num(r.user_id)),
  }));
}

export interface ExpenseFromApp {
  groupId: number;
  title: string;
  amount: number;
  currency: string;
  spentOn: IsoDate;
  category: Category;
  note: string | null;
  source: string;
  /** Equal parts between these people, or exact amounts per person (platform user ids). */
  split:
    | { mode: 'equal'; userIds: number[] }
    | { mode: 'exact'; shares: Array<{ userId: number; amount: number }> };
}

export type FromAppResult =
  | { ok: true; expenseId: number; created: boolean }
  | { ok: false; error: 'not-found' | 'forbidden' | 'invalid-input' };

/**
 * Adds an expense another app sent, paid by the member it acts for. Everyone in the split must
 * be an active member of the group with an account; the currency must be the group's. The same
 * source again returns the existing expense (created: false).
 */
export async function addExpenseFromApp(
  db: PluginDatabase,
  user: PluginUser,
  input: ExpenseFromApp,
): Promise<FromAppResult> {
  const me = await membership(db, input.groupId, user.id);
  const group = me ? await groupById(db, input.groupId) : null;
  if (!me || !group) return { ok: false, error: 'not-found' };
  if (group.currency !== input.currency) return { ok: false, error: 'invalid-input' };
  const [existing] = await db.query<{ id: number }>(
    'SELECT id FROM expenses WHERE group_id = ? AND source = ?',
    [input.groupId, input.source],
  );
  if (existing) return { ok: true, expenseId: num(existing.id), created: false };
  const members = await membersOf(db, input.groupId);
  const byUser = new Map(
    members.filter((m) => m.active && m.userId !== null).map((m) => [m.userId!, m.id]),
  );
  const userIds =
    input.split.mode === 'equal' ? input.split.userIds : input.split.shares.map((s) => s.userId);
  if (userIds.length === 0 || userIds.some((u) => !byUser.has(u))) {
    return { ok: false, error: 'forbidden' };
  }
  const entries =
    input.split.mode === 'equal'
      ? input.split.userIds.map((u) => ({ memberId: byUser.get(u)!, value: 1 }))
      : input.split.shares.map((s) => ({ memberId: byUser.get(s.userId)!, value: s.amount }));
  try {
    const expenseId = await createExpense(
      db,
      input.groupId,
      user.id,
      {
        title: input.title,
        amount: input.amount,
        paidBy: me.memberId,
        splitMode: input.split.mode,
        entries,
        category: input.category,
        spentOn: input.spentOn,
        note: input.note,
      },
      input.source,
    );
    return { ok: true, expenseId, created: true };
  } catch (err) {
    if (err instanceof HttpError) return { ok: false, error: 'invalid-input' };
    // Two calls at once for the same source: the unique key let one through.
    if ((err as { code?: string }).code === 'ER_DUP_ENTRY') {
      const [row] = await db.query<{ id: number }>(
        'SELECT id FROM expenses WHERE group_id = ? AND source = ?',
        [input.groupId, input.source],
      );
      if (row) return { ok: true, expenseId: num(row.id), created: false };
    }
    throw err;
  }
}
