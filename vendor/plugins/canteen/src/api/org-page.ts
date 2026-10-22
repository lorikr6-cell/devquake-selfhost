import { api } from '../lib/api';
import { DESCRIPTION_MAX, saveDescription, setPublicPage } from '../lib/org-page';
import { id, longOptionalText, readBody } from '../lib/validate';

// PUT /api/orgs/:id/page { description?, publicPage? }: organisers change the organisation's
// own page; `publicPage` alone is the switch that saves itself.
export const PUT = api(async ({ request, params, db, user }) => {
  const body = await readBody(request);
  const orgId = id(params.id);
  if (typeof body.publicPage === 'boolean') {
    await setPublicPage(db, orgId, user.id, body.publicPage);
  }
  if ('description' in body) {
    await saveDescription(
      db,
      orgId,
      user.id,
      longOptionalText(body.description, 'description', DESCRIPTION_MAX),
    );
  }
});
