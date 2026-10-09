import { api } from '../lib/api';
import { clearDone } from '../lib/mutations';
import { id } from '../lib/validate';

// POST /api/lists/:id/clear-done: removes every bought or not-needed item.
export const POST = api(async ({ params, db, user }) => ({
  removed: await clearDone(db, id(params.id), user),
}));
