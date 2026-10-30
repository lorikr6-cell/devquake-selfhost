import { badInput, jsonBody, ownerApi } from '../lib/api';
import { updateTips } from '../lib/data';
import { checkTips } from '../lib/model';

// PUT /api/tips { tipMode, tipPercents, tipFixed }: tips on the bill, set by the owner.
export const PUT = ownerApi(async ({ request, db, venue }) => {
  const checked = checkTips(await jsonBody(request), venue.decimals);
  if (!checked.ok) throw badInput(checked);
  await updateTips(db, venue.id, checked.value);
});
