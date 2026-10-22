import { api } from '../lib/api';
import { HttpError } from '../lib/http';
import { parseTime } from '../lib/meals';
import { LIMITS } from '../lib/model';
import { saveDriver, type DriverInput } from '../lib/routes-data';
import { id, optionalText, readBody, requiredText, weekdays, type Body } from '../lib/validate';

/** { name, phone, weekdays: [1..7], shiftFrom: "11:00", shiftTo: "14:00", active }. */
export function driverInput(body: Body): DriverInput {
  const shiftFromMin = parseTime(body.shiftFrom);
  const shiftToMin = parseTime(body.shiftTo);
  if (shiftFromMin === null || shiftToMin === null || shiftToMin <= shiftFromMin) {
    throw new HttpError(400, 'shiftRange');
  }
  return {
    name: requiredText(body.name, 'driverName', LIMITS.displayName),
    phone: optionalText(body.phone, 'phone', LIMITS.phone),
    userId:
      body.userId === null || body.userId === undefined || body.userId === ''
        ? null
        : id(body.userId),
    weekdays: weekdays(body.weekdays),
    shiftFromMin,
    shiftToMin,
    active: body.active !== false,
  };
}

// POST /api/orgs/:id/drivers: organisers and coordinators add a driver (no account needed).
export const POST = api(async ({ request, params, db, user }) => {
  const driverId = await saveDriver(
    db,
    id(params.id),
    user.id,
    driverInput(await readBody(request)),
  );
  return { id: driverId };
});
