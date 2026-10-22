import { api } from '../lib/api';
import { addPaper, readPaper } from '../lib/med-papers';
import { id } from '../lib/validate';

// POST /api/orgs/:id/people/:personId/med-papers (multipart: title, file = a PDF up to 5 MB or
// a photo shrunk in the browser): medical staff; stored encrypted.
export const POST = api(async ({ request, params, db, user }) => {
  const paperId = await addPaper(
    db,
    id(params.id),
    id(params.personId),
    user.id,
    await readPaper(request),
  );
  return { id: paperId };
});
