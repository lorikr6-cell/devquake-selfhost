import { api } from '../lib/api';
import { storedContactEmail } from '../lib/contact-email';
import { HttpError } from '../lib/http';
import { DESCRIPTION_MAX, saveContactEmail, saveDescription, setPublicPage } from '../lib/org-page';
import { id, longOptionalText, readBody } from '../lib/validate';

// PUT /api/orgs/:id/page { description?, contactEmail?, publicPage? }: organisers change the organisation's
// own page; `publicPage` alone is the switch that saves itself.
export const PUT = api(async ({ request, params, db, user }) => {
  const body = await readBody(request);
  const orgId = id(params.id);
  if (typeof body.publicPage === 'boolean') {
    await setPublicPage(db, orgId, user.id, body.publicPage);
  }
  // Checked before anything is saved: a wrong address changes nothing.
  let contact: string | null | undefined;
  if ('contactEmail' in body) {
    contact = storedContactEmail(typeof body.contactEmail === 'string' ? body.contactEmail : '');
    if (contact === undefined) throw new HttpError(400, 'contactEmail');
  }
  if (contact !== undefined) await saveContactEmail(db, orgId, user.id, contact);
  if ('description' in body) {
    await saveDescription(
      db,
      orgId,
      user.id,
      longOptionalText(body.description, 'description', DESCRIPTION_MAX),
    );
  }
});
