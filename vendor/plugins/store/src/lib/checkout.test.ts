import { describe, expect, it } from 'vitest';
import { chargeLines, priceCart, quote, type SellableVariant } from './checkout';
import { toLocalInput } from './dates';
import { cleanIban, formatIban, nextStatuses, parseCart } from './model';
import type { Zone } from './pricing';

const variant = (over: Partial<SellableVariant> = {}): SellableVariant => ({
  variantId: 1,
  productId: 10,
  productName: 'Mug',
  optionName: 'Blue',
  available: true,
  priceCents: 5000,
  saleCents: null,
  saleFrom: null,
  saleUntil: null,
  stock: null,
  vatRate: null,
  ...over,
});

const now = new Date('2026-11-27T12:00:00Z');

describe('priceCart', () => {
  it('prices lines from the database, with sales and the store’s VAT by default', () => {
    const r = priceCart(
      [
        { variantId: 1, quantity: 2 },
        { variantId: 2, quantity: 1 },
      ],
      [
        variant({
          saleCents: 3990,
          saleFrom: '2026-11-27T00:00:00Z',
          saleUntil: '2026-11-30T00:00:00Z',
        }),
        variant({
          variantId: 2,
          productId: 11,
          productName: 'Book',
          optionName: '',
          priceCents: 4500,
          vatRate: 9,
        }),
      ],
      21,
      now,
    );
    expect(r).toEqual({
      ok: true,
      items: [
        {
          productId: 10,
          variantId: 1,
          name: 'Mug',
          optionName: 'Blue',
          unitCents: 3990,
          vatRate: 21,
          quantity: 2,
        },
        {
          productId: 11,
          variantId: 2,
          name: 'Book',
          optionName: '',
          unitCents: 4500,
          vatRate: 9,
          quantity: 1,
        },
      ],
    });
  });

  it('refuses options that are gone, unpublished or short of stock', () => {
    const r = priceCart(
      [
        { variantId: 1, quantity: 3 },
        { variantId: 2, quantity: 1 },
        { variantId: 3, quantity: 1 },
      ],
      [variant({ stock: 2 }), variant({ variantId: 2, available: false })],
      21,
      now,
    );
    expect(r).toEqual({
      ok: false,
      problems: [
        { kind: 'stock', variantId: 1, left: 2, name: 'Mug (Blue)' },
        { kind: 'gone', variantId: 2 },
        { kind: 'gone', variantId: 3 },
      ],
    });
  });
});

describe('quote', () => {
  const zones: Zone[] = [
    { id: 1, name: 'Romania', countries: ['RO'], rateCents: 1999, freeFromCents: 25000 },
    { id: 2, name: 'EU', countries: ['DE', 'HU'], rateCents: 4500, freeFromCents: null },
  ];
  const items = [
    {
      productId: 10,
      variantId: 1,
      name: 'Mug',
      optionName: '',
      unitCents: 12100,
      vatRate: 21,
      quantity: 1,
    },
  ];

  it('adds the zone’s shipping and the cash on delivery fee', () => {
    const q = quote({
      items,
      zones,
      country: 'RO',
      method: 'cod',
      codFeeCents: 500,
      storeVatRate: 21,
    });
    expect(q.ok && q.totals).toEqual({
      itemsCents: 12100,
      discountCents: 0,
      shippingCents: 1999,
      feeCents: 500,
      totalCents: 14599,
      vatCents: 2100 + 434,
    });
    const card = quote({
      items,
      zones,
      country: 'RO',
      method: 'stripe',
      codFeeCents: 500,
      storeVatRate: 21,
    });
    expect(card.ok && card.totals.feeCents).toBe(0);
  });

  it('ships free above the zone’s amount and refuses countries in no zone', () => {
    const big = [{ ...items[0]!, quantity: 3 }];
    const q = quote({
      items: big,
      zones,
      country: 'RO',
      method: 'bank',
      codFeeCents: 0,
      storeVatRate: 21,
    });
    expect(q.ok && q.totals.shippingCents).toBe(0);
    expect(
      quote({ items, zones, country: 'FR', method: 'bank', codFeeCents: 0, storeVatRate: 21 }),
    ).toEqual({
      ok: false,
      reason: 'country',
    });
  });

  it('charges Stripe the same total, shipping and fee as their own lines', () => {
    const q = quote({
      items,
      zones,
      country: 'RO',
      method: 'cod',
      codFeeCents: 500,
      storeVatRate: 21,
    });
    if (!q.ok) throw new Error('no quote');
    const labels = { shipping: 'Shipping', fee: 'Fee', order: 'Order' };
    const lines = chargeLines(items, q.totals, labels);
    expect(lines.map((l) => l.name)).toEqual(['Mug', 'Shipping', 'Fee']);
    expect(lines.reduce((s, l) => s + l.unitCents * l.quantity, 0)).toBe(q.totals.totalCents);
  });

  const voucher = {
    code: 'SAVE10',
    description: null,
    kind: 'percent' as const,
    percentOff: 10,
    amountCents: null,
    minOrderCents: 10000,
  };

  it('takes a voucher off the products and charges Stripe one line', () => {
    const base = { items, zones, country: 'RO', method: 'bank' as const, codFeeCents: 0 };
    const q = quote({ ...base, storeVatRate: 21, voucher });
    if (!q.ok) throw new Error('no quote');
    expect(q.totals.discountCents).toBe(1210);
    expect(q.totals.totalCents).toBe(12100 - 1210 + 1999);
    const lines = chargeLines(items, q.totals, { shipping: 'S', fee: 'F', order: 'Order 7' });
    expect(lines).toEqual([{ name: 'Order 7', unitCents: q.totals.totalCents, quantity: 1 }]);
    // Below the voucher's minimum: refused, so the buyer is told.
    const small = [{ ...items[0]!, unitCents: 5000 }];
    expect(quote({ ...base, items: small, storeVatRate: 21, voucher })).toEqual({
      ok: false,
      reason: 'voucherMin',
    });
    const free = quote({
      ...base,
      storeVatRate: 21,
      voucher: { ...voucher, kind: 'shipping', percentOff: null, minOrderCents: null },
    });
    expect(free.ok && free.totals.shippingCents).toBe(0);
  });

  it('prices a cart with a running campaign', () => {
    const v: SellableVariant = {
      variantId: 1,
      productId: 10,
      productName: 'Mug',
      optionName: '',
      available: true,
      priceCents: 10000,
      saleCents: null,
      saleFrom: null,
      saleUntil: null,
      stock: null,
      vatRate: null,
      campaignPercent: 25,
    };
    const r = priceCart([{ variantId: 1, quantity: 2 }], [v], 21, new Date());
    expect(r.ok && r.items[0]!.unitCents).toBe(7500);
  });
});

describe('carts, orders and bank details', () => {
  it('reads a cart from the browser only when it makes sense', () => {
    expect(parseCart([{ variantId: 3, quantity: 2 }])).toEqual([{ variantId: 3, quantity: 2 }]);
    expect(parseCart([])).toBeNull();
    expect(parseCart([{ variantId: 3, quantity: 0 }])).toBeNull();
    expect(parseCart([{ variantId: 3, quantity: 100 }])).toBeNull();
    expect(
      parseCart([
        { variantId: 3, quantity: 1 },
        { variantId: 3, quantity: 1 },
      ]),
    ).toBeNull();
    expect(parseCart([{ variantId: '3; DROP', quantity: 1 }])).toBeNull();
    expect(parseCart('nope')).toBeNull();
  });

  it('moves orders only forward; cash on delivery ships before it is paid', () => {
    expect(nextStatuses('awaiting_payment', 'bank')).toEqual(['paid', 'cancelled']);
    expect(nextStatuses('awaiting_payment', 'cod')).toContain('shipped');
    expect(nextStatuses('shipped', 'stripe')).toEqual(['delivered', 'cancelled']);
    expect(nextStatuses('delivered', 'cod')).toEqual([]);
    expect(nextStatuses('cancelled', 'paypal')).toEqual([]);
  });

  it('checks IBANs and writes them in groups of four', () => {
    expect(cleanIban('ro49 aaaa 1b31 0075 9384 0000')).toBe('RO49AAAA1B31007593840000');
    expect(cleanIban('DE89 3704 0044 0532 0130 00')).toBe('DE89370400440532013000');
    expect(cleanIban('DE89 3704 0044 0532 0130 01')).toBeNull();
    expect(formatIban('RO49AAAA1B31007593840000')).toBe('RO49 AAAA 1B31 0075 9384 0000');
  });

  it('shows stored UTC times in the owner’s time zone', () => {
    expect(toLocalInput('2026-11-26T22:00:00.000Z', 'Europe/Bucharest')).toBe('2026-11-27T00:00');
    expect(toLocalInput('2026-07-01T10:30:00.000Z', 'Europe/Budapest')).toBe('2026-07-01T12:30');
    expect(toLocalInput(null, 'UTC')).toBe('');
  });
});
