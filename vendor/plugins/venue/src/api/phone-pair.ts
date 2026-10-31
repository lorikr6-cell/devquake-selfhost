import type { PluginApiHandler } from '@devquake/plugin-sdk';
import { localeOf, translator } from '../i18n';
import { venueById } from '../lib/data';
import { normalizePairCode, redeemPairing } from '../lib/phones';

// POST /api/phone/pair { code } (key route, the Venue app; ADR 0083): redeems the owner's
// one-time code and answers the phone's token, sent from then on in X-Venue-Device. No cookie,
// no Origin: a native app has neither.
export const POST: PluginApiHandler = async (request, { ctx }) => {
  const t = translator(localeOf(ctx));
  const fail = (status: number, key: string) =>
    Response.json({ error: t(`errors.${key}`), code: key }, { status });
  if (!ctx.db) return fail(503, 'unavailable');
  const body = (await request.json().catch(() => ({}))) as { code?: unknown };
  const code = normalizePairCode(body.code);
  if (!code) return fail(400, 'pairCode');
  const paired = await redeemPairing(ctx.db, code);
  if (!paired) return fail(404, 'pairCode');
  const venue = await venueById(ctx.db, paired.venueId);
  return Response.json(
    {
      token: paired.token,
      device: paired.name,
      venue: venue
        ? { name: venue.name, currency: venue.currency, decimals: venue.decimals }
        : null,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
};
