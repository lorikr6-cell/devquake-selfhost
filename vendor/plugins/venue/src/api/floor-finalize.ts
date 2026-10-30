import { localDayOf } from '@devquake/plugin-sdk';
import { jsonBody } from '../lib/api';
import { PAYMENTS, type Payment } from '../lib/bill';
import { billView } from '../lib/bill-view';
import { billOfVenue, finalizeBill, setTip } from '../lib/floor';
import { floorApi } from '../lib/floor-api';
import { HttpError } from '../lib/http';

// POST /api/floor/bills/:id/finalize { payment, tipPercent?, tipFixed? }: the guests paid. The
// bill's numbers go into the day's sales, the table is free, and the bill's code is retired.
export const POST = floorApi(async ({ request, params, db, ctx, venue, actor }) => {
  const body = await jsonBody(request);
  const payment = PAYMENTS.includes(body.payment as Payment) ? (body.payment as Payment) : null;
  if (!payment) throw new HttpError(400, 'payment');
  const id = Number(params.id);
  if (body.tipPercent !== undefined || body.tipFixed !== undefined) {
    const percent = body.tipPercent === null ? null : Number(body.tipPercent);
    await setTip(db, id, {
      percent: percent !== null && venue.tips.tipPercents.includes(percent) ? percent : null,
      fixed: body.tipFixed === true,
    });
  }
  const day = localDayOf(new Date(), ctx.timeZone || 'UTC');
  if (!(await finalizeBill(db, venue, id, payment, actor.name, day)))
    throw new HttpError(409, 'billClosed');
  return { bill: billView((await billOfVenue(db, venue.id, id))!, venue) };
});
