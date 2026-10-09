import { describe, expect, it } from 'vitest';
import { HttpError } from './http';
import {
  currency,
  id,
  itemInput,
  optionalText,
  price,
  quantity,
  shopDate,
  storeInput,
} from './validate';

const status = (fn: () => unknown) => {
  try {
    fn();
  } catch (err) {
    return err instanceof HttpError ? err.status : 'other';
  }
  return null;
};

describe('text', () => {
  it('trims, collapses whitespace and limits the length', () => {
    expect(optionalText('  two   words ', 'x', 20)).toBe('two words');
    expect(optionalText('   ', 'x', 20)).toBeNull();
    expect(status(() => optionalText('abcdef', 'x', 5))).toBe(400);
    expect(status(() => optionalText(5, 'x', 5))).toBe(400);
  });
});

describe('numbers', () => {
  it('accepts comma or dot decimals', () => {
    expect(price('4,50')).toBe(4.5);
    expect(price(' 12.499 ')).toBe(12.5);
    expect(price('')).toBeNull();
    expect(quantity(undefined)).toBeNull();
    expect(quantity('')).toBeNull();
    expect(quantity('0,25')).toBe(0.25);
  });

  it('rejects negative, zero and non-numeric values', () => {
    expect(status(() => price('-1'))).toBe(400);
    expect(status(() => price('abc'))).toBe(400);
    expect(status(() => quantity('0'))).toBe(400);
    expect(status(() => quantity(Number.POSITIVE_INFINITY))).toBe(400);
  });

  it('only accepts positive integer ids (404 otherwise)', () => {
    expect(id('42')).toBe(42);
    expect(status(() => id('4.2'))).toBe(404);
    expect(status(() => id('-1'))).toBe(404);
    expect(status(() => id('1; DROP TABLE'))).toBe(404);
  });

  it('knows the supported currencies', () => {
    expect(currency(undefined)).toBe('RON');
    expect(currency('EUR')).toBe('EUR');
    expect(status(() => currency('BTC'))).toBe(400);
  });
});

describe('storeInput', () => {
  it('fills the type in from the store name when none is given', () => {
    expect(storeInput({ name: 'Dedeman', location: 'Cluj' })).toEqual({
      name: 'Dedeman',
      type: 'hardware_diy',
      location: 'Cluj',
      description: null,
      brand: { name: null, wikidata: null, website: null },
    });
    expect(storeInput({ name: 'Corner shop' }).type).toBe('other');
  });

  it('keeps OpenStreetMap brand hints for the logo only when they are valid', () => {
    expect(
      storeInput({
        name: 'Lidl Mărăști',
        brand: 'Lidl',
        wikidata: 'Q151954',
        website: 'https://www.lidl.ro',
      }).brand,
    ).toEqual({ name: 'Lidl', wikidata: 'Q151954', website: 'https://www.lidl.ro' });
    expect(
      storeInput({ name: 'X', wikidata: 'Q1; DROP', website: 'javascript:alert(1)' }).brand,
    ).toEqual({ name: null, wikidata: null, website: null });
  });

  it('keeps an explicit type and rejects unknown ones', () => {
    expect(storeInput({ name: 'Kaufland', type: 'convenience' }).type).toBe('convenience');
    expect(status(() => storeInput({ name: 'Kaufland', type: 'casino' }))).toBe(400);
    expect(status(() => storeInput({ name: ' ' }))).toBe(400);
  });
});

describe('itemInput', () => {
  it('parses a full item', () => {
    expect(
      itemInput({ name: 'Milk', quantity: '2', unit: 'l', price: '7,99', storeId: '3' }),
    ).toEqual({
      name: 'Milk',
      quantity: 2,
      unit: 'l',
      price: 7.99,
      description: null,
      storeId: 3,
    });
  });

  it('requires a name and a unit, but not a quantity', () => {
    expect(status(() => itemInput({ quantity: 1, unit: 'kg' }))).toBe(400);
    expect(status(() => itemInput({ name: 'Milk' }))).toBe(400);
    expect(itemInput({ name: 'Milk', unit: 'l' }).quantity).toBeNull();
  });
});

describe('shopDate', () => {
  it('accepts real days only', () => {
    expect(shopDate('2026-09-24')).toBe('2026-09-24');
    expect(status(() => shopDate('2026-02-30'))).toBe(400);
    expect(status(() => shopDate(undefined))).toBe(400);
  });
});
