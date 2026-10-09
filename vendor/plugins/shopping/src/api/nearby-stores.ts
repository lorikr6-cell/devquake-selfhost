import { api } from '../lib/api';
import { requireMember } from '../lib/data';
import { HttpError } from '../lib/http';
import { nearbyStores, placePoint } from '../lib/nearby';
import { placeQuery, searchPoint } from '../lib/nearby-rules';
import { id, readBody } from '../lib/validate';

// POST /api/lists/:id/nearby-stores { lat, lon } or { place }: shops around the person or a
// place they typed (OpenStreetMap), to choose from; nothing is saved here and the position is
// not stored. Members of the list.
export const POST = api(async ({ request, params, db, user }) => {
  await requireMember(db, id(params.id), user.id);
  const body = await readBody(request);
  const place = placeQuery(body.place);
  const point = place ? await placePoint(place) : searchPoint(body.lat, body.lon);
  if (!point) throw new HttpError(400, 'nearbyPosition');
  return nearbyStores(user.id, point);
});
