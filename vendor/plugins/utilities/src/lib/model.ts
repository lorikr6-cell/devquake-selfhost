// Domain constants and small pure helpers shared by pages, the API and tests.

/**
 * Utility categories. The codes are stored in the database (utilities.category): add new codes
 * freely, but never rename or remove one without a migration. Labels live in the translations
 * (categories.<code>). `metered` categories usually have a meter and a unit; the "Individual
 * meter required" option is offered for every category, preselected for metered ones.
 */
export const CATEGORIES = [
  { code: 'electricity', icon: '⚡', unit: 'kWh', metered: true },
  { code: 'gas', icon: '🔥', unit: 'm³', metered: true },
  { code: 'water', icon: '💧', unit: 'm³', metered: true },
  { code: 'heating', icon: '♨️', unit: 'kWh', metered: true },
  { code: 'phone', icon: '📱', unit: null, metered: false },
  { code: 'cable', icon: '📺', unit: null, metered: false },
  { code: 'internet', icon: '🌐', unit: null, metered: false },
  { code: 'hosting', icon: '🖥️', unit: null, metered: false },
  { code: 'xbox', icon: '🎮', unit: null, metered: false },
  { code: 'microsoft', icon: '🪟', unit: null, metered: false },
  { code: 'apple', icon: '🍎', unit: null, metered: false },
  { code: 'steam', icon: '🕹️', unit: null, metered: false },
  { code: 'custom', icon: '🧾', unit: null, metered: false },
] as const;

export type CategoryCode = (typeof CATEGORIES)[number]['code'];

export function isCategory(value: unknown): value is CategoryCode {
  return CATEGORIES.some((c) => c.code === value);
}

export function category(code: string) {
  return CATEGORIES.find((c) => c.code === code) ?? CATEGORIES[CATEGORIES.length - 1]!;
}

/** Units offered in the form (people may type others). */
export const UNITS = ['kWh', 'm³', 'Gcal', 'GB', 'min'] as const;

export const CURRENCIES = ['RON', 'EUR', 'USD', 'HUF', 'GBP'] as const;

export const PAYMENT_METHODS = ['cash', 'card', 'other'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export function formatMoney(amount: number, currency: string, tag = 'en-GB'): string {
  try {
    return new Intl.NumberFormat(tag, { style: 'currency', currency }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

/** A consumption or meter index: up to 3 decimals, without trailing zeros. */
export function formatAmount(value: number, tag = 'en-GB'): string {
  return new Intl.NumberFormat(tag, { maximumFractionDigits: 3 }).format(value);
}

/** A unit price: up to 4 decimals ("0.8734 RON/kWh"). */
export function formatUnitPrice(
  value: number,
  currency: string,
  unit: string | null,
  tag = 'en-GB',
) {
  let money: string;
  try {
    money = new Intl.NumberFormat(tag, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(value);
  } catch {
    money = `${value.toFixed(4)} ${currency}`;
  }
  return unit ? `${money}/${unit}` : money;
}

// Invite codes: 8 characters without look-alikes (no I, L, O, 0, 1).
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export const INVITE_CODE_PATTERN = /^[A-HJ-KM-NP-Z2-9]{8}$/;

export function newInviteCode(random: (max: number) => number): string {
  let code = '';
  for (let i = 0; i < 8; i++) code += CODE_ALPHABET[random(CODE_ALPHABET.length)];
  return code;
}
