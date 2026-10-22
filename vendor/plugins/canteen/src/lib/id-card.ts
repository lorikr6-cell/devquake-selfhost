import { parseCnp } from './cnp';

// Reads a Romanian identity card from the text OCR found on its picture (lib only: the OCR runs
// in the browser, components/id-reader.tsx). Everything is a proposal the organiser checks; a
// field is left out when it cannot be read with confidence (the CNP must pass its checksum).

export interface IdCardFields {
  lastName: string | null;
  firstName: string | null;
  cnp: string | null;
  birthDate: string | null;
  idSeries: string | null;
  idNumber: string | null;
  address: string | null;
}

/** Letters OCR often reads instead of digits, in places where only digits belong. */
const DIGITISH: Record<string, string> = {
  O: '0',
  Q: '0',
  D: '0',
  I: '1',
  L: '1',
  Z: '2',
  S: '5',
  B: '8',
};
const digits = (s: string) => s.replace(/[OQDILZSB]/g, (c) => DIGITISH[c] ?? c);

/** The first 13-digit run (spaces allowed between digits) that is a valid CNP. */
function findCnp(text: string): string | null {
  const upper = text.toUpperCase();
  for (const m of upper.matchAll(/[1-9OQDILZSB](?:[ ]?[0-9OQDILZSB]){12}/g)) {
    const candidate = digits(m[0].replace(/ /g, ''));
    if (parseCnp(candidate)) return candidate;
  }
  return null;
}

const nameCase = (s: string) =>
  s
    .toLowerCase()
    .replace(/(^|[\s-])\p{L}/gu, (c) => c.toUpperCase())
    .trim();

/** The machine-readable zone: names (line 1), series and number (line 2). */
function readMrz(text: string) {
  const lines = text
    .toUpperCase()
    .replace(/[«‹]/g, '<')
    .split('\n')
    .map((l) => l.replace(/\s+/g, ''))
    .filter((l) => l.includes('<<'));
  let lastName: string | null = null;
  let firstName: string | null = null;
  let idSeries: string | null = null;
  let idNumber: string | null = null;
  for (const line of lines) {
    const names = /^I[DO]ROU([A-Z<]+)$/.exec(line);
    if (names) {
      const [last, given] = names[1]!.split('<<');
      if (last) lastName = nameCase(last.replace(/</g, ' '));
      if (given) firstName = nameCase(given.replace(/</g, ' '));
      continue;
    }
    const doc = /^([A-Z]{2})([0-9OQDILZSB]{6})<?[0-9OQDILZSB<]?ROU/.exec(line);
    if (doc) {
      idSeries = doc[1]!;
      idNumber = digits(doc[2]!);
    }
  }
  return { lastName, firstName, idSeries, idNumber };
}

/** The series and number printed on the front: "SERIA XV NR 123456". */
function readFrontNumber(text: string) {
  const m = /SERIA\s*([A-Z]{2})\s*N[RO]\.?\s*([0-9OQDILZSB]{6})/i.exec(text);
  return m ? { idSeries: m[1]!.toUpperCase(), idNumber: digits(m[2]!.toUpperCase()) } : null;
}

const LABEL = /^(DOMICILIU|ADRESSE|ADDRESS)\b/i;
const NEXT_LABEL = /(EMIS|EMISĂ|ISSUED|DELIVR|VALABILITATE|VALIDIT|SPCLEP|SEX|LOC NA)/i;

/** The address: the lines after "Domiciliu / Adresse / Address" until the next label. */
function readAddress(text: string): string | null {
  const lines = text.split('\n').map((l) => l.trim());
  const at = lines.findIndex((l) => LABEL.test(l.replace(/[^\p{L}\s/]/gu, '').trim()));
  if (at < 0) return null;
  const parts: string[] = [];
  // The label line may carry the start of the address after the labels.
  const rest = lines[at]!.replace(/(DOMICILIU|ADRESSE|ADDRESS)[\s/:.]*/gi, '').trim();
  if (rest.length > 3) parts.push(rest);
  for (const line of lines.slice(at + 1, at + 4)) {
    if (!line) continue;
    if (NEXT_LABEL.test(line)) break;
    parts.push(line);
  }
  const address = parts.join(', ').replace(/\s+/g, ' ').trim();
  return address.length >= 6 ? address.slice(0, 255) : null;
}

export function readIdCard(text: string): IdCardFields {
  const mrz = readMrz(text);
  const front = readFrontNumber(text);
  const cnp = findCnp(text);
  return {
    lastName: mrz.lastName,
    firstName: mrz.firstName,
    cnp,
    birthDate: cnp ? (parseCnp(cnp)?.birthDate ?? null) : null,
    idSeries: mrz.idSeries ?? front?.idSeries ?? null,
    idNumber: mrz.idNumber ?? front?.idNumber ?? null,
    address: readAddress(text),
  };
}
