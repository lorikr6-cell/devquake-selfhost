import { api, readJson } from '../lib/api';
import { parseChannels } from '../lib/envelope';
import { HttpError } from '../lib/http';
import { deriveSecret, signClientToken } from '../lib/keys';
import { requireApp } from '../lib/own-app';

// POST /api/apps/:id/test-token { channels: "a,b", publish } — a client token valid for 10
// minutes, made here with the app's secret key, so the member can try the secure mode (private
// channels) in the live test before writing their own server code.
export const POST = api(async ({ request, params, db, user, master, limits }) => {
  const app = await requireApp(db, user.id, params.id);
  const body = await readJson(request);
  const channels = parseChannels(
    typeof body.channels === 'string' ? body.channels : null,
    limits.channelsPerConnection,
  );
  if (!channels) throw new HttpError(400, 'channelsInvalid');
  const now = Math.floor(Date.now() / 1000);
  const secret = deriveSecret(master, app.id, app.public_key, app.secret_salt);
  const token = signClientToken(
    {
      app: app.public_key,
      ch: channels,
      pub: body.publish === true,
      sub: 'live-test',
      iat: now,
      exp: now + 600,
    },
    secret,
  );
  return { token, expiresInSeconds: 600 };
});
