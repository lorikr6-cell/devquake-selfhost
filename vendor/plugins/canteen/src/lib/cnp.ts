// The Romanian personal numeric code (CNP): S YY MM DD JJ NNN C, 13 digits. The first digit
// gives the sex and the century, the next six the date of birth, the last one is a checksum.

const WEIGHTS = [2, 7, 9, 1, 4, 6, 3, 5, 8, 2, 7, 9];

const CENTURY: Record<string, number> = {
  '1': 1900,
  '2': 1900,
  '3': 1800,
  '4': 1800,
  '5': 2000,
  '6': 2000,
};

export interface CnpInfo {
  /** YYYY-MM-DD, or null for foreign residents (7, 8, 9) whose century the code does not say. */
  birthDate: string | null;
  sex: 'm' | 'f' | null;
}

/** The checksum digit of the first 12 digits. */
export function cnpChecksum(first12: string): number {
  const sum = WEIGHTS.reduce((s, w, i) => s + w * Number(first12[i]), 0);
  const rest = sum % 11;
  return rest === 10 ? 1 : rest;
}

/** What a valid CNP says, or null when it is not one (length, checksum, impossible date). */
export function parseCnp(input: string): CnpInfo | null {
  const cnp = input.replace(/\s+/g, '');
  if (!/^[1-9]\d{12}$/.test(cnp)) return null;
  if (cnpChecksum(cnp.slice(0, 12)) !== Number(cnp[12])) return null;
  const s = cnp[0]!;
  const mm = Number(cnp.slice(3, 5));
  const dd = Number(cnp.slice(5, 7));
  const county = Number(cnp.slice(7, 9));
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31 || county < 1 || county > 52) return null;
  const sex = s === '9' ? null : Number(s) % 2 === 1 ? 'm' : 'f';
  const century = CENTURY[s];
  if (century === undefined) return { birthDate: null, sex };
  const year = century + Number(cnp.slice(1, 3));
  const date = new Date(Date.UTC(year, mm - 1, dd));
  if (date.getUTCMonth() !== mm - 1) return null; // e.g. 31 February
  const pad = (n: number) => String(n).padStart(2, '0');
  return { birthDate: `${year}-${pad(mm)}-${pad(dd)}`, sex };
}
