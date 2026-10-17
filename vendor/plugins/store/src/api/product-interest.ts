import { api, mine } from '../lib/api';
import { HttpError } from '../lib/http';
import { interestEnabled, setInterest } from '../lib/interest-data';
import { parseCents } from '../lib/pricing';
import { id, readBody } from '../lib/validate';

const cost = (value: unknown, field: string) => {
  if (value === undefined || value === null || value === '') return null;
  const cents = parseCents(value);
  if (cents === null) throw new HttpError(400, 'amount', { field });
  return cents;
};

// PUT /api/products/:id/interest { on, unitCost, setupCost }: the product asks for interest votes
// instead of being sold, with the owner's cost estimates for the report (ADR 0060).
export const PUT = api('products', async ({ request, params, db, store, ctx }) => {
  const body = await readBody(request, 4096);
  const on = body.on === true;
  if (on && !(await interestEnabled(ctx))) throw new HttpError(403, 'interestOff');
  const found = await setInterest(db, mine(store).id, id(params.id), {
    on,
    unitCents: cost(body.unitCost, 'unitCost'),
    setupCents: cost(body.setupCost, 'setupCost'),
  });
  if (!found) throw new HttpError(404, 'productNotFound');
});
