import { api, mine } from '../lib/api';
import { deleteRule, updateRule } from '../lib/marketing-data';
import { id, readBody, ruleInput } from '../lib/validate';

export const PUT = api('marketing', async ({ request, params, db, store, timeZone }) => {
  await updateRule(db, mine(store).id, id(params.id), ruleInput(await readBody(request), timeZone));
});

export const DELETE = api('marketing', async ({ params, db, store }) => {
  await deleteRule(db, mine(store).id, id(params.id));
});
