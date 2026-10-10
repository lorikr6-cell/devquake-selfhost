import { api, mine } from '../lib/api';
import { deleteSubscriber } from '../lib/newsletter-data';
import { id } from '../lib/validate';

// DELETE /api/subscribers/:id: removes the address entirely.
export const DELETE = api('marketing', async ({ params, db, store }) => {
  await deleteSubscriber(db, mine(store).id, id(params.id));
});
