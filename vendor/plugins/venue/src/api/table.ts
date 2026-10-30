import { jsonBody, ownerApi } from '../lib/api';
import { listTables, newTableCode, removeTable, updateTable } from '../lib/floor';
import { HttpError } from '../lib/http';
import { tableInput } from './tables';

// PUT /api/tables/:id { name, seats } or { newCode: true } (a lost or copied sticker); DELETE.
export const PUT = ownerApi(async ({ request, params, db, venue }) => {
  const body = await jsonBody(request);
  const id = Number(params.id);
  let ok: boolean;
  if (body.newCode === true) ok = await newTableCode(db, venue.id, id);
  else {
    const input = tableInput(body);
    ok = await updateTable(db, venue.id, id, input.name, input.seats);
  }
  if (!ok) throw new HttpError(404, 'notFound');
  return { tables: await listTables(db, venue.id) };
});

export const DELETE = ownerApi(async ({ params, db, venue }) => {
  if (!(await removeTable(db, venue.id, Number(params.id)))) throw new HttpError(404, 'notFound');
  return { tables: await listTables(db, venue.id) };
});
