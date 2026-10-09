import { api } from '../lib/api';
import { makePublicLink, stopPublicLink } from '../lib/data';
import { id } from '../lib/validate';

// POST /api/recipes/:id/public-link: a public link anyone can open (keeps the current one).
// Author only (ADR 0047).
export const POST = api(async ({ params, db, user }) => ({
  code: await makePublicLink(db, id(params.id), user.id),
}));

// DELETE /api/recipes/:id/public-link: the public link stops working.
export const DELETE = api(async ({ params, db, user }) => {
  await stopPublicLink(db, id(params.id), user.id);
});
