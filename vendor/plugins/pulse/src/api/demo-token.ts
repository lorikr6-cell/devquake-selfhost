import { api, readJson } from '../lib/api';
import { demoApp } from '../lib/data';
import {
  BROWSER_PATTERN,
  DEMO_TOKEN_SECONDS,
  demoChannel,
  demoSender,
  newBrowserName,
} from '../lib/demo';
import { deriveSecret, signClientToken } from '../lib/keys';

// POST /api/demo/token { browser: "K7Q2" } — a client token of DevQuake's demo service (ADR 0029)
// for the member's own private demo channel, to listen and send through the real API from this
// browser. Valid 10 minutes; the page asks for a new one in time.
export const POST = api(async ({ request, db, user, master }) => {
  const body = await readJson(request);
  const browser =
    typeof body.browser === 'string' && BROWSER_PATTERN.test(body.browser)
      ? body.browser
      : newBrowserName();
  const app = await demoApp(db, master);
  const channel = demoChannel(user.id);
  const now = Math.floor(Date.now() / 1000);
  const token = signClientToken(
    {
      app: app.public_key,
      ch: [channel],
      pub: true,
      sub: demoSender(user.id, browser),
      iat: now,
      exp: now + DEMO_TOKEN_SECONDS,
    },
    deriveSecret(master, app.id, app.public_key, app.secret_salt),
  );
  return { token, channel, browser, expiresInSeconds: DEMO_TOKEN_SECONDS };
});
