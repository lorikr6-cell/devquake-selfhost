import { api } from '../lib/api';
import { deleteDriver, saveDriver } from '../lib/routes-data';
import { id, readBody } from '../lib/validate';
import { driverInput } from './drivers';

// PATCH /api/orgs/:id/drivers/:driverId: changes a driver, their days and shift.
export const PATCH = api(async ({ request, params, db, user }) => {
  await saveDriver(
    db,
    id(params.id),
    user.id,
    driverInput(await readBody(request)),
    id(params.driverId),
  );
});

// DELETE …: removes the driver with their routes.
export const DELETE = api(async ({ params, db, user }) => {
  await deleteDriver(db, id(params.id), id(params.driverId), user.id);
});
