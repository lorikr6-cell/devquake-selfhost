import { api, mine } from '../lib/api';
import { removeStaff, setStaffRoles } from '../lib/team-data';
import { id, readBody, rolesInput } from '../lib/validate';

// PATCH /api/team/:userId { roles }: a member's roles (one or more).
export const PATCH = api('team', async ({ request, params, db, store }) => {
  await setStaffRoles(
    db,
    mine(store).id,
    id(params.userId),
    rolesInput((await readBody(request)).roles),
  );
});

// DELETE /api/team/:userId: removes them from the team.
export const DELETE = api('team', async ({ params, db, store }) => {
  await removeStaff(db, mine(store).id, id(params.userId));
});
