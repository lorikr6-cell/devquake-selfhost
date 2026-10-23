import { api } from '../lib/api';
import { createDemoOrg } from '../lib/demo';

// POST /api/demo: the visitor's demo organisation with sample data (made once, then reopened).
export const POST = api(async ({ db, user, today }) => ({
  id: await createDemoOrg(db, user, today),
}));
