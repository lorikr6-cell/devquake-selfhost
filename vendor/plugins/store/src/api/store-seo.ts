import { api, mine } from '../lib/api';
import { updateSeo } from '../lib/data';
import { readBody, seoInput } from '../lib/validate';

// PUT /api/store/seo { seoTitle, seoDescription }: the shop's front page for search engines.
export const PUT = api('seo', async ({ request, db, store }) => {
  await updateSeo(db, mine(store).id, seoInput(await readBody(request)));
});
