import { api, mine } from '../lib/api';
import { updateMaintenance } from '../lib/data';
import { longOptionalText, readBody } from '../lib/validate';

// PUT /api/store/maintenance { on, message }: buyers see the message instead of the shop, and
// checkout is closed, until it is switched off.
export const PUT = api('settings', async ({ request, db, store }) => {
  const body = await readBody(request);
  await updateMaintenance(db, mine(store).id, {
    on: body.on === true,
    message: longOptionalText(body.message, 'maintenanceMessage', 300),
  });
});
