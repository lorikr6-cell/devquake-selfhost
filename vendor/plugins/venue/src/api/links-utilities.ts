import { jsonBody, ownerApi } from '../lib/api';
import { HttpError } from '../lib/http';
import { idsOf, setVenueLink, utilityList, venueLink } from '../lib/links';

// The venue's utilities (its running costs; ADR 0035): GET the member's utilities and the chosen
// ones; PUT { ids } saves the choice (each tick saves at once in the settings).

export const GET = ownerApi(async ({ db, venue, ctx }) => ({
  utilities: ctx.links ? await utilityList(ctx.links) : null,
  chosen: idsOf((await venueLink(db, venue.id, 'utilities'))?.ref),
}));

export const PUT = ownerApi(async ({ request, db, venue, ctx }) => {
  const raw = (await jsonBody(request)).ids;
  const wanted = Array.isArray(raw) ? raw.map(Number).filter(Number.isInteger) : [];
  const known = ctx.links ? await utilityList(ctx.links) : null;
  if (!known) throw new HttpError(409, 'notConnected');
  const ids = known
    .filter((u) => wanted.includes(u.id))
    .map((u) => u.id)
    .slice(0, 8);
  await setVenueLink(
    db,
    venue.id,
    'utilities',
    ids.length ? { ref: ids.join(','), name: `${ids.length}` } : null,
  );
  return { chosen: ids };
});
