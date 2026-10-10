import { api, mine } from '../lib/api';
import { deleteCampaign, updateCampaign } from '../lib/marketing-data';
import { campaignInput, id, readBody } from '../lib/validate';

export const PUT = api('marketing', async ({ request, params, db, store, timeZone }) => {
  await updateCampaign(
    db,
    mine(store).id,
    id(params.id),
    campaignInput(await readBody(request), timeZone),
  );
});

export const DELETE = api('marketing', async ({ params, db, store }) => {
  await deleteCampaign(db, mine(store).id, id(params.id));
});
