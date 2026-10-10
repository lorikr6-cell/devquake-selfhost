import { api, mine } from '../lib/api';
import { deleteNewsletter, updateNewsletter } from '../lib/newsletter-data';
import { id, newsletterInput, readBody } from '../lib/validate';

// PUT /api/newsletters/:id: only drafts change.
export const PUT = api('marketing', async ({ request, params, db, store }) => {
  await updateNewsletter(
    db,
    mine(store).id,
    id(params.id),
    newsletterInput(await readBody(request)),
  );
});

export const DELETE = api('marketing', async ({ params, db, store }) => {
  await deleteNewsletter(db, mine(store).id, id(params.id));
});
