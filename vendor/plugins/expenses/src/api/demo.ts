import { api } from '../lib/api';
import { createDemoGroup } from '../lib/demo';

// POST /api/demo: the visitor's demo group with sample data, in their language (made once, then
// reopened).
export const POST = api(async ({ db, user, today, locale }) => ({
  id: await createDemoGroup(db, user, today, locale),
}));
