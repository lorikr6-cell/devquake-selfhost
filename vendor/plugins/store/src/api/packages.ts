import { api, mine } from '../lib/api';
import { checkPackage } from '../lib/claims';
import { archivePackage, createPackage, listPackages } from '../lib/claims-data';
import { HttpError } from '../lib/http';

// NPS point packages (ADR 0079): DevQuake staff keep them in their shop for claims (prizes,
// rewards). Never listed or sold. Staff only: a member who is a DevQuake admin, in their shop.

function staffOnly(isAdmin: boolean) {
  if (!isAdmin) throw new HttpError(403, 'forbidden');
}

// GET /api/packages: the shop's packages.
export const GET = api('marketing', async ({ db, store, user }) => {
  staffOnly(user.isAdmin);
  return { packages: await listPackages(db, mine(store).id) };
});

// POST /api/packages { name, points }: a new package.
export const POST = api('marketing', async ({ db, store, user, request }) => {
  staffOnly(user.isAdmin);
  const body = (await request.json().catch(() => ({}))) as { name?: unknown; points?: unknown };
  const checked = checkPackage(body);
  if (!checked.ok)
    throw new HttpError(400, checked.error === 'name' ? 'packageName' : 'packagePoints');
  await createPackage(db, mine(store).id, checked.name, checked.points);
  return { packages: await listPackages(db, mine(store).id) };
});

// DELETE /api/packages?id=…: archived (claims made from it keep its name and points).
export const DELETE = api('marketing', async ({ db, store, user, request }) => {
  staffOnly(user.isAdmin);
  const id = Number(new URL(request.url).searchParams.get('id'));
  if (!Number.isInteger(id) || !(await archivePackage(db, mine(store).id, id)))
    throw new HttpError(404, 'notFound');
  return { packages: await listPackages(db, mine(store).id) };
});
