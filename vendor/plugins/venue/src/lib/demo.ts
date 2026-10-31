// The demo venue (owner's request): a sample café beside the owner's own venue, filled through
// the app's own functions with every feature, so the owner (or a trial) can try everything
// without touching the real venue. One per owner; deleting it removes everything in it.

import type { PluginDatabase as Db } from '@devquake/plugin-sdk';
import { PAYMENTS } from './bill';
import { answerCall, raiseHand, setSection } from './calls';
import {
  addCategory,
  addItem,
  addStaff,
  createVenue,
  listStaff,
  menuOf,
  setOwnerView,
  updateVenue,
  venuesOfOwner,
  type Venue,
} from './data';
import { addDays, type IsoDate } from './dates';
import { saveDesign, DEFAULT_DESIGN } from './design';
import {
  addLine,
  addTable,
  finalizeBill,
  listTables,
  openBill,
  setDelivered,
  setTip,
} from './floor';
import { checkOrder, placeOrder } from './guest-orders';
import { allergenMask, type Station } from './model';
import { markReady } from './station';
import { changeStock, ingredientsOf, saveIngredient, saveRecipe, type Unit } from './stock';

/** The demo's PINs: anyone trying it may switch in as these (shown on the demo's notice). */
export const DEMO_PINS: Record<string, string> = {
  Anna: '2580',
  Marco: '3691',
  Lena: '4702',
  Tomás: '5813',
  Sofia: '6924',
};

type ItemSeed = [
  category: string,
  name: string,
  description: string,
  price: number,
  vat: number,
  station: Station,
  allergens: string[],
];

const ITEMS: ItemSeed[] = [
  ['Coffee', 'Espresso', 'Single origin, Brazil', 290, 1000, 'coffee', []],
  ['Coffee', 'Cappuccino', 'Espresso, steamed milk and foam', 420, 1000, 'coffee', ['milk']],
  ['Coffee', 'Flat white', 'Double ristretto with velvety milk', 460, 1000, 'coffee', ['milk']],
  ['Coffee', 'Oat latte', 'Espresso with oat drink', 490, 1000, 'coffee', ['gluten']],
  [
    'Breakfast',
    'Avocado toast',
    'Sourdough, avocado, lime, chilli, poached egg',
    1150,
    1000,
    'kitchen',
    ['gluten', 'eggs'],
  ],
  [
    'Breakfast',
    'Granola bowl',
    'Yoghurt, house granola, berries, honey',
    890,
    1000,
    'kitchen',
    ['milk', 'nuts', 'gluten'],
  ],
  [
    'Breakfast',
    'Shakshuka',
    'Eggs baked in tomato and pepper, bread',
    1290,
    1000,
    'kitchen',
    ['eggs', 'gluten'],
  ],
  ['Cakes', 'Cheesecake', 'Baked New York style', 540, 1000, 'none', ['milk', 'eggs', 'gluten']],
  [
    'Cakes',
    'Carrot cake',
    'With cream cheese frosting',
    520,
    1000,
    'none',
    ['milk', 'eggs', 'gluten', 'nuts'],
  ],
  ['Drinks', 'Fresh orange juice', '0.3 l', 480, 2000, 'bar', []],
  ['Drinks', 'Homemade lemonade', 'Lemon, mint, a little cane sugar', 450, 2000, 'bar', []],
  ['Drinks', 'Sparkling water', '0.5 l', 350, 2000, 'bar', []],
];

/** [name, unit, daily level, weekly level, on hand at the end]: oat drink runs short on purpose. */
const INGREDIENTS: [string, Unit, number, number, number][] = [
  ['Coffee beans', 'kg', 3, 15, 6.4],
  ['Whole milk', 'l', 12, 70, 18],
  ['Oat drink', 'l', 4, 20, 0.1],
  ['Sourdough loaves', 'pcs', 6, 30, 5],
  ['Avocados', 'pcs', 10, 50, 14],
  ['Eggs', 'pcs', 30, 180, 42],
  ['Oranges', 'kg', 5, 25, 9.5],
  ['Lemons', 'kg', 2, 10, 3],
];

/** What one of an item uses. */
const RECIPES: Record<string, [string, number][]> = {
  Espresso: [['Coffee beans', 0.018]],
  Cappuccino: [
    ['Coffee beans', 0.018],
    ['Whole milk', 0.15],
  ],
  'Flat white': [
    ['Coffee beans', 0.036],
    ['Whole milk', 0.12],
  ],
  'Oat latte': [
    ['Coffee beans', 0.018],
    ['Oat drink', 0.2],
  ],
  'Avocado toast': [
    ['Sourdough loaves', 0.1],
    ['Avocados', 1],
    ['Eggs', 1],
  ],
  Shakshuka: [
    ['Eggs', 3],
    ['Sourdough loaves', 0.1],
  ],
  'Fresh orange juice': [['Oranges', 0.5]],
  'Homemade lemonade': [['Lemons', 0.15]],
};

const TABLES: [string, number, string | null][] = [
  ['Table 1', 2, 'Anna'],
  ['Table 2', 2, 'Anna'],
  ['Table 3', 4, 'Anna'],
  ['Table 4', 4, 'Marco'],
  ['Table 5', 6, 'Marco'],
  ['Window bar', 4, 'Marco'],
  ['Terrace 1', 4, null],
  ['Terrace 2', 4, null],
];

/** A small number generator with a seed, so every demo looks the same. */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
}

/**
 * The owner's demo venue, made once (asking again opens it), and the owner switched into it.
 * `today` is the venue's calendar day (the owner's time zone).
 */
export async function createDemoVenue(
  db: Db,
  user: { id: number; displayName: string },
  today: IsoDate,
): Promise<Venue> {
  const existing = (await venuesOfOwner(db, user.id)).demo;
  if (existing) {
    await setOwnerView(db, user.id, true);
    return existing;
  }
  const input = {
    name: 'Demo · Café Lumen',
    country: 'AT',
    currency: 'EUR',
    vatRates: [2000, 1000],
    decimals: 2,
  };
  const venue = await createVenue(db, user.id, input, true);
  await updateVenue(db, venue.id, input, true);
  const me = user.displayName;
  const random = seeded(venue.id);

  // The menu.
  const categories = new Map<string, number>();
  for (const name of ['Coffee', 'Breakfast', 'Cakes', 'Drinks']) {
    categories.set(name, await addCategory(db, venue.id, name));
  }
  const items = new Map<string, { id: number; price: number }>();
  for (const [category, name, description, price, vat, station, allergens] of ITEMS) {
    const id = await addItem(db, venue.id, {
      categoryId: categories.get(category)!,
      name,
      description,
      priceMinor: price,
      vatRate: vat,
      station,
      allergens: allergenMask(allergens),
      // One dish is off the menu today, to show the switch.
      available: name !== 'Shakshuka',
    });
    if (id) items.set(name, { id, price });
  }
  await saveDesign(db, venue.id, {
    ...DEFAULT_DESIGN,
    title: 'Café Lumen',
    subtitle: 'Breakfast · Coffee · Cakes',
    columns: 2,
  });

  // Staff with PINs, and the tables with their waiters' sections.
  for (const [name, role] of [
    ['Anna', 'waiter'],
    ['Marco', 'waiter'],
    ['Lena', 'manager'],
    ['Tomás', 'kitchen'],
    ['Sofia', 'bar'],
  ] as const) {
    await addStaff(db, venue.id, name, role, DEMO_PINS[name]!);
  }
  const staff = new Map((await listStaff(db, venue.id)).map((s) => [s.name, s.id]));
  for (const [name, seats] of TABLES) await addTable(db, venue.id, name, seats);
  const tables = await listTables(db, venue.id);
  for (const [name, , waiter] of TABLES) {
    const t = tables.find((x) => x.name === name);
    if (t && waiter) await setSection(db, venue.id, t.id, staff.get(waiter) ?? null);
  }
  const tableId = (name: string) => tables.find((t) => t.name === name)!.id;
  const waiterOf = (name: string) => {
    const w = TABLES.find((t) => t[0] === name)?.[2];
    return w ? { id: staff.get(w)!, name: w } : null;
  };

  // Stock and recipes.
  for (const [name, unit, daily, weekly] of INGREDIENTS) {
    await saveIngredient(db, venue.id, null, {
      name,
      unit,
      dailyTarget: daily,
      weeklyTarget: weekly,
    });
  }
  const ingredients = new Map((await ingredientsOf(db, venue.id)).map((i) => [i.name, i.id]));
  for (const [item, lines] of Object.entries(RECIPES)) {
    const id = items.get(item)?.id;
    if (!id) continue;
    await saveRecipe(
      db,
      venue.id,
      id,
      lines.map(([ingredient, qty]) => ({ ingredientId: ingredients.get(ingredient)!, qty })),
    );
  }

  // Three weeks of paid bills, for the reports (before the counts, which set the stock).
  const sold = [...items.entries()].filter(([name]) => name !== 'Shakshuka');
  for (let back = 21; back >= 1; back--) {
    const day = addDays(today, -back);
    const weekend = [0, 6].includes(new Date(`${day}T12:00:00Z`).getUTCDay());
    const count = (weekend ? 6 : 3) + Math.floor(random() * 3);
    for (let n = 0; n < count; n++) {
      const name = TABLES[Math.floor(random() * TABLES.length)]![0];
      const bill = await openBill(db, venue.id, tableId(name), me, waiterOf(name));
      if (!bill) continue;
      const lines = 1 + Math.floor(random() * 3);
      for (let l = 0; l < lines; l++) {
        const [, item] = sold[Math.floor(random() * sold.length)]!;
        await addLine(db, venue.id, bill.id, item.id, 1 + Math.floor(random() * 2), null, me);
      }
      await db.execute(`UPDATE bill_lines SET ready = qty, delivered = qty WHERE bill_id = ?`, [
        bill.id,
      ]);
      // Half the guests leave the suggested tip.
      if (random() < 0.5) {
        await setTip(db, bill.id, { percent: 1500, fixed: false });
      }
      const payment = PAYMENTS[Math.floor(random() * 3) % PAYMENTS.length]!;
      await finalizeBill(db, venue, bill.id, payment, me, day);
      const hour = 8 + Math.floor(random() * 10);
      await db.execute(
        `UPDATE bills SET opened_at = ? + INTERVAL ? HOUR, finalized_at = ? + INTERVAL ? MINUTE
          WHERE id = ?`,
        [day, hour, day, hour * 60 + 45, bill.id],
      );
    }
  }

  // This morning's count, then deliveries and some waste.
  for (const [name, , , , onHand] of INGREDIENTS) {
    await changeStock(db, venue.id, ingredients.get(name)!, 'count', onHand + 1, me, 'daily');
  }
  await changeStock(db, venue.id, ingredients.get('Whole milk')!, 'delivery', 12, me);
  await changeStock(db, venue.id, ingredients.get('Avocados')!, 'waste', 1, me);
  await changeStock(db, venue.id, ingredients.get('Eggs')!, 'waste', 2, me);

  // The floor now: tables with guests, things ready and brought, guests calling.
  const now: [string, [string, number, number, number][]][] = [
    // [item, qty, ready, brought]
    [
      'Table 1',
      [
        ['Cappuccino', 2, 2, 2],
        ['Cheesecake', 1, 1, 0],
      ],
    ],
    [
      'Table 3',
      [
        ['Avocado toast', 2, 0, 0],
        ['Homemade lemonade', 2, 2, 2],
      ],
    ],
    [
      'Table 4',
      [
        ['Flat white', 1, 1, 1],
        ['Granola bowl', 1, 1, 0],
      ],
    ],
    ['Window bar', [['Espresso', 3, 3, 3]]],
  ];
  for (const [name, lines] of now) {
    const bill = await openBill(db, venue.id, tableId(name), me, waiterOf(name));
    if (!bill) continue;
    for (const [item, qty] of lines) {
      await addLine(
        db,
        venue.id,
        bill.id,
        items.get(item)!.id,
        qty,
        item === 'Avocado toast' ? 'One without chilli' : null,
        me,
      );
    }
    const fresh = await db.query<{ id: number; name: string }>(
      'SELECT id, name FROM bill_lines WHERE bill_id = ? ORDER BY id',
      [bill.id],
    );
    for (const [item, , ready, brought] of lines) {
      const line = fresh.find((l) => l.name === item);
      if (!line) continue;
      if (ready) await markReady(db, venue.id, { lineId: line.id });
      if (brought) await setDelivered(db, venue.id, line.id, brought);
    }
  }
  // The counts set the stock after today's orders took their recipes off.
  for (const [name, , , , onHand] of INGREDIENTS) {
    await changeStock(db, venue.id, ingredients.get(name)!, 'count', onHand, me, 'daily');
  }

  // Guests calling: one waiting, one answered, a few done earlier.
  const call = async (name: string) =>
    (await raiseHand(db, venue.id, { id: tableId(name), name }, waiterOf(name)?.id ?? null)).call;
  for (const name of ['Table 2', 'Table 5', 'Terrace 1']) {
    await answerCall(db, venue.id, (await call(name)).id, 'done', waiterOf(name)?.name ?? 'Lena');
  }
  await answerCall(db, venue.id, (await call('Table 4')).id, 'coming', 'Marco');
  await call('Table 3');

  // A guest's order from Table 2's sticker, waiting for Anna to confirm it.
  const menu = await menuOf(db, venue.id);
  const lines = checkOrder(
    [
      { itemId: items.get('Cappuccino')!.id, qty: 2, note: 'One with extra foam' },
      { itemId: items.get('Carrot cake')!.id, qty: 1 },
    ],
    menu.items,
  );
  if (lines)
    await placeOrder(db, venue.id, { id: tableId('Table 2'), name: 'Table 2' }, lines, menu.items);

  return venue;
}
