import { describe, expect, it } from 'vitest';
import {
  favoriteOwner,
  favoriteView,
  type FavoriteProductNow,
  type SavedFavorite,
} from './favorites';
import { can, canManageCustomers } from './roles';
import { CUSTOMER_KEY } from './customers-data';

const saved: SavedFavorite = {
  id: 1,
  productId: 7,
  name: 'Mug',
  slug: 'mug',
  priceCents: 2000,
  addedAt: '2026-10-01T10:00:00.000Z',
};
const now = (over: Partial<FavoriteProductNow> = {}): FavoriteProductNow => ({
  name: 'Quake mug',
  slug: 'quake-mug',
  published: true,
  interest: false,
  fromCents: 1500,
  stock: null,
  photoId: 3,
  ...over,
});

describe('favourites (ADR 0064)', () => {
  it('shows today’s price, the difference and the current name', () => {
    expect(favoriteView(saved, now())).toMatchObject({
      state: 'available',
      name: 'Quake mug',
      slug: 'quake-mug',
      nowCents: 1500,
      diffCents: -500,
    });
    expect(favoriteView(saved, now({ fromCents: 2300 })).diffCents).toBe(300);
    expect(favoriteView(saved, now({ fromCents: 2000 })).diffCents).toBe(0);
  });

  it('strikes through what cannot be bought any more', () => {
    expect(favoriteView(saved, now({ stock: 0 })).state).toBe('soldOut');
    for (const gone of [null, now({ published: false }), now({ interest: true })]) {
      const view = favoriteView(saved, gone);
      expect(view.state).toBe('gone');
      expect(view.nowCents).toBeNull();
      expect(view.diffCents).toBeNull();
      expect(view.name).toBe('Mug');
    }
  });

  it('belongs to the DevQuake member first, else the shop’s buyer', () => {
    expect(favoriteOwner(5, 9)).toBe('u5');
    expect(favoriteOwner(null, 9)).toBe('b9');
    expect(favoriteOwner(undefined, undefined)).toBeNull();
  });
});

describe('customers (ADR 0064)', () => {
  it('opens for owners, managers and support; managing for owners and managers', () => {
    expect(can('owner', 'customers')).toBe(true);
    expect(can(['manager'], 'customers')).toBe(true);
    expect(can(['support'], 'customers')).toBe(true);
    expect(can(['catalog', 'shipping'], 'customers')).toBe(false);
    expect(canManageCustomers(['support'])).toBe(false);
    expect(canManageCustomers(['support', 'manager'])).toBe(true);
    expect(canManageCustomers(['owner'])).toBe(true);
  });

  it('accepts only buyer and member keys', () => {
    for (const ok of ['b1', 'u42']) expect(CUSTOMER_KEY.test(ok)).toBe(true);
    for (const bad of ['b0', 'x1', 'b', 'u1;', 'b01', 'b12345678901']) {
      expect(CUSTOMER_KEY.test(bad)).toBe(false);
    }
  });
});
