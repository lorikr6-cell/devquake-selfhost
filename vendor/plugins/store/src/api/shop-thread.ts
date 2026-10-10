import { shopApi } from '../lib/api';
import { addMessage } from '../lib/buyers-data';
import { HttpError } from '../lib/http';
import { id, messageBody, readBody } from '../lib/validate';

// POST /api/s/:slug/account/messages/:id { body }: the buyer answers in their conversation.
export const POST = shopApi(
  async ({ request, params, db, store, buyer }) => {
    const me = await buyer();
    if (!me) throw new HttpError(401, 'buyerSignIn');
    const { body } = await readBody(request, 16 * 1024);
    await addMessage(db, store.id, id(params.id), { buyer: me }, messageBody(body));
  },
  { limit: 10, sameSite: true },
);
