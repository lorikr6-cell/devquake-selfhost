import type { ExpenseFromApp } from './data';
import { isIsoDate } from './dates';
import { LIMITS, isCategory, isCurrency, parseAmount } from './model';
import { toCents } from './split';

// The input of the link point expense.add (ADR 0035), checked: pure, unit-tested.

const SOURCE = /^[a-z][a-z0-9-]{1,30}:[a-z0-9:._-]{1,48}$/;

const text = (value: unknown, max: number): string | null => {
  if (typeof value !== 'string') return null;
  const t = value.replace(/\s+/g, ' ').trim();
  return t && t.length <= max ? t : null;
};

const userId = (value: unknown): number | null =>
  typeof value === 'number' && Number.isSafeInteger(value) && value > 0 ? value : null;

/**
 * {
 *   groupId, title, amount, currency, spentOn ("YYYY-MM-DD"), category?, note?,
 *   source ("<app>:<what>:<id>"),
 *   split: { mode: 'equal', userIds: number[] } | { mode: 'exact', shares: [{ userId, amount }] }
 * }
 * Returns null for anything else. The source must start with the calling app's id.
 */
export function parseExpenseFromApp(raw: unknown, from: string): ExpenseFromApp | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const groupId = userId(r.groupId);
  const title = text(r.title, LIMITS.title);
  const amount = parseAmount(r.amount);
  const currency = typeof r.currency === 'string' ? r.currency.toUpperCase() : '';
  const spentOn = r.spentOn;
  const category = r.category ?? 'other';
  const note = r.note === undefined || r.note === null ? null : text(r.note, LIMITS.note);
  const source = typeof r.source === 'string' ? r.source : '';
  if (
    !groupId ||
    !title ||
    amount === null ||
    !isCurrency(currency) ||
    !isIsoDate(spentOn) ||
    !isCategory(category) ||
    (r.note !== undefined && r.note !== null && note === null) ||
    !SOURCE.test(source) ||
    !source.startsWith(`${from}:`)
  ) {
    return null;
  }
  const split = (r.split ?? {}) as Record<string, unknown>;
  if (split.mode === 'equal' && Array.isArray(split.userIds)) {
    const ids = split.userIds.map(userId);
    if (ids.length === 0 || ids.length > LIMITS.membersPerGroup || ids.some((id) => id === null)) {
      return null;
    }
    if (new Set(ids).size !== ids.length) return null;
    return {
      groupId,
      title,
      amount,
      currency,
      spentOn,
      category,
      note,
      source,
      split: { mode: 'equal', userIds: ids as number[] },
    };
  }
  if (split.mode === 'exact' && Array.isArray(split.shares)) {
    const shares = split.shares.map((s) => {
      const x = (s ?? {}) as Record<string, unknown>;
      const id = userId(x.userId);
      const value =
        typeof x.amount === 'number' && Number.isFinite(x.amount) && x.amount >= 0
          ? x.amount
          : null;
      return id === null || value === null
        ? null
        : { userId: id, amount: Math.round(value * 100) / 100 };
    });
    if (
      shares.length === 0 ||
      shares.length > LIMITS.membersPerGroup ||
      shares.some((s) => s === null)
    ) {
      return null;
    }
    const ok = shares as Array<{ userId: number; amount: number }>;
    if (new Set(ok.map((s) => s.userId)).size !== ok.length) return null;
    if (ok.reduce((a, s) => a + toCents(s.amount), 0) !== toCents(amount)) return null;
    return {
      groupId,
      title,
      amount,
      currency,
      spentOn,
      category,
      note,
      source,
      split: { mode: 'exact', shares: ok },
    };
  }
  return null;
}
