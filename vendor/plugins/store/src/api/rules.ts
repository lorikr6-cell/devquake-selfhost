import { api, mine } from '../lib/api';
import { createRule } from '../lib/marketing-data';
import { readBody, ruleInput } from '../lib/validate';

// POST /api/rules { kind: free_shipping | spend | quantity, threshold, percentOff, startsAt,
// endsAt, active }: an automatic discount or free shipping, applied without a code.
export const POST = api('marketing', async ({ request, db, store, timeZone }) => {
  const id = await createRule(db, mine(store).id, ruleInput(await readBody(request), timeZone));
  return { id };
});
