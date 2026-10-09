import { api } from '../lib/api';
import { createBill } from '../lib/data';
import { billInput, id, readBody } from '../lib/validate';

// POST /api/utilities/:id/bills: the owner adds a bill (the PDF follows with PUT .../file).
export const POST = api(async ({ request, params, db, user }) => {
  const billId = await createBill(db, id(params.id), user, billInput(await readBody(request)));
  return Response.json({ id: billId }, { status: 201 });
});
