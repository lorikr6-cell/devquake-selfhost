import { api } from '../lib/api';
import { saveHeaderLook } from '../lib/org-page';
import { id, readBody } from '../lib/validate';

// PUT /api/orgs/:id/header { font, bg, text, align }: organisers change how the header looks.
export const PUT = api(async ({ request, params, db, user }) => {
  const { font, bg, text, align } = await readBody(request);
  await saveHeaderLook(db, id(params.id), user.id, { font, bg, text, align });
});
