import { localDateTimeToUtc } from '@devquake/ui';
import { api } from '../lib/api';
import { HttpError } from '../lib/http';
import { planVisit } from '../lib/social-data';
import { id, readBody } from '../lib/validate';

// POST /api/orgs/:id/visits { personId, plannedAt (local "YYYY-MM-DDTHH:mm"), kind, assignedTo }:
// plans a visit; the time is the visitor's own and stored in UTC (ADR 0010).
export const POST = api(async ({ request, params, db, user, timeZone }) => {
  const body = await readBody(request);
  const at =
    typeof body.plannedAt === 'string' ? localDateTimeToUtc(body.plannedAt, timeZone) : null;
  if (!at) throw new HttpError(400, 'date', { field: 'plannedAt' });
  const assigned = body.assignedTo;
  return {
    id: await planVisit(db, id(params.id), user.id, {
      personId: id(body.personId),
      plannedAt: at,
      kind: body.kind,
      assignedTo:
        assigned === null || assigned === undefined || assigned === '' ? null : id(assigned),
    }),
  };
});
