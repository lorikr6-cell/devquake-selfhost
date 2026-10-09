import { api } from '../lib/api';
import { getProfile } from '../lib/data';
import { HttpError } from '../lib/http';
import { placeOf, searchPoint, type Place } from '../lib/locate';
import { regionName } from '../lib/provider-catalog';
import { readBody } from '../lib/validate';

const LOOKUP_GAP_MS = 3_000;
const lastLookup = new Map<number, number>();

// POST /api/utility-place { lat?, lon? }: the country and county / state to search utility
// services for, to show the person before searching: from the position they shared (Photon), or
// else from their profile address. Nothing is saved; the position is not stored.
export const POST = api(async ({ request, db, user }) => {
  const now = Date.now();
  if (now - (lastLookup.get(user.id) ?? 0) < LOOKUP_GAP_MS) throw new HttpError(429, 'suggestWait');
  lastLookup.set(user.id, now);
  if (lastLookup.size > 5000) lastLookup.clear();

  const body = await readBody(request);
  const point = searchPoint(body.lat, body.lon);
  let place: Place | null = point ? await placeOf(point) : null;
  const source = place ? 'location' : 'profile';
  if (!place) {
    const parts = (await getProfile(db, user.id))?.parts;
    if (parts) place = { countryCode: parts.countryCode, region: parts.state || null };
  }
  if (!place) throw new HttpError(409, 'suggestNoPlace');
  return {
    source,
    countryCode: place.countryCode,
    region: place.region ? regionName(place.countryCode, place.region) : '',
  };
});
