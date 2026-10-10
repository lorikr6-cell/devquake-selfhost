import { api, mine } from '../lib/api';
import { HttpError } from '../lib/http';
import { shopMailConfigured } from '../lib/mailer';
import { newsletterById, startSending } from '../lib/newsletter-data';
import { sendNewsletterBatch } from '../lib/shop-mail';
import { id } from '../lib/validate';

// POST /api/newsletters/:id/send: queues the draft for every confirmed subscriber and sends a
// first batch. The page then asks for the next batches (/batch); the hourly job finishes the
// rest when the page is closed.
export const POST = api('marketing', async ({ params, db, store, ctx }) => {
  if (!shopMailConfigured()) throw new HttpError(503, 'mailOff');
  const shop = mine(store);
  if (!shop.published) throw new HttpError(409, 'shopClosed');
  const newsletterId = id(params.id);
  const recipients = await startSending(db, shop.id, newsletterId);
  await sendNewsletterBatch(db, shop, newsletterId, ctx.baseUrl);
  const n = await newsletterById(db, shop.id, newsletterId);
  return { recipients, sent: n?.sentCount ?? 0, failed: n?.failedCount ?? 0, status: n?.status };
});
