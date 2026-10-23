import { api } from '../lib/api';
import { buildRoutes, locateAddresses, proposeAreas } from '../lib/areas-data';
import { HttpError } from '../lib/http';
import { id, readBody } from '../lib/validate';

// POST /api/orgs/:id/areas/:action: "propose" (areas from the addresses, not saved), "locate"
// (find addresses on the map, a few dozen per press) or "build" { from, to } (each day's routes
// from the areas).
export const POST = api(async ({ request, params, db, user }) => {
  const orgId = id(params.id);
  switch (params.action) {
    case 'propose':
      return { areas: await proposeAreas(db, orgId, user.id) };
    case 'locate':
      return locateAddresses(db, orgId, user.id);
    case 'build': {
      const { from, to } = await readBody(request);
      return buildRoutes(db, orgId, user.id, from, to);
    }
    default:
      throw new HttpError(404, 'notFound');
  }
});
