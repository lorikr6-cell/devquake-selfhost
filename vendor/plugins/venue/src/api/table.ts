import { jsonBody, ownerApi } from '../lib/api';
import { setSection } from '../lib/calls';
import { listTables, newTableCode, removeTable, updateTable } from '../lib/floor';
import { HttpError } from '../lib/http';
import { tableInput } from './tables';

// PUT /api/tables/:id { name, seats }, { newCode: true } (a lost or copied sticker) or
// { waiterId } (the table's section; null: none); DELETE.
export const PUT = ownerApi(async ({ request, params, db, venue }) => {
  const body = await jsonBody(request);
  const id = Number(params.id);
  let ok: boolean;
  if (body.newCode === true) ok = await newTableCode(db, venue.id, id);
  else if ('waiterId' in body)
    ok = await setSection(db, venue.id, id, body.waiterId === null ? null : Number(body.waiterId));
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
