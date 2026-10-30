import type { PluginApiHandler } from '@devquake/plugin-sdk';
import { localeOf, translator } from '../i18n';
import { jsonBody } from '../lib/api';
import { BILL_CODE } from '../lib/bill';
import { billView } from '../lib/bill-view';
import { venueById } from '../lib/data';
import { billByCode, setTip } from '../lib/floor';

// The guests' bill behind its own code (/b/:code), without an account: GET it (the page refreshes
// it), PUT { percent, fixed } to choose the tip while it is open. Key route: the code is the key;
// writes must come from the app's own page (Origin).

async function load(code: string, db: NonNullable<Parameters<PluginApiHandler>[1]['ctx']['db']>) {
  if (!BILL_CODE.test(code)) return null;
  const bill = await billByCode(db, code);
  if (!bill) return null;
  const venue = await venueById(db, bill.venueId);
  return venue ? { bill, venue } : null;
}

export const GET: PluginApiHandler = async (_request, { params, ctx }) => {
  const t = translator(localeOf(ctx));
  if (!ctx.db) return Response.json({ error: t('errors.unavailable') }, { status: 503 });
  const found = await load(params.code ?? '', ctx.db);
  if (!found) return Response.json({ error: t('errors.billGone') }, { status: 404 });
  return Response.json(
    { bill: billView(found.bill, found.venue) },
    { headers: { 'Cache-Control': 'no-store' } },
  );
};

export const PUT: PluginApiHandler = async (request, { params, ctx }) => {
  const t = translator(localeOf(ctx));
  if (!ctx.db) return Response.json({ error: t('errors.unavailable') }, { status: 503 });
  if (request.headers.get('origin') !== ctx.baseUrl)
    return Response.json({ error: t('errors.crossSite') }, { status: 403 });
  const found = await load(params.code ?? '', ctx.db);
  if (!found || found.bill.status !== 'open')
    return Response.json({ error: t('errors.billClosed') }, { status: 409 });
  const body = await jsonBody(request);
  const percent = body.percent === null || body.percent === undefined ? null : Number(body.percent);
  await setTip(ctx.db, found.bill.id, {
    percent: percent !== null && found.venue.tips.tipPercents.includes(percent) ? percent : null,
    fixed: body.fixed === true && found.venue.tips.tipMode === 'fixed',
  });
  const bill = (await billByCode(ctx.db, found.bill.code))!;
  return Response.json(
    { bill: billView(bill, found.venue) },
    { headers: { 'Cache-Control': 'no-store' } },
  );
};
