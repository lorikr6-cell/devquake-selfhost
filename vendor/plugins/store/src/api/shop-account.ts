import { cookieOf, shopApi } from '../lib/api';
import { clearedCookie } from '../lib/buyer-session';
import { buyerCookie, deleteBuyer, endSession, setBuyerName } from '../lib/buyers-data';
import { HttpError } from '../lib/http';
import { optionalText, readBody } from '../lib/validate';

// PATCH /api/s/:slug/account { name }: the buyer's name in their messages.
export const PATCH = shopApi(
  async ({ request, db, buyer }) => {
    const me = await buyer();
    if (!me) throw new HttpError(401, 'buyerSignIn');
    const { name } = await readBody(request, 4096);
    await setBuyerName(db, me.id, optionalText(name, 'buyerName', 120));
  },
  { limit: 20, sameSite: true },
);

// DELETE /api/s/:slug/account: deletes the buyer's account and messages and signs them out.
// Their orders stay with the shop, which must keep its sales records.
export const DELETE = shopApi(
  async ({ db, store, buyer, ctx }) => {
    const me = await buyer();
    if (!me) throw new HttpError(401, 'buyerSignIn');
    await deleteBuyer(db, store.id, me.id);
    return new Response(null, {
      status: 204,
      headers: { 'Set-Cookie': clearedCookie(store.id, ctx.baseUrl) },
    });
  },
  { limit: 5, sameSite: true },
);

// POST /api/s/:slug/account (signing out): ends this session.
export const POST = shopApi(
  async ({ request, db, store, ctx }) => {
    const token = cookieOf(request, buyerCookie(store.id));
    if (token) await endSession(db, token);
    return new Response(null, {
      status: 204,
      headers: { 'Set-Cookie': clearedCookie(store.id, ctx.baseUrl) },
    });
  },
  { limit: 20, sameSite: true, unpublished: true },
);
