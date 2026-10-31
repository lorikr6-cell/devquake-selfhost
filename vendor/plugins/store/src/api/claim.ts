import type { PluginApiHandler } from '@devquake/plugin-sdk';
import { localeOf, translator } from '../i18n';
import { clientIp } from '../lib/api';
import { checkClaimCode, claimByToken, markClaimed } from '../lib/claims-data';
import { Buckets } from '../lib/rate';

const buckets = new Buckets();

const answer = (status: number, body: { message: string; final?: boolean; points?: number }) =>
  Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

// POST /api/claim/:token { code }: the member the claim was made for, signed in, with the
// secret code from the email (ADR 0079). The host adds the claim's NPS points (ctx.claimRewards)
// once; then the claim is marked claimed. Five wrong codes lock it.
export const POST: PluginApiHandler = async (request, { params, ctx }) => {
  const t = translator(localeOf(ctx), 'claims.page');
  const origin = request.headers.get('origin');
  if (!origin || origin !== new URL(ctx.baseUrl).origin)
    return answer(403, { message: t('failed') });
  if (!buckets.take(`claim:${clientIp(request)}`, 10, 10, Date.now()))
    return answer(429, { message: t('failed') });
  if (!ctx.db || !ctx.claimRewards) return answer(503, { message: t('failed') });
  if (!ctx.user) return answer(401, { message: t('signIn'), final: true });
  const row = await claimByToken(ctx.db, params.token ?? '');
  if (!row) return answer(404, { message: t('unknown'), final: true });
  if (row.user_id !== ctx.user.id) return answer(403, { message: t('notYours'), final: true });

  const body = (await request.json().catch(() => null)) as { code?: unknown } | null;
  const typed = typeof body?.code === 'string' ? body.code.slice(0, 40) : '';
  const checked = await checkClaimCode(ctx.db, row, typed, new Date());
  if (!checked.ok) {
    if (checked.state === 'wrong')
      return answer(400, { message: t('wrong', { left: checked.left ?? 0 }) });
    return answer(409, { message: t(checked.state), final: true });
  }

  const redeemed = await ctx.claimRewards.redeem(row.public_id);
  // "used": the points were added before (a second click); the claim is done either way.
  if (redeemed.ok || redeemed.error === 'used') {
    await markClaimed(ctx.db, row.id);
    return answer(200, {
      message: redeemed.ok ? t('done', { points: redeemed.points }) : t('claimed'),
      final: true,
      points: redeemed.ok ? redeemed.points : 0,
    });
  }
  return answer(503, { message: t('failed') });
};
