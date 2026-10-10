import { api, mine } from '../lib/api';
import { addMessage, setThreadStatus, threadBuyer } from '../lib/buyers-data';
import { HttpError } from '../lib/http';
import { sendReplyNotice } from '../lib/shop-mail';
import { id, messageBody, readBody } from '../lib/validate';

// POST /api/messages/:id { body }: the shop answers a buyer, who gets an email about it.
export const POST = api('messages', async ({ request, params, db, store, user, ctx }) => {
  const shop = mine(store);
  const threadId = id(params.id);
  await addMessage(
    db,
    shop.id,
    threadId,
    { shop: true, name: user.displayName.slice(0, 80) },
    messageBody((await readBody(request)).body),
  );
  const to = await threadBuyer(db, shop.id, threadId);
  const mailed = to
    ? await sendReplyNotice(
        shop,
        ctx.baseUrl,
        to.buyer.email,
        to.subject,
        threadId,
        to.buyer.locale,
      )
    : false;
  return { mailed };
});

// PATCH /api/messages/:id { status: open | closed }
export const PATCH = api('messages', async ({ request, params, db, store }) => {
  const { status } = await readBody(request);
  if (status !== 'open' && status !== 'closed') throw new HttpError(400, 'invalidRequest');
  await setThreadStatus(db, mine(store).id, id(params.id), status);
});
