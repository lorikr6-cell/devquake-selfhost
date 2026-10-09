import { describe, expect, it } from 'vitest';
import {
  detectDecimalSeparator,
  extractBillFields,
  hasAnyField,
  parseLocaleNumber,
} from './pdf-fields';

describe('parseLocaleNumber', () => {
  it('reads both decimal separators and thousands separators', () => {
    expect(parseLocaleNumber('1.234,56')).toBe(1234.56);
    expect(parseLocaleNumber('1,234.56')).toBe(1234.56);
    expect(parseLocaleNumber('1 234,56')).toBe(1234.56);
    expect(parseLocaleNumber('123,45')).toBe(123.45);
    expect(parseLocaleNumber('0,8734')).toBe(0.8734);
    expect(parseLocaleNumber('1.234.567')).toBe(1234567);
  });

  it('reads three digits after one separator by the decimal separator of the document', () => {
    expect(parseLocaleNumber('1.234')).toBe(1234);
    expect(parseLocaleNumber('1.234', ',')).toBe(1234);
    expect(parseLocaleNumber('245,000', ',')).toBe(245);
    expect(parseLocaleNumber('12.345', '.')).toBe(12.345);
  });

  it('detects the decimal separator from two-decimal amounts', () => {
    expect(detectDecimalSeparator('Total 254,63 lei, TVA 40,65')).toBe(',');
    expect(detectDecimalSeparator('Total 53.55 USD')).toBe('.');
    expect(detectDecimalSeparator('no amounts')).toBeUndefined();
  });

  it('rejects text', () => {
    expect(parseLocaleNumber('abc')).toBeNull();
  });
});

describe('extractBillFields', () => {
  it('reads a Romanian electricity bill', () => {
    const text = `ENEL Energie Muntenia
      Factura fiscală nr. 123456 din 05.09.2026
      Perioada de facturare: 01.08.2026 - 31.08.2026
      Energie activă    Cantitate 245,000 kWh   Preț unitar 0,8734 lei/kWh   Valoare 213,98
      Total factură curentă 254,63 lei
      Total de plată: 254,63 lei
      Data scadentă: 25.09.2026`;
    expect(extractBillFields(text)).toEqual({
      total: 254.63,
      consumption: 245,
      unit: 'kWh',
      unitPrice: 0.8734,
      dueOn: '2026-09-25',
    });
  });

  it('reads a German gas bill with the amount on the next line', () => {
    const text = `Stadtwerke
      Ihr Verbrauch im Abrechnungszeitraum: 1.250 m³
      Arbeitspreis 12,5 ct/kWh
      Rechnungsbetrag
      1.234,56 €
      Fällig am 15.10.2026`;
    const fields = extractBillFields(text);
    expect(fields.total).toBe(1234.56);
    expect(fields.consumption).toBe(1250); // German: "1.250" is thousands
    expect(fields.unit).toBe('m³');
    expect(fields.unitPrice).toBe(0.125);
    expect(fields.dueOn).toBe('2026-10-15');
  });

  it('reads a Hungarian water bill', () => {
    const text = `Vízmű Zrt.
      Fogyasztás: 12 m3
      Egységár: 450,5 Ft
      Fizetendő összeg: 6 124 Ft
      Fizetési határidő: 2026.10.10.`;
    const fields = extractBillFields(text);
    expect(fields.total).toBe(6124);
    expect(fields.consumption).toBe(12);
    expect(fields.unit).toBe('m³');
    expect(fields.unitPrice).toBe(450.5);
    expect(fields.dueOn).toBe('2026-10-10');
  });

  it('reads an English subscription invoice without consumption', () => {
    const text = `Microsoft Invoice
      Invoice date 01/09/2026
      Subtotal 45.00
      Tax 8.55
      Total amount due USD 53.55
      Due date: 2026-09-30`;
    const fields = extractBillFields(text);
    expect(fields.total).toBe(53.55);
    expect(fields.consumption).toBeNull();
    expect(fields.unitPrice).toBeNull();
    expect(fields.dueOn).toBe('2026-09-30');
    expect(hasAnyField(fields)).toBe(true);
  });

  it('returns nothing for text without bill data (e.g. a scanned PDF)', () => {
    const fields = extractBillFields('');
    expect(fields).toEqual({
      total: null,
      consumption: null,
      unit: null,
      unitPrice: null,
      dueOn: null,
    });
    expect(hasAnyField(fields)).toBe(false);
  });
});
