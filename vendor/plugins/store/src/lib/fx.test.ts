import { describe, expect, it } from 'vitest';
import { approxText, chosenCurrency, convertCents, ecbDate, parseEcbRates } from './fx';

const XML = `<?xml version="1.0" encoding="UTF-8"?>
<gesmes:Envelope><Cube><Cube time='2026-10-09'>
<Cube currency='USD' rate='1.0800'/><Cube currency='RON' rate='4.9750'/>
<Cube currency='HUF' rate='395.20'/><Cube currency='BAD' rate='x'/>
</Cube></Cube></gesmes:Envelope>`;

describe('ECB rates', () => {
  it('reads the rates and the date', () => {
    expect(parseEcbRates(XML)).toEqual({ EUR: 1, USD: 1.08, RON: 4.975, HUF: 395.2 });
    expect(ecbDate(XML)).toBe('2026-10-09');
    expect(parseEcbRates('<html>maintenance</html>')).toBeNull();
  });

  it('converts through the euro', () => {
    const rates = parseEcbRates(XML)!;
    expect(convertCents(1000, 'EUR', 'RON', rates)).toBe(4975);
    expect(convertCents(4975, 'RON', 'EUR', rates)).toBe(1000);
    expect(convertCents(1000, 'USD', 'HUF', rates)).toBe(365926);
    expect(convertCents(1000, 'EUR', 'EUR', rates)).toBe(1000);
    expect(convertCents(1000, 'EUR', 'JPY', rates)).toBeNull();
  });
});

describe('chosenCurrency', () => {
  it('uses the pick, else the language, else the shop', () => {
    expect(chosenCurrency('USD', 'ro', 'EUR')).toBe('USD');
    expect(chosenCurrency('base', 'ro', 'EUR')).toBe('EUR');
    expect(chosenCurrency(undefined, 'ro', 'EUR')).toBe('RON');
    expect(chosenCurrency(undefined, 'hu', 'EUR')).toBe('HUF');
    expect(chosenCurrency(undefined, 'de', 'EUR')).toBe('EUR');
    expect(chosenCurrency('JPY', 'en', 'EUR')).toBe('EUR');
  });
});

describe('approxText', () => {
  it('shows an approximate price only in another currency', () => {
    expect(approxText(2250, { base: 'EUR', code: 'USD', factor: 1.08 }, 'en-US')).toBe('≈ $24.30');
    expect(approxText(2250, { base: 'EUR', code: 'EUR', factor: 1 }, 'en-US')).toBeNull();
    expect(approxText(2250, null, 'en-US')).toBeNull();
  });
});
