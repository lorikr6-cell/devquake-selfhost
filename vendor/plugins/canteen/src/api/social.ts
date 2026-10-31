import { api } from '../lib/api';
import { socialOverview } from '../lib/social-data';
import { id } from '../lib/validate';

// GET /api/orgs/:id/social: places, the waiting list and the visits (social workers, organisers).
export const GET = api(async ({ params, db, user }) => socialOverview(db, id(params.id), user.id));
