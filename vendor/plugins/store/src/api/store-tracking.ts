import { api, mine } from '../lib/api';
import { updateTracking } from '../lib/data';
import { HttpError } from '../lib/http';
import { parseTracking } from '../lib/tracking';
import { readBody } from '../lib/validate';

// PUT /api/store/tracking { ga4, googleAds, gtm, metaPixel, googleVerification,
// bingVerification, headSnippet, bodySnippet }: tags and codes on the shop's pages. The owner's
// alone: they run for every buyer.
export const PUT = api('tracking', async ({ request, db, store }) => {
  const result = parseTracking(await readBody(request, 64 * 1024));
  if (!result.ok) throw new HttpError(400, `tracking.${result.problem}`);
  await updateTracking(db, mine(store).id, result.tracking);
});
