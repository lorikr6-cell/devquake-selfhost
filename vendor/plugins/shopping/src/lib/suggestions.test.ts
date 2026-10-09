import { describe, expect, it } from 'vitest';
import { sniffPhoto } from './photos';
import {
  buildSuggestions,
  fold,
  matchSuggestions,
  usualProducts,
  type SuggestionRow,
} from './suggestions';

let id = 1;
const row = (over: Partial<SuggestionRow>): SuggestionRow => ({
  itemId: id++,
  listId: 1,
  shopDate: '2026-09-01',
  name: 'Milk',
  unit: 'l',
  quantity: null,
  price: null,
  description: null,
  storeName: null,
  storeType: null,
  storeLocation: null,
  storeDescription: null,
  photo: null,
  ...over,
});

const rows = [
  row({
    shopDate: '2026-09-01',
    price: 6.99,
    photo: '/api/lists/1/items/1/photo?v=1',
    storeName: 'Kaufland',
    storeType: 'grocery',
  }),
  row({ shopDate: '2026-09-10', name: 'milk', price: null, quantity: 2, description: '1.5%' }),
  row({ shopDate: '2026-09-05', name: 'Pâine albă', unit: 'pcs', price: 4.5 }),
  row({ shopDate: '2026-09-06', name: 'Pâine albă', unit: 'pcs', price: 4.2 }),
  row({ shopDate: '2026-09-07', name: 'Screws', unit: 'pack', price: 10 }),
  row({ shopDate: '2026-09-08', name: 'Milk', unit: 'kg', price: 20 }), // other unit = other product
];

describe('buildSuggestions', () => {
  const all = buildSuggestions(rows);

  it('merges a product across lists, keeping the newest known values', () => {
    const milk = all.find((s) => fold(s.name) === 'milk' && s.unit === 'l')!;
    expect(milk).toMatchObject({
      name: 'milk',
      times: 2,
      quantity: 2,
      description: '1.5%',
      price: 6.99, // newest known price
      lastDate: '2026-09-10',
      store: { name: 'Kaufland', type: 'grocery', location: null, description: null },
    });
    expect(milk.photoItemId).toBe(rows[0]!.itemId);
  });

  it('orders by how often the product was bought', () => {
    expect(all.map((s) => `${s.name}/${s.unit}`).slice(0, 2)).toEqual(['milk/l', 'Pâine albă/pcs']);
    expect(all).toHaveLength(4);
  });

  it('matches what the user types, ignoring case and accents', () => {
    expect(matchSuggestions(all, 'pai').map((s) => s.name)).toEqual(['Pâine albă']);
    expect(matchSuggestions(all, 'alb').map((s) => s.name)).toEqual(['Pâine albă']); // word start
    expect(matchSuggestions(all, 'rew').map((s) => s.name)).toEqual(['Screws']); // inside
    expect(matchSuggestions(all, 'MI')).toHaveLength(2);
    expect(matchSuggestions(all, '  ')).toEqual([]);
  });

  it('offers frequent products that are not on the list yet', () => {
    expect(usualProducts(all, []).map((s) => s.name)).toEqual(['milk', 'Pâine albă']);
    expect(usualProducts(all, [{ name: 'MILK', unit: 'L' }]).map((s) => s.name)).toEqual([
      'Pâine albă',
    ]);
  });
});

describe('sniffPhoto', () => {
  const bytes = (...b: number[]) => new Uint8Array([...b, ...new Array(12).fill(0)]);
  it('recognises JPEG, PNG and WebP by their first bytes only', () => {
    expect(sniffPhoto(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe('image/jpeg');
    expect(sniffPhoto(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))).toBe('image/png');
    const webp = new TextEncoder().encode('RIFF0000WEBPVP8 ');
    expect(sniffPhoto(webp)).toBe('image/webp');
    expect(
      sniffPhoto(new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg">')),
    ).toBeNull();
    expect(sniffPhoto(new Uint8Array(3))).toBeNull();
  });
});
