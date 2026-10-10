import { api, mine } from '../lib/api';
import { duplicateProduct } from '../lib/data';
import { localeOf, translator } from '../i18n';
import { id } from '../lib/validate';

// POST /api/products/:id/duplicate: a draft copy (options and field values, no photos).
export const POST = api('products', async ({ params, db, store, ctx }) => {
  const t = translator(localeOf(ctx), 'products');
  const copy = await duplicateProduct(db, mine(store).id, id(params.id), (name) =>
    t('copyName', { name }),
  );
  return { id: copy };
});
