import { api } from '../lib/api';
import { changesFingerprint } from '../lib/data';

// GET /api/changes: a short fingerprint of all the user's lists; it changes whenever anything
// on them does. The home screen polls it and reloads its data when it differs.
export const GET = api(async ({ db, user }) => ({
  fingerprint: await changesFingerprint(db, user.id),
}));
