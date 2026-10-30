import { jsonBody } from '../lib/api';
import { billView } from '../lib/bill-view';
import { addLine, billOfVenue } from '../lib/floor';
import { floorApi } from '../lib/floor-api';
import { HttpError } from '../lib/http';

// POST /api/floor/bills/:id/lines { itemId, qty, note }: adds a menu item to the open bill.
export const POST = floorApi(async ({ request, params, db, venue, actor }) => {
  const body = await jsonBody(request);
  const note = typeof body.note === 'string' ? body.note.replace(/\s+/g, ' ').trim() : '';
  const ok = await addLine(
    db,
    venue.id,
    Number(params.id),
    Number(body.itemId),
    Math.round(Number(body.qty) || 1),
    note || null,
    actor.name,
  );
  if (!ok) throw new HttpError(404, 'notFound');
  return { bill: billView((await billOfVenue(db, venue.id, Number(params.id)))!, venue) };
});
