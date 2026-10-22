import { api } from '../lib/api';
import { readIdentity, saveIdentity } from '../lib/data';
import { id, identityInput, readBody } from '../lib/validate';

// GET /api/orgs/:id/people/:personId/identity: the CNP and ID card number (organisers; logged).
export const GET = api(async ({ params, db, user }) =>
  readIdentity(db, id(params.id), id(params.personId), user.id),
);

// PUT … { idSeries, idNumber, cnp }: stored encrypted (organisers; logged).
export const PUT = api(async ({ request, params, db, user }) => {
  await saveIdentity(
    db,
    id(params.id),
    id(params.personId),
    user.id,
    identityInput(await readBody(request)),
  );
});
