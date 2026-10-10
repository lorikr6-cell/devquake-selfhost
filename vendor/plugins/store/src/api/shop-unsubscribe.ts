import { localizePath } from '@devquake/ui';
import { shopApi } from '../lib/api';
import { HttpError } from '../lib/http';
import { subscriberByToken, unsubscribe } from '../lib/newsletter-data';

async function tokenOf(request: Request): Promise<string> {
  const fromQuery = new URL(request.url).searchParams.get('token');
  if (fromQuery) return fromQuery;
  const type = request.headers.get('content-type') ?? '';
  if (type.includes('application/json')) {
    const body = (await request.json().catch(() => null)) as { token?: unknown } | null;
    return typeof body?.token === 'string' ? body.token : '';
  }
  const form = await request.formData().catch(() => null);
  const value = form?.get('token');
  return typeof value === 'string' ? value : '';
}

// POST /api/s/:slug/newsletter/unsubscribe?token=…: unsubscribes at once. Mail programs call it
// for List-Unsubscribe-Post (RFC 8058) and the shop's page from its button, so there is no Origin
// check; the subscriber's secret token is the proof.
export const POST = shopApi(
  async ({ request, db, store }) => {
    const subscriber = await subscriberByToken(db, store.id, await tokenOf(request));
    if (!subscriber) throw new HttpError(404, 'linkGone');
    await unsubscribe(db, subscriber.id);
  },
  { limit: 20, unpublished: true },
);

// GET: the shop's page with the "Unsubscribe" button.
export const GET = shopApi(
  async ({ request, store, locale, ctx }) => {
    const token = new URL(request.url).searchParams.get('token') ?? '';
    const page = localizePath(`/s/${store.slug}/newsletter`, locale);
    return Response.redirect(`${ctx.baseUrl}${page}?unsubscribe=${encodeURIComponent(token)}`, 303);
  },
  { limit: 20, unpublished: true },
);
