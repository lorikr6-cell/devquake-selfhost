import { api } from '../lib/api';
import { areaPlan, saveAreas } from '../lib/areas-data';
import { HttpError } from '../lib/http';
import { id, readBody } from '../lib/validate';

// GET /api/orgs/:id/areas: the drivers and the people living at home with their area driver.
export const GET = api(async ({ params, db, user }) => areaPlan(db, id(params.id), user.id));

// PUT /api/orgs/:id/areas { areas: { personId: driverId | null } }: saves the areas.
export const PUT = api(async ({ request, params, db, user }) => {
  const { areas } = await readBody(request);
  if (!areas || typeof areas !== 'object') throw new HttpError(400, 'invalidRequest');
  return { saved: await saveAreas(db, id(params.id), user.id, areas as Record<string, unknown>) };
});
