import { jsonBody } from '../lib/api';
import { addSubscription, removeSubscription, vapidKeys } from '../lib/calls';
import { floorApi } from '../lib/floor-api';
import { HttpError } from '../lib/http';

// Browser push for the waiter on this device (Web Push): GET the app's public key; POST the
// browser's subscription { endpoint, keys: { p256dh, auth } }; DELETE { endpoint } stops it.

export const GET = floorApi(async ({ db }) => ({ publicKey: (await vapidKeys(db)).publicKey }));

export const POST = floorApi(async ({ request, db, venue, actor }) => {
  const body = await jsonBody(request);
  const keys = (body.keys ?? {}) as Record<string, unknown>;
  const ok = await addSubscription(
    db,
    venue.id,
    { staffId: actor.staffId, owner: actor.role === 'owner' },
    { endpoint: body.endpoint, p256dh: keys.p256dh, auth: keys.auth },
  );
  if (!ok) throw new HttpError(400, 'generic');
  return { on: true };
});

export const DELETE = floorApi(async ({ request, db, venue }) => {
  await removeSubscription(db, venue.id, String((await jsonBody(request)).endpoint ?? ''));
  return { on: false };
});
