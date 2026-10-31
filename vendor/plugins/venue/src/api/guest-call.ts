import type { PluginApiHandler } from '@devquake/plugin-sdk';
import { localeOf, translator } from '../i18n';
import { TABLE_CODE } from '../lib/bill';
import { lastCallOfTable, pushCall, raiseHand, waiterFor } from '../lib/calls';
import { openBill, tableByCode } from '../lib/floor';
import { pushPhones } from '../lib/phones';

// A guest at a table (its sticker's code is the key; no account): GET the table's latest call
// (to show "on the way"); POST raises a hand: the table's waiter (or everyone, without one) is
// told live and by push. One open call per table, and a short wait between calls.

async function load(ctx: Parameters<PluginApiHandler>[1]['ctx'], code: string) {
  if (!ctx.db || !TABLE_CODE.test(code)) return null;
  return tableByCode(ctx.db, code);
}

const view = (call: Awaited<ReturnType<typeof lastCallOfTable>>) =>
  call ? { status: call.status, at: call.createdAt, by: call.answeredBy } : null;

export const GET: PluginApiHandler = async (_request, { params, ctx }) => {
  const table = await load(ctx, params.code ?? '');
  if (!table || !ctx.db) return new Response(null, { status: 404 });
  return Response.json(
    { call: view(await lastCallOfTable(ctx.db, table.venueId, table.id)) },
    { headers: { 'Cache-Control': 'no-store' } },
  );
};

export const POST: PluginApiHandler = async (request, { params, ctx }) => {
  const t = translator(localeOf(ctx));
  if (request.headers.get('origin') !== ctx.baseUrl)
    return Response.json({ error: t('errors.crossSite') }, { status: 403 });
  const table = await load(ctx, params.code ?? '');
  if (!table || !ctx.db) return Response.json({ error: t('errors.notFound') }, { status: 404 });
  const db = ctx.db;
  // The seating's waiter: the open bill's, or assigned now (owner's rule, ADR in venue.md §12).
  const bill = await openBill(
    db,
    table.venueId,
    table.id,
    t('call.guest'),
    await waiterFor(db, table.venueId, table.id),
  );
  const { call, created } = await raiseHand(db, table.venueId, table, bill?.waiterStaffId ?? null);
  if (created)
    await Promise.all([
      pushCall(db, table.venueId, call, {
        title: t('call.pushTitle', { table: table.name }),
        body: t('call.pushBody'),
        url: '/tablet',
      }).catch(() => undefined),
      pushPhones(db, table.venueId, call).catch(() => undefined),
    ]);
  return Response.json({ call: view(call) }, { headers: { 'Cache-Control': 'no-store' } });
};
