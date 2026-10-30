import { jsonBody, ownerApi } from '../lib/api';
import { addTable, listTables } from '../lib/floor';
import { HttpError } from '../lib/http';

/** A table's name and seats from a request body. */
export function tableInput(body: Record<string, unknown>) {
  const name = String(body.name ?? '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!name) throw new HttpError(400, 'required', { field: 'name' });
  if (name.length > 40) throw new HttpError(400, 'tooLong', { field: 'name', max: 40 });
  const seats = Math.round(Number(body.seats ?? 4));
  if (!Number.isFinite(seats) || seats < 1 || seats > 99) throw new HttpError(400, 'seats');
  return { name, seats };
}

// POST /api/tables { name, seats }: a new table with its own sticker code (the owner's).
export const POST = ownerApi(async ({ request, db, venue }) => {
  const t = tableInput(await jsonBody(request));
  await addTable(db, venue.id, t.name, t.seats);
  return { tables: await listTables(db, venue.id) };
});
