import { jsonBody } from '../lib/api';
import { floorApi } from '../lib/floor-api';
import { HttpError } from '../lib/http';
import { isStation, markReady, stationTickets } from '../lib/station';

// The kitchen, bar or coffee screen (a key route like the floor: the owner or a tablet's staff).
// GET: what is still to make there, one ticket per bill, oldest first (the screen refreshes with
// it). POST { lineId } or { billId }: made (the waiter sees it ready to bring).

export const GET = floorApi(async ({ params, db, venue }) => {
  if (!isStation(params.station)) throw new HttpError(404, 'notFound');
  return { tickets: await stationTickets(db, venue.id, params.station) };
});

export const POST = floorApi(async ({ request, params, db, venue }) => {
  const station = params.station;
  if (!isStation(station)) throw new HttpError(404, 'notFound');
  const body = await jsonBody(request);
  if (Number.isInteger(Number(body.lineId)) && Number(body.lineId) > 0)
    await markReady(db, venue.id, { lineId: Number(body.lineId) });
  else if (Number.isInteger(Number(body.billId)) && Number(body.billId) > 0)
    await markReady(db, venue.id, { billId: Number(body.billId), station });
  else throw new HttpError(400, 'generic');
  return { tickets: await stationTickets(db, venue.id, station) };
});
