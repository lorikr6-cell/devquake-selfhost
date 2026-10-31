import { plainQrSvg } from '@devquake/ui/qr';
import { jsonBody, ownerApi } from '../lib/api';
import { HttpError } from '../lib/http';
import { nameOf } from '../lib/names';
import { createPairing, pairLink } from '../lib/phones';

// POST /api/tablets/pairing { name }: a one-time code for a waiter's phone (ADR 0083), valid 10
// minutes, with its QR for the Venue app (which reads the server from it, so self-hosted venues
// work too). At most 5 open codes per venue.
export const POST = ownerApi(async ({ request, db, venue, user, ctx }) => {
  const pairing = await createPairing(db, venue.id, nameOf(await jsonBody(request)), user.id);
  if (!pairing) throw new HttpError(429, 'pairTooMany');
  const link = pairLink(ctx.baseUrl, pairing.code);
  return { ...pairing, server: ctx.baseUrl, qr: plainQrSvg(link) };
});
