import { api } from '../lib/api';
import { deleteEater, updateEater } from '../lib/data';
import { eaterInput, id, readBody } from '../lib/validate';

export const PATCH = api(async ({ request, params, db, user }) => {
  const { name, portion } = eaterInput(await readBody(request));
  await updateEater(db, id(params.id), id(params.eaterId), user.id, name, portion);
});

export const DELETE = api(async ({ params, db, user }) => {
  await deleteEater(db, id(params.id), id(params.eaterId), user.id);
});
