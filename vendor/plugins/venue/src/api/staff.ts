import { badInput, jsonBody, ownerApi } from '../lib/api';
import { addStaff, listStaff } from '../lib/data';
import { checkPin, checkStaff } from '../lib/model';

// Staff with PINs (ADR 0080): only the venue's owner, never from a tablet.

// GET /api/staff: the list (names, roles, whether a PIN is set; never the PIN).
export const GET = ownerApi(async ({ db, venue }) => ({ staff: await listStaff(db, venue.id) }));

// POST /api/staff { name, role, pin }: a new staff member with their PIN.
export const POST = ownerApi(async ({ request, db, venue }) => {
  const body = await jsonBody(request);
  const who = checkStaff(body);
  if (!who.ok) throw badInput(who);
  const pin = checkPin(body.pin);
  if (!pin.ok) throw badInput(pin);
  await addStaff(db, venue.id, who.value.name, who.value.role, pin.value);
  return { staff: await listStaff(db, venue.id) };
});
