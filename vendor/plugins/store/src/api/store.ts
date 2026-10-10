import { api, mine } from '../lib/api';
import { createStore, updateStore } from '../lib/data';
import { HttpError } from '../lib/http';
import { readBody, storeInput } from '../lib/validate';

// GET /api/store: the member's store and their role there (null before they made or joined one).
export const GET = api(null, async ({ store, roles }) => ({ store, roles }));

// POST /api/store { name, slug?, tagline, about, currency, vatRate, published }: the member's store.
export const POST = api(null, async ({ request, db, user, store }) => {
  // A member on another shop's team cannot open their own.
  if (store) throw new HttpError(409, 'otherShop');
  const id = await createStore(db, user.id, storeInput(await readBody(request)));
  return { id };
});

// PUT /api/store: the shop's name, address, texts, currency, VAT rate and whether it is open.
export const PUT = api('settings', async ({ request, db, store }) => {
  await updateStore(db, mine(store).id, storeInput(await readBody(request)));
});
