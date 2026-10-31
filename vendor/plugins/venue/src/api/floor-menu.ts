import { menuOf } from '../lib/data';
import { floorApi } from '../lib/floor-api';
import { allergensOf } from '../lib/model';

// GET /api/floor/menu: the whole menu for staff (the waiters' app): every item with its
// details, price, allergens (keys; the app names them) and whether it can be ordered now: off
// the menu (available false) or an ingredient short (short lists them).
export const GET = floorApi(async ({ db, venue }) => {
  const menu = await menuOf(db, venue.id);
  return {
    currency: venue.currency,
    decimals: venue.decimals,
    categories: menu.categories,
    items: menu.items.map((i) => ({
      id: i.id,
      categoryId: i.categoryId,
      name: i.name,
      description: i.description,
      priceMinor: i.priceMinor,
      station: i.station,
      allergens: allergensOf(i.allergens),
      available: i.available,
      short: i.short,
    })),
  };
});
