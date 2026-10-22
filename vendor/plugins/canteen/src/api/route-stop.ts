import { api } from '../lib/api';
import { markDelivered, unassign } from '../lib/routes-data';
import { id, longOptionalText, readBody, routeDay } from '../lib/validate';

// PUT /api/orgs/:id/routes/:day/stops/:personId { delivered?, note? }: the driver of the route
// ticks the package as handed over (or unticks it) and/or leaves a comment; planners may too.
// Every such write raises the app's change counter, so open planners refresh within ~10 s
// (ADR 0041): live progress without holding connections open.
export const PUT = api(async ({ request, params, db, user }) => {
  const body = await readBody(request);
  await markDelivered(db, id(params.id), user.id, routeDay(params.day), id(params.personId), {
    delivered: typeof body.delivered === 'boolean' ? body.delivered : undefined,
    note: 'note' in body ? longOptionalText(body.note, 'deliveryNote', 500) : undefined,
  });
});

// DELETE …: takes the person off the day's routes.
export const DELETE = api(async ({ params, db, user }) => {
  await unassign(db, id(params.id), user.id, routeDay(params.day), id(params.personId));
});
