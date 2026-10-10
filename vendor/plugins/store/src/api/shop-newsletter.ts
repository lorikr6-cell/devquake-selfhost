import { clientIp, shopApi } from '../lib/api';
import { mayMail } from '../lib/buyer-session';
import { HttpError } from '../lib/http';
import { shopMailConfigured } from '../lib/mailer';
import { subscribe } from '../lib/newsletter-data';
import { isTrap } from '../lib/reviews';
import { sendSubscribeConfirmation } from '../lib/shop-mail';
import { emailAddress, readBody } from '../lib/validate';

// POST /api/s/:slug/newsletter { email, source? }: asks for the newsletter; a link confirms the
// address (double opt-in). The answer never says whether the address was known.
export const POST = shopApi(
  async ({ request, db, store, locale, ctx }) => {
    if (!shopMailConfigured()) throw new HttpError(503, 'mailOff');
    const body = await readBody(request, 4096);
    const email = emailAddress(body.email);
    if (isTrap(body.website)) return { ok: true };
    if (!mayMail('n', store.id, email, clientIp(request))) throw new HttpError(429, 'tooMany');
    const source = body.source === 'checkout' || body.source === 'account' ? body.source : 'shop';
    const { subscriber, needsConfirmation } = await subscribe(db, store.id, email, locale, source);
    if (needsConfirmation) {
      await sendSubscribeConfirmation(store, ctx.baseUrl, email, subscriber.token, locale);
    }
    return { ok: true };
  },
  { limit: 5, sameSite: true },
);
