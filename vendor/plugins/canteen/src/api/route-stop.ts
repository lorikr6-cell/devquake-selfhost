import { api } from '../lib/api';
import { withRouteNotice } from '../lib/notify';
import { markDelivered, unassign } from '../lib/routes-data';
import { id, longOptionalText, readBody, routeDay } from '../lib/validate';

// PUT /api/orgs/:id/routes/:day/stops/:personId { delivered?, note? }: the driver of the route
// ticks the package as handed over (or unticks it) and/or leaves a comment; planners may too.
// Every such write raises the app's change counter, so open planners refresh within ~10 s
// (ADR 0041): live progress without holding connections open. When a planner does it, the
// driver is told on their phone (ADR 0084); the driver's own ticks tell nobody.
export const PUT = api(async (scope) => {
  const { request, params, db, user } = scope;
  const body = await readBody(request);
  const orgId = id(params.id);
  const day = routeDay(params.day);
  await withRouteNotice(scope, orgId, day, () =>
    markDelivered(db, orgId, user.id, day, id(params.personId), {
      delivered: typeof body.delivered === 'boolean' ? body.delivered : undefined,
      note: 'note' in body ? longOptionalText(body.note, 'deliveryNote', 500) : undefined,
    }),
  );
});

// DELETE …: takes the person off the day's routes; their driver is told.
export const DELETE = api(async (scope) => {
  const { params, db, user } = scope;
  const orgId = id(params.id);
  const day = routeDay(params.day);
  await withRouteNotice(scope, orgId, day, () =>
    unassign(db, orgId, user.id, day, id(params.personId)),
  );
});
