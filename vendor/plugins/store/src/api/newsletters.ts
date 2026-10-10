import { api, mine } from '../lib/api';
import { createNewsletter } from '../lib/newsletter-data';
import { newsletterInput, readBody } from '../lib/validate';

// POST /api/newsletters { subject, preheader, heading, intro, voucherId, products: [{ productId,
// section: promo | new }] }: a draft email campaign.
export const POST = api('marketing', async ({ request, db, store }) => {
  const id = await createNewsletter(db, mine(store).id, newsletterInput(await readBody(request)));
  return { id };
});
