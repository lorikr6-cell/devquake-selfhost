import { api, mine } from '../lib/api';
import { createType } from '../lib/catalog-data';
import { isTemplateId, templateType } from '../i18n/type-templates';
import { localeOf } from '../i18n';
import { readBody, typeInput } from '../lib/validate';

// POST /api/types { name, fields } or { template }: a product type with its fields; a template
// (electronics, clothing…) is made in the page language.
export const POST = api('products', async ({ request, db, store, ctx }) => {
  const body = await readBody(request);
  const input = isTemplateId(body.template)
    ? templateType(body.template, localeOf(ctx))
    : typeInput(body);
  const id = await createType(db, mine(store).id, input);
  return { id };
});
