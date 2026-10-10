import { api, mine } from '../lib/api';
import { updateLegal } from '../lib/data';
import { legalInput, readBody } from '../lib/validate';

// PUT /api/store/legal: seller details, terms, returns policy and the ANPC links.
export const PUT = api('settings', async ({ request, db, store }) => {
  await updateLegal(db, mine(store).id, legalInput(await readBody(request)));
});
