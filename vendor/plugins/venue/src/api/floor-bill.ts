import { billView } from '../lib/bill-view';
import { billOfVenue } from '../lib/floor';
import { floorApi } from '../lib/floor-api';
import { HttpError } from '../lib/http';

// GET /api/floor/bills/:id: a bill of the venue with its lines and totals (polled by the table).
export const GET = floorApi(async ({ params, db, venue }) => {
  const bill = await billOfVenue(db, venue.id, Number(params.id));
  if (!bill) throw new HttpError(404, 'notFound');
  return { bill: billView(bill, venue) };
});
