import type { PluginApiHandler } from '@devquake/plugin-sdk';
import { localeOf, translator } from '../i18n';
import { TABLE_CODE } from '../lib/bill';
import { pushCall } from '../lib/calls';
import { menuOf, venueById } from '../lib/data';
import { tableByCode } from '../lib/floor';
import { checkOrder, lastOrderOfTable, placeOrder, type GuestOrder } from '../lib/guest-orders';
import { pushPhones } from '../lib/phones';

// A guest at a table orders from the menu (the sticker's code is the key; no account): GET the
// table's latest order (waiting, confirmed or refused); POST { items: [{ itemId, qty, note }] }
// sends one to the table's waiter, who confirms it (owner's decision) before anything reaches the
// bill or the kitchen. Only while the venue's menu is public and guest orders are on.

async function load(ctx: Parameters<PluginApiHandler>[1]['ctx'], code: string) {
  if (!ctx.db || !TABLE_CODE.test(code)) return null;
  const table = await tableByCode(ctx.db, code);
  if (!table) return null;
  const venue = await venueById(ctx.db, table.venueId);
  return venue?.menuPublic && venue.guestOrders ? { table, venue } : null;
}

const view = (o: GuestOrder | null) =>
  o
    ? {
        status: o.status,
        at: o.createdAt,
        by: o.answeredBy,
        lines: o.lines.map((l) => ({ name: l.name, qty: l.qty })),
      }
    : null;

export const GET: PluginApiHandler = async (_request, { params, ctx }) => {
  const found = await load(ctx, params.code ?? '');
  if (!found || !ctx.db) return new Response(null, { status: 404 });
  return Response.json(
    { order: view(await lastOrderOfTable(ctx.db, found.venue.id, found.table.id)) },
    { headers: { 'Cache-Control': 'no-store' } },
  );
};

export const POST: PluginApiHandler = async (request, { params, ctx }) => {
  const t = translator(localeOf(ctx));
  if (request.headers.get('origin') !== ctx.baseUrl)
    return Response.json({ error: t('errors.crossSite') }, { status: 403 });
  const found = await load(ctx, params.code ?? '');
  if (!found || !ctx.db) return Response.json({ error: t('errors.notFound') }, { status: 404 });
  const { table, venue } = found;
  const db = ctx.db;
  const body = (await request.json().catch(() => ({}))) as { items?: unknown };
  const menu = await menuOf(db, venue.id);
  const lines = checkOrder(body.items, menu.items);
  if (!lines) return Response.json({ error: t('errors.orderEmpty') }, { status: 400 });
  const order = await placeOrder(db, venue.id, table, lines, menu.items);
  if (order === 'busy') return Response.json({ error: t('errors.orderBusy') }, { status: 429 });
  // The table's waiter hears it at once: the floor rings, browser and phone notifications.
  await Promise.all([
    pushCall(db, venue.id, order, {
      title: t('order.pushTitle', { table: table.name }),
      body: t('order.pushBody'),
      url: '/floor',
    }).catch(() => undefined),
    pushPhones(
      db,
      venue.id,
      {
        id: order.id,
        tableId: order.tableId,
        tableName: order.tableName,
        waiterStaffId: order.waiterStaffId,
      },
      'order',
    ).catch(() => undefined),
  ]);
  return Response.json({ order: view(order) }, { headers: { 'Cache-Control': 'no-store' } });
};
