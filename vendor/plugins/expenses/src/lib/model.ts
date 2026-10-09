// What groups, expenses and members can be: pure, shared by pages, the API and tests (ADR 0055).

export const GROUP_KINDS = ['trip', 'flat', 'couple', 'event', 'other'] as const;
export type GroupKind = (typeof GROUP_KINDS)[number];
export const isGroupKind = (v: unknown): v is GroupKind => GROUP_KINDS.includes(v as GroupKind);

export const KIND_ICONS: Record<GroupKind, string> = {
  trip: '🧳',
  flat: '🏠',
  couple: '💞',
  event: '🎉',
  other: '👥',
};

/** Expense categories with their emoji; the names are in the catalog (categories.<code>). */
export const CATEGORIES = [
  { code: 'food', icon: '🍽️' },
  { code: 'groceries', icon: '🛒' },
  { code: 'transport', icon: '🚗' },
  { code: 'accommodation', icon: '🏨' },
  { code: 'rent', icon: '🔑' },
  { code: 'utilities', icon: '💡' },
  { code: 'entertainment', icon: '🎟️' },
  { code: 'shopping', icon: '🛍️' },
  { code: 'health', icon: '💊' },
  { code: 'gifts', icon: '🎁' },
  { code: 'other', icon: '🧾' },
] as const;
export type Category = (typeof CATEGORIES)[number]['code'];
export const isCategory = (v: unknown): v is Category => CATEGORIES.some((c) => c.code === v);
export const categoryIcon = (code: string) => CATEGORIES.find((c) => c.code === code)?.icon ?? '🧾';

export const SPLIT_MODES = ['equal', 'shares', 'percent', 'exact'] as const;
export const isSplitMode = (v: unknown): v is (typeof SPLIT_MODES)[number] =>
  SPLIT_MODES.includes(v as (typeof SPLIT_MODES)[number]);

/** Currencies offered first; any ISO 4217 code of three letters is accepted. */
export const CURRENCIES = ['EUR', 'RON', 'HUF', 'USD', 'GBP', 'CHF', 'PLN', 'CZK'] as const;
export const isCurrency = (v: unknown): v is string =>
  typeof v === 'string' && /^[A-Z]{3}$/.test(v);

export const ROLES = ['owner', 'member'] as const;
export type Role = (typeof ROLES)[number];

export const LIMITS = {
  groupName: 80,
  memberName: 80,
  title: 120,
  note: 500,
  paymentNote: 255,
  comment: 1000,
  /** Largest single amount (DECIMAL(12,2)). */
  amount: 9_999_999.99,
  groupsPerUser: 50,
  membersPerGroup: 50,
  expensesPerGroup: 5000,
  commentsPerExpense: 200,
} as const;

/** Invite codes: 8 characters without look-alikes (no I, L, O, 0, 1). */
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const INVITE_CODE_PATTERN = /^[A-HJ-KM-NP-Z2-9]{8}$/;

export function newInviteCode(random: (max: number) => number): string {
  let code = '';
  for (let i = 0; i < 8; i++) code += CODE_ALPHABET[random(CODE_ALPHABET.length)];
  return code;
}

/** Initials for a member's round badge ("Ana Maria" → "AM"). */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const letters = words.length > 1 ? [words[0]![0], words[words.length - 1]![0]] : [words[0]?.[0]];
  return letters.filter(Boolean).join('').toUpperCase() || '?';
}

/** Money as typed: "12,50" or "12.50" → 12.5; null when it is not an amount with up to 2 decimals. */
export function parseAmount(value: unknown): number | null {
  const text = typeof value === 'number' ? String(value) : typeof value === 'string' ? value : '';
  const clean = text.trim().replace(/\s/g, '').replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(clean)) return null;
  const n = Number(clean);
  return n > 0 && n <= LIMITS.amount ? n : null;
}

/** Money in the group's currency, in the page language ("1.234,50 €"). */
export function formatMoney(amount: number, currency: string, tag: string): string {
  try {
    return new Intl.NumberFormat(tag, { style: 'currency', currency }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}
