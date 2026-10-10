import { api, mine } from '../lib/api';
import { saveZones } from '../lib/data';
import { readBody, zonesInput } from '../lib/validate';

// PUT /api/store/shipping { zones: [{ name, countries, rate, freeFrom }] }: replaces the zones.
export const PUT = api('shipping', async ({ request, db, store }) => {
  await saveZones(db, mine(store).id, zonesInput(await readBody(request)));
});
