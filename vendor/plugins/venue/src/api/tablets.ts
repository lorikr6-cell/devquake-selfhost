import { jsonBody, ownerApi } from '../lib/api';
import { addTablet, listTablets } from '../lib/data';
import { nameOf } from '../lib/names';
import { TABLET_COOKIE } from '../lib/secure';

/** A tablet stays enabled for a year, or until it is disabled in the admin settings. */
const TABLET_DAYS = 365;

// POST /api/tablets { name }: enables THIS browser as one of the venue's tablets (ADR 0080):
// a random token in an HttpOnly, Secure, SameSite=Strict cookie; only its hash is kept.
export const POST = ownerApi(async ({ request, db, venue, user }) => {
  const token = await addTablet(db, venue.id, nameOf(await jsonBody(request)), user.id);
  return Response.json(
    { tablets: await listTablets(db, venue.id) },
    {
      headers: {
        'Cache-Control': 'no-store',
        'Set-Cookie': `${TABLET_COOKIE}=${token}; Path=/; Max-Age=${TABLET_DAYS * 86400}; HttpOnly; Secure; SameSite=Strict`,
      },
    },
  );
});
