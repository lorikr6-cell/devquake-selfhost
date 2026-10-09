// Picking the meter index out of text read from a photo of a meter (OCR in the browser,
// components/meter-ocr.ts). Pure and unit-tested. A best effort: when nothing fits, the person
// types the index themselves.

/** Numbers in the OCR text that could be a meter index (at least 3 digits). */
export function meterCandidates(text: string): number[] {
  const found = new Set<number>();
  const clean = text.replace(/[oO]/g, '0').replace(/[lI|]/g, '1');
  // Plain tokens: "012345", "12345.6", "12345,67"
  for (const m of clean.matchAll(/\d+(?:[.,]\d{1,3})?/g)) {
    const digits = m[0].replace(/\D/g, '');
    if (digits.length < 3) continue;
    found.add(Number(m[0].replace(',', '.')));
  }
  // Drum digits read with gaps: "0 1 2 3 4" or "0123 45"
  for (const m of clean.matchAll(/\d(?:[ \t]\d+)+/g)) {
    const digits = m[0].replace(/\s/g, '');
    if (digits.length >= 4 && digits.length <= 9) found.add(Number(digits));
  }
  return [...found].filter((n) => Number.isFinite(n));
}

/**
 * The most likely index: with a previous reading, the smallest candidate that is not below it
 * (meters only go up) and not implausibly far above it; otherwise the candidate with the most
 * digits. Null when nothing fits.
 */
export function pickMeterIndex(text: string, previous: number | null): number | null {
  const candidates = meterCandidates(text);
  if (candidates.length === 0) return null;
  if (previous !== null) {
    const limit = Math.max(previous * 3, previous + 100_000);
    const fitting = candidates.filter((n) => n >= previous && n <= limit);
    if (fitting.length === 0) return null;
    return fitting.sort((a, b) => a - previous - (b - previous))[0]!;
  }
  const digits = (n: number) => String(Math.trunc(n)).length;
  return candidates.sort((a, b) => digits(b) - digits(a) || b - a)[0]!;
}

/** Consumption between two indexes, rounded to 3 decimals; null when it would be negative. */
export function consumptionBetween(previous: number, current: number): number | null {
  const value = Math.round((current - previous) * 1000) / 1000;
  return value < 0 ? null : value;
}
