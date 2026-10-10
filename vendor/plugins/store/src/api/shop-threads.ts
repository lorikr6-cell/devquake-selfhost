import { shopApi } from '../lib/api';
import { startThread } from '../lib/buyers-data';
import { HttpError } from '../lib/http';
import { id, messageBody, messageSubject, readBody } from '../lib/validate';

// POST /api/s/:slug/account/messages { subject, body, orderId? }: a signed-in buyer writes to
// the shop, about one of their orders or not.
export const POST = shopApi(
  async ({ request, db, buyer }) => {
    const me = await buyer();
    if (!me) throw new HttpError(401, 'buyerSignIn');
    const body = await readBody(request, 16 * 1024);
    const orderId =
      body.orderId === undefined || body.orderId === null || body.orderId === ''
        ? null
        : id(body.orderId);
    const threadId = await startThread(db, me, {
      subject: messageSubject(body.subject),
      body: messageBody(body.body),
      orderId,
    });
    return { id: threadId };
  },
  { limit: 5, sameSite: true },
);
