import { shopApi } from '../lib/api';
import { HttpError } from '../lib/http';
import { confirmSubscriber, subscriberByToken } from '../lib/newsletter-data';
import { readBody } from '../lib/validate';

// POST /api/s/:slug/newsletter/confirm { token }: the subscriber confirms their address with a
// button on the page the email links to, so link checkers in mail programs confirm nothing.
export const POST = shopApi(
  async ({ request, db, store }) => {
    const { token } = await readBody(request, 4096);
    const subscriber = await subscriberByToken(db, store.id, String(token ?? ''));
    if (!subscriber) throw new HttpError(404, 'linkGone');
    await confirmSubscriber(db, subscriber.id);
  },
  { limit: 10, sameSite: true },
);
