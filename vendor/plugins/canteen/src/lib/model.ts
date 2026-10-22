// The app's fixed lists and limits; their labels are in the translations (kinds.*, diets.*, …).

export const PERSON_KINDS = ['delivery', 'resident'] as const;
export type PersonKind = (typeof PERSON_KINDS)[number];

export const STATUSES = ['active', 'paused', 'ended'] as const;
export type PersonStatus = (typeof STATUSES)[number];

export const DIETS = ['normal', 'diabetic', 'low_salt', 'soft', 'pureed', 'vegetarian'] as const;
export type Diet = (typeof DIETS)[number];

/** The pictures of a person: photo and ID card are required for a complete profile. */
export const DOCUMENT_KINDS = ['photo', 'id_card', 'extra1', 'extra2'] as const;
export type DocumentKind = (typeof DOCUMENT_KINDS)[number];
export const REQUIRED_DOCUMENTS: readonly DocumentKind[] = ['photo', 'id_card'];

/** In the URL: /documents/id-card. */
export const documentSlug = (kind: DocumentKind) => kind.replace('_', '-');
export const documentFromSlug = (slug: string | undefined): DocumentKind | null => {
  const kind = slug?.replace('-', '_');
  return DOCUMENT_KINDS.includes(kind as DocumentKind) ? (kind as DocumentKind) : null;
};

export const LIMITS = {
  orgName: 120,
  firstName: 60,
  lastName: 60,
  address: 255,
  phone: 40,
  contactName: 80,
  allergies: 255,
  observation: 500,
  incident: 4000,
  displayName: 80,
} as const;

const oneOf =
  <T extends readonly string[]>(list: T) =>
  (v: unknown): v is T[number] =>
    list.includes(v as string);

export const isPersonKind = oneOf(PERSON_KINDS);
export const isStatus = oneOf(STATUSES);
export const isDiet = oneOf(DIETS);

/** Days until the next birthday (0 = today), for the birthday badges; null without a date. */
export function daysToBirthday(birthDate: string | null, today: string): number | null {
  if (!birthDate) return null;
  const [, m, d] = birthDate.split('-').map(Number);
  const [y] = today.split('-').map(Number);
  const t = Date.parse(`${today}T00:00:00Z`);
  for (const year of [y!, y! + 1]) {
    // 29 February is celebrated on 28 February in other years.
    const leap = new Date(Date.UTC(year, 1, 29)).getUTCMonth() === 1;
    const day = m === 2 && d === 29 && !leap ? 28 : d!;
    const next = Date.UTC(year, m! - 1, day);
    if (next >= t) return Math.round((next - t) / 86_400_000);
  }
  return null;
}

/** The age reached on `today`. */
export function ageOn(birthDate: string, today: string): number {
  const [by, bm, bd] = birthDate.split('-').map(Number);
  const [ty, tm, td] = today.split('-').map(Number);
  return ty! - by! - (tm! < bm! || (tm === bm && td! < bd!) ? 1 : 0);
}

/** Invitation codes: 12 characters without look-alikes (0/O, 1/I/L). */
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const INVITE_CODE_PATTERN = /^[A-HJ-KM-NP-Z2-9]{12}$/;
export const INVITE_DAYS = 7;

export function newInviteCode(random: (max: number) => number): string {
  let code = '';
  for (let i = 0; i < 12; i++) code += CODE_ALPHABET[random(CODE_ALPHABET.length)];
  return code;
}
