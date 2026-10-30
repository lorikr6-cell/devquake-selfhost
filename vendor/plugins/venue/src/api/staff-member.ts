import { badInput, jsonBody, ownerApi } from '../lib/api';
import { listStaff, removeStaff, setStaffPin } from '../lib/data';
import { HttpError } from '../lib/http';
import { checkPin } from '../lib/model';

// PUT /api/staff/:id { pin }: a new PIN; DELETE: off the list (past orders keep their name).
export const PUT = ownerApi(async ({ request, params, db, venue }) => {
  const pin = checkPin((await jsonBody(request)).pin);
  if (!pin.ok) throw badInput(pin);
  if (!(await setStaffPin(db, venue.id, Number(params.id), pin.value)))
    throw new HttpError(404, 'notFound');
  return { staff: await listStaff(db, venue.id) };
});

export const DELETE = ownerApi(async ({ params, db, venue }) => {
  if (!(await removeStaff(db, venue.id, Number(params.id)))) throw new HttpError(404, 'notFound');
  return { staff: await listStaff(db, venue.id) };
});
