import { badInput, jsonBody, ownerApi } from '../lib/api';
import { createVenue, updateVenue, venuesOfOwner } from '../lib/data';
import { HttpError } from '../lib/http';
import { checkVenue } from '../lib/model';

// POST /api/venue: the member's own venue (one each, beside an optional demo venue), filled
// from the country's preset.
export const POST = ownerApi(
  async ({ request, db, user }) => {
    if ((await venuesOfOwner(db, user.id)).own) throw new HttpError(409, 'venueExists');
    const checked = checkVenue(await jsonBody(request));
    if (!checked.ok) throw badInput(checked);
    const made = await createVenue(db, user.id, checked.value);
    return { slug: made.slug };
  },
  { needVenue: false },
);

// PUT /api/venue: its name, country, currency, VAT rates and whether the menu is public.
export const PUT = ownerApi(async ({ request, db, venue }) => {
  const body = await jsonBody(request);
  const checked = checkVenue(body);
  if (!checked.ok) throw badInput(checked);
  await updateVenue(db, venue.id, checked.value, body.menuPublic !== false);
});
