import { api, mine } from '../lib/api';
import { newsletterById } from '../lib/newsletter-data';
import { sendNewsletterBatch } from '../lib/shop-mail';
import { HttpError } from '../lib/http';
import { id } from '../lib/validate';

// POST /api/newsletters/:id/batch: sends the next few emails and answers the progress.
export const POST = api('marketing', async ({ params, db, store, ctx }) => {
  const shop = mine(store);
  const newsletterId = id(params.id);
  await sendNewsletterBatch(db, shop, newsletterId, ctx.baseUrl);
  const n = await newsletterById(db, shop.id, newsletterId);
  if (!n) throw new HttpError(404, 'notFound');
  return { recipients: n.recipients, sent: n.sentCount, failed: n.failedCount, status: n.status };
});
