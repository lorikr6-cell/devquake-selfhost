import { isLocale, localizePath } from '@devquake/ui';
import { clientIp, shopApi } from '../lib/api';
import { mayMail, sessionCookie } from '../lib/buyer-session';
import { buyerFor, createSignInLink, useSignInLink } from '../lib/buyers-data';
import { HttpError } from '../lib/http';
import { shopMailConfigured } from '../lib/mailer';
import { sendSignInLink } from '../lib/shop-mail';
import { emailAddress, readBody } from '../lib/validate';

// POST /api/s/:slug/account/signin { email }: emails a one-time sign-in link to a buyer's
// account in this shop (made on first use). Always answers the same, known address or not.
export const POST = shopApi(
  async ({ request, db, store, locale, ctx }) => {
    if (!shopMailConfigured()) throw new HttpError(503, 'mailOff');
    const email = emailAddress((await readBody(request, 4096)).email);
    if (!mayMail('s', store.id, email, clientIp(request))) throw new HttpError(429, 'tooMany');
    const buyer = await buyerFor(db, store.id, email, locale);
    const token = await createSignInLink(db, buyer.id);
    await sendSignInLink(store, ctx.baseUrl, email, token, locale);
    return { ok: true };
  },
  { limit: 5, sameSite: true },
);

// GET /api/s/:slug/account/signin?token=…&lang=…: the link from the email. Starts the session
// (a cookie) and opens the account; an old or used link opens the sign-in form again.
export const GET = shopApi(
  async ({ request, db, store, ctx }) => {
    const url = new URL(request.url);
    const lang = url.searchParams.get('lang');
    const locale = isLocale(lang) ? lang : 'en';
    const account = `${ctx.baseUrl}${localizePath(`/s/${store.slug}/account`, locale)}`;
    const session = await useSignInLink(db, store.id, url.searchParams.get('token') ?? '');
    if (!session) return Response.redirect(`${account}?expired=1`, 303);
    return new Response(null, {
      status: 303,
      headers: {
        Location: account,
        'Set-Cookie': sessionCookie(store.id, session, ctx.baseUrl),
        'Cache-Control': 'no-store',
        'Referrer-Policy': 'no-referrer',
      },
    });
  },
  { limit: 20 },
);
