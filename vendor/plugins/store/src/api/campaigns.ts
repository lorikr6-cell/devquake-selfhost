import { api, mine } from '../lib/api';
import { createCampaign } from '../lib/marketing-data';
import { campaignInput, readBody } from '../lib/validate';

// POST /api/campaigns { name, description, percentOff, scope, category, productIds, startsAt,
// endsAt, active }: a percentage off everything, a category or chosen products, for a while.
export const POST = api('marketing', async ({ request, db, store, timeZone }) => {
  const id = await createCampaign(
    db,
    mine(store).id,
    campaignInput(await readBody(request), timeZone),
  );
  return { id };
});
