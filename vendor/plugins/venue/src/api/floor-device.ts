import { jsonBody } from '../lib/api';
import { floorApi } from '../lib/floor-api';
import { HttpError } from '../lib/http';
import { removePhonePush, savePhonePush } from '../lib/phones';

const PUSH_TOKEN = /^[A-Za-z0-9:_\-.]{20,255}$/;

// The paired phone itself (ADR 0083): PUT { platform: 'fcm' | 'apns', token } keeps its push
// address from Google or Apple; DELETE forgets it (notifications switched off in the app).
export const PUT = floorApi(
  async ({ request, db, venue, actor }) => {
    const body = await jsonBody(request);
    const platform = body.platform;
    const token = String(body.token ?? '');
    if ((platform !== 'fcm' && platform !== 'apns') || !PUSH_TOKEN.test(token))
      throw new HttpError(400, 'generic');
    await savePhonePush(db, venue.id, actor.tabletId!, platform, token);
    return { on: true };
  },
  { tabletOnly: true, allowNoStaff: true },
);

export const DELETE = floorApi(
  async ({ db, actor }) => {
    await removePhonePush(db, actor.tabletId!);
    return { on: false };
  },
  { tabletOnly: true, allowNoStaff: true },
);
