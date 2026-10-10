import { localizePath } from '@devquake/ui';
import { shopApi } from '../lib/api';
import { sessionCookie } from '../lib/buyer-session';
import { buyerForMember, createSession } from '../lib/buyers-data';
import { HttpError } from '../lib/http';

// POST /api/s/:slug/account/connect: "Continue with DevQuake" (ADR 0059). A signed-in DevQuake
// member gets their account in this shop, filled in from their profile: their own sign-in
// address (which they allowed once on DevQuake) and their name. Until they allowed it, answers
// with the DevQuake page where they can.
export const POST = shopApi(
  async ({ db, store, ctx, locale }) => {
    if (!ctx.user) throw new HttpError(401, 'signIn');
    if (!ctx.profile) throw new HttpError(503, 'unavailable');
    const account = `${ctx.baseUrl}${localizePath(`/s/${store.slug}/account`, locale)}`;
    const granted = await ctx.profile.granted();
    if (!granted.some((g) => g.field === 'email')) {
      return { consentUrl: ctx.profile.consentUrl(account) };
    }
    const email = (await ctx.profile.get()).email;
    if (!email) throw new HttpError(503, 'unavailable');
    const buyer = await buyerForMember(
      db,
      store.id,
      ctx.user.id,
      email,
      ctx.user.displayName,
      locale,
    );
    const session = await createSession(db, buyer.id);
    return Response.json(
      { ok: true },
      {
        headers: {
          'Set-Cookie': sessionCookie(store.id, session, ctx.baseUrl),
          'Cache-Control': 'no-store',
        },
      },
    );
  },
  { limit: 10, sameSite: true },
);
