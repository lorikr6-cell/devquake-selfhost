import { api, mine } from '../lib/api';
import { localeOf } from '../i18n';
import { HttpError } from '../lib/http';
import { sendShopMail, shopMailConfigured } from '../lib/mailer';
import { newsletterById } from '../lib/newsletter-data';
import { composeNewsletter } from '../lib/shop-mail';
import { emailAddress, id, readBody } from '../lib/validate';

// POST /api/newsletters/:id/test { email }: the newsletter to one address, to check it.
export const POST = api('marketing', async ({ request, params, db, store, ctx }) => {
  if (!shopMailConfigured()) throw new HttpError(503, 'mailOff');
  const shop = mine(store);
  const to = emailAddress((await readBody(request)).email);
  const n = await newsletterById(db, shop.id, id(params.id));
  if (!n) throw new HttpError(404, 'notFound');
  const mail = await composeNewsletter(db, shop, n, ctx.baseUrl, localeOf(ctx), to, null);
  if (!(await sendShopMail(shop, { ...mail, subject: `[TEST] ${mail.subject}` })))
    throw new HttpError(502, 'mailFailed');
});
