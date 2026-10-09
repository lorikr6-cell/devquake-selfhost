import { api } from '../lib/api';
import { createList, listsForUser } from '../lib/data';
import { currency, readBody, requiredText, shopDate } from '../lib/validate';

// GET /api/lists: my lists. POST /api/lists { name, currency, shopDate }: create one.
export const GET = api(async ({ db, user }) => ({ lists: await listsForUser(db, user.id) }));

export const POST = api(async ({ request, db, user }) => {
  const body = await readBody(request);
  const id = await createList(
    db,
    user,
    requiredText(body.name, 'listName', 80),
    currency(body.currency),
    shopDate(body.shopDate),
  );
  return Response.json({ id }, { status: 201 });
});
