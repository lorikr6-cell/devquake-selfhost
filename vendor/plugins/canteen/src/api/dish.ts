import { api } from '../lib/api';
import { deleteDish } from '../lib/dishes-data';
import { id } from '../lib/validate';

// DELETE /api/orgs/:id/dishes/:dishId: removes a dish (menu lines with its name stay as text).
export const DELETE = api(async ({ params, db, user }) => {
  await deleteDish(db, id(params.id), user.id, id(params.dishId));
});
