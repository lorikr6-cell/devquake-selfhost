import { TABLE_CODE } from '../lib/bill';
import { tableByCode } from '../lib/floor';
import { floorApi } from '../lib/floor-api';
import { HttpError } from '../lib/http';

// GET /api/floor/sticker/:code: the table a scanned sticker belongs to (this venue's only).
export const GET = floorApi(async ({ params, db, venue }) => {
  const code = params.code ?? '';
  const table = TABLE_CODE.test(code) ? await tableByCode(db, code) : null;
  if (!table || table.venueId !== venue.id) throw new HttpError(404, 'notFound');
  return { table: { id: table.id, name: table.name } };
});
