// Drivers' licences: reading the text OCR found on an EU driving licence, checking the name
// and the state of its expiry date. Pure, tested in licence.test.ts.
//
// EU licences (Romanian ones included) number their fields: 1. surname, 2. given names,
// 3. date and place of birth, 4a. issue date, 4b. expiry date, 4c. authority, 5. licence number,
// 9. categories. Dates are written dd.mm.yyyy.

/** A licence expiring within this many days gets a warning for the driver and the organisers. */
export const WARN_DAYS = 90;

export interface LicenceFields {
  surname: string | null;
  givenNames: string | null;
  /** YYYY-MM-DD */
  expiresOn: string | null;
  number: string | null;
}

/** "17.09.2031" → "2031-09-17"; null when it is not a real day. */
function day(text: string): string | null {
  const m = /(\d{2})[./-](\d{2})[./-](\d{4})/.exec(text);
  if (!m) return null;
  const [d, mo, y] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  if (date.getUTCMonth() !== mo - 1 || y < 1950 || y > 2100) return null;
  return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** The value after a numbered field ("4b." or "4b)"), on the same line or the next one. */
function field(lines: string[], label: string): string | null {
  const re = new RegExp(`^\\s*${label}[.)]?\\s*(.*)$`, 'i');
  for (let i = 0; i < lines.length; i++) {
    const m = re.exec(lines[i]!);
    if (!m) continue;
    const rest = m[1]!.trim();
    return rest || lines[i + 1]?.trim() || null;
  }
  return null;
}

export function readLicence(text: string): LicenceFields {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const expiry = field(lines, '4b');
  const number = field(lines, '5');
  return {
    surname: field(lines, '1'),
    givenNames: field(lines, '2'),
    expiresOn: expiry ? day(expiry) : null,
    number: number
      ? number
          .replace(/[^A-Za-z0-9]/g, '')
          .toUpperCase()
          .slice(0, 20) || null
      : null,
  };
}

/** Lower case without diacritics: "Ștefan Pop" and "STEFAN POP" compare equal. */
const plain = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Whether every part of the driver's name (2+ letters) appears on the licence. */
export function nameOnLicence(driverName: string, text: string): boolean {
  const words = plain(text);
  const parts = plain(driverName)
    .split(/[^a-z]+/)
    .filter((p) => p.length >= 2);
  return parts.length > 0 && parts.every((p) => new RegExp(`(^|[^a-z])${p}([^a-z]|$)`).test(words));
}

export type LicenceState =
  | { kind: 'missing' }
  | { kind: 'expired'; expiresOn: string }
  | { kind: 'soon'; expiresOn: string; daysLeft: number }
  | { kind: 'ok'; expiresOn: string };

/** The licence's state on `today`: soon = within WARN_DAYS days (the last day still counts). */
export function licenceState(expiresOn: string | null, today: string): LicenceState {
  if (!expiresOn) return { kind: 'missing' };
  const days = Math.round(
    (Date.parse(`${expiresOn}T12:00:00Z`) - Date.parse(`${today}T12:00:00Z`)) / 86_400_000,
  );
  if (days < 0) return { kind: 'expired', expiresOn };
  if (days <= WARN_DAYS) return { kind: 'soon', expiresOn, daysLeft: days };
  return { kind: 'ok', expiresOn };
}
