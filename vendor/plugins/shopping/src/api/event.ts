import { api } from '../lib/api';
import { dismissEvent } from '../lib/data';
import { id } from '../lib/validate';

// DELETE /api/events/:id: removes one notification from the person's bell.
export const DELETE = api(async ({ params, db, user }) => {
  await dismissEvent(db, user.id, id(params.id));
});
