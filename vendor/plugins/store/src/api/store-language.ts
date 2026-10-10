import { api, mine } from '../lib/api';
import { HttpError } from '../lib/http';
import { deleteLanguage, languageMessages } from '../lib/languages-data';
import { LANGUAGE_CODE } from '../lib/store-i18n';

function codeOf(params: Record<string, string>) {
  const code = params.code ?? '';
  if (!LANGUAGE_CODE.test(code)) throw new HttpError(404, 'notFound');
  return code;
}

// GET /api/store/languages/:code: the shop's own labels of a language, to change them again.
export const GET = api('settings', async ({ params, db, store }) => {
  const code = codeOf(params);
  const messages = await languageMessages(db, mine(store).id, code);
  if (!messages) throw new HttpError(404, 'notFound');
  return new Response(JSON.stringify(messages, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="store-labels-${code}.json"`,
      'Cache-Control': 'no-store',
    },
  });
});

// DELETE /api/store/languages/:code: the shop goes back to the built-in labels.
export const DELETE = api('settings', async ({ params, db, store }) => {
  await deleteLanguage(db, mine(store).id, codeOf(params));
});
