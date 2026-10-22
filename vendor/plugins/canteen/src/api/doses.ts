import { api } from '../lib/api';
import { isIsoDate } from '../lib/dates';
import { HttpError } from '../lib/http';
import { parseTime } from '../lib/meals';
import { isDoseStatus } from '../lib/medical';
import { recordDose } from '../lib/medical-data';
import { id, readBody } from '../lib/validate';

// PUT /api/orgs/:id/doses { medicationId, day, time: "08:00", status }: medical staff record a
// scheduled dose as given, refused or missed.
export const PUT = api(async ({ request, params, db, user }) => {
  const body = await readBody(request);
  const time = parseTime(body.time);
  if (!isIsoDate(body.day) || time === null || !isDoseStatus(body.status)) {
    throw new HttpError(400, 'invalidRequest');
  }
  await recordDose(db, id(params.id), user.id, id(body.medicationId), body.day, time, body.status);
});
