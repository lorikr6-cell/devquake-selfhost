import { api } from '../lib/api';
import { HttpError } from '../lib/http';
import { setKitchenAddress, setMinutesPerStop } from '../lib/routes-data';
import { id, optionalText, readBody } from '../lib/validate';

// PUT /api/orgs/:id/route-settings { minutesPerStop?, kitchenAddress? }: average minutes per
// stop (2–60) and where the routes start (for computing the order from the map).
export const PUT = api(async ({ request, params, db, user }) => {
  const body = await readBody(request);
  const orgId = id(params.id);
  if ('kitchenAddress' in body) {
    await setKitchenAddress(
      db,
      orgId,
      user.id,
      optionalText(body.kitchenAddress, 'kitchenAddress', 255),
    );
  }
  if ('minutesPerStop' in body) {
    const value = Number(body.minutesPerStop);
    if (!Number.isInteger(value) || value < 2 || value > 60) {
      throw new HttpError(400, 'minutesPerStop');
    }
    await setMinutesPerStop(db, orgId, user.id, value);
  }
});
