import { describe, expect, it } from 'vitest';
import { newOrderCode, ORDER_CODE, slugify, trackingLink } from './model';
import {
  orderTotals,
  spreadDiscount,
  parseCents,
  priceNow,
  shippingCents,
  vatPart,
  zoneFor,
  type Zone,
} from './pricing';

describe('prices', () => {
  const v = {
    priceCents: 5000,
    saleCents: 3990,
    saleFrom: '2026-11-01T00:00:00Z',
    saleUntil: '2026-11-08T00:00:00Z',
  };

  it('uses the sale price only inside its window', () => {
    expect(priceNow(v, new Date('2026-10-31T23:59:59Z'))).toEqual({
      cents: 5000,
      regularCents: 5000,
      onSale: false,
      campaign: false,
    });
    expect(priceNow(v, new Date('2026-11-03T12:00:00Z'))).toEqual({
      cents: 3990,
      regularCents: 5000,
      onSale: true,
      campaign: false,
    });
    expect(priceNow(v, new Date('2026-11-08T00:00:00Z')).onSale).toBe(false);
    expect(priceNow({ ...v, saleFrom: null, saleUntil: null }).onSale).toBe(true);
    // A "sale" that is not lower is no sale.
    expect(priceNow({ ...v, saleCents: 6000, saleFrom: null, saleUntil: null }).cents).toBe(5000);
  });

  it('takes the lower of the sale price and a campaign’s percentage', () => {
    const before = new Date('2026-10-01T00:00:00Z');
    expect(priceNow(v, before, 10)).toEqual({
      cents: 4500,
      regularCents: 5000,
      onSale: true,
      campaign: true,
    });
    // Inside the sale window 3990 is lower than 4500.
    expect(priceNow(v, new Date('2026-11-03T12:00:00Z'), 10)).toMatchObject({
      cents: 3990,
      campaign: false,
    });
    expect(priceNow(v, before, 30).cents).toBe(3500);
    // Nonsense percentages are ignored.
    expect(priceNow(v, before, 0).cents).toBe(5000);
    expect(priceNow(v, before, 100).cents).toBe(5000);
  });

  it('finds the VAT inside gross prices', () => {
    expect(vatPart(11900, 19)).toBe(1900);
    expect(vatPart(12100, 21)).toBe(2100);
    expect(vatPart(1000, 0)).toBe(0);
  });

  it('reads amounts in cents exactly', () => {
    expect(parseCents('12,5')).toBe(1250);
    expect(parseCents('0.10')).toBe(10);
    expect(parseCents(19.99)).toBe(1999);
    expect(parseCents('1.999')).toBeNull();
    expect(parseCents('-1')).toBeNull();
  });
});

describe('shipping and totals', () => {
  const zones: Zone[] = [
    { id: 1, name: 'Romania', countries: ['RO'], rateCents: 1500, freeFromCents: 20000 },
    { id: 2, name: 'Rest of the world', countries: ['*'], rateCents: 4500, freeFromCents: null },
  ];

  it('picks the zone of the country, else the catch-all', () => {
    expect(zoneFor(zones, 'ro')?.id).toBe(1);
    expect(zoneFor(zones, 'DE')?.id).toBe(2);
    expect(zoneFor([zones[0]!], 'DE')).toBeNull();
  });

  it('ships free from the threshold', () => {
    expect(shippingCents(zones[0]!, 19999)).toBe(1500);
    expect(shippingCents(zones[0]!, 20000)).toBe(0);
    expect(shippingCents(zones[1]!, 1_000_000)).toBe(4500);
  });

  it('adds up lines, shipping and fees, with the VAT inside', () => {
    const t = orderTotals(
      [
        { unitCents: 11900, quantity: 2, vatRate: 19 },
        { unitCents: 1050, quantity: 1, vatRate: 9 },
      ],
      1190,
      500,
      19,
    );
    expect(t).toEqual({
      itemsCents: 24850,
      discountCents: 0,
      shippingCents: 1190,
      feeCents: 500,
      totalCents: 26540,
      // 3800 + 87 (9 % of 1050 gross) + 270 (19 % of 1690 gross)
      vatCents: 4157,
    });
  });

  it('spreads a discount over the lines and counts the VAT on what is paid', () => {
    expect(spreadDiscount([3000, 1000], 400)).toEqual([300, 100]);
    expect(spreadDiscount([1000, 1000, 1000], 100)).toEqual([33, 33, 34]);
    expect(spreadDiscount([500], 900)).toEqual([500]);
    const t = orderTotals([{ unitCents: 12100, quantity: 1, vatRate: 21 }], 0, 0, 21, 2420);
    expect(t.discountCents).toBe(2420);
    expect(t.totalCents).toBe(9680);
    expect(t.vatCents).toBe(1680);
    // Never more than the products.
    expect(
      orderTotals([{ unitCents: 1000, quantity: 1, vatRate: 0 }], 500, 0, 0, 5000),
    ).toMatchObject({ discountCents: 1000, totalCents: 500 });
  });
});

describe('codes, slugs and tracking', () => {
  it('makes order codes without look-alikes', () => {
    let n = 7;
    const code = newOrderCode((max) => (n = (n * 31 + 11) % max));
    expect(code).toMatch(ORDER_CODE);
    expect(code).not.toMatch(/[IlOo01]/);
  });

  it('slugs names in any of the four languages', () => {
    expect(slugify('Cămașă albă, mărimea M!')).toBe('camasa-alba-marimea-m');
    expect(slugify('Größe XL – Straße')).toBe('grosse-xl-strasse');
    expect(slugify('Kék bögre ⭐')).toBe('kek-bogre');
    expect(slugify('a'.repeat(100), 10)).toBe('aaaaaaaaaa');
  });

  it('links to the courier’s tracking page', () => {
    expect(trackingLink('fan', '2345 678', null)).toBe(
      'https://www.fancourier.ro/awb-tracking/?tracking=2345%20678',
    );
    expect(trackingLink('other', '', 'https://track.example.com/x')).toBe(
      'https://track.example.com/x',
    );
    expect(trackingLink('other', '', 'javascript:alert(1)')).toBeNull();
  });
});
