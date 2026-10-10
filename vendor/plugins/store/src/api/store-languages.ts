import { isLocale, type Locale } from '@devquake/ui';
import { appMessages } from '../i18n';
import { api, mine } from '../lib/api';
import { HttpError } from '../lib/http';
import { saveLanguage, setDefaultLanguage } from '../lib/languages-data';
import { LANGUAGE_CODE, LANGUAGE_LIMITS, exportLabels, importLabels } from '../lib/store-i18n';
import { readBody, requiredText } from '../lib/validate';

// GET /api/store/languages?base=de: the labels buyers see, as JSON to translate.
export const GET = api('settings', async ({ request }) => {
  const base = new URL(request.url).searchParams.get('base');
  const locale: Locale = isLocale(base) ? base : 'en';
  return new Response(exportLabels(appMessages(locale)), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="store-labels-${locale}.json"`,
      'Cache-Control': 'no-store',
    },
  });
});

// POST /api/store/languages { code, name, base, text }: a translation pasted back, checked
// label by label; answers how many labels were taken, missing and refused.
export const POST = api('settings', async ({ request, db, store }) => {
  const body = await readBody(request, LANGUAGE_LIMITS.bytes + 16 * 1024);
  const code = typeof body.code === 'string' ? body.code.trim().toLowerCase() : '';
  if (!LANGUAGE_CODE.test(code)) throw new HttpError(400, 'languageCode');
  const name = requiredText(body.name, 'languageName', LANGUAGE_LIMITS.name);
  // Changes to a built-in language are checked against it; new ones against English.
  const base: Locale = isLocale(code) ? code : isLocale(body.base) ? body.base : 'en';
  const result = importLabels(typeof body.text === 'string' ? body.text : '', appMessages(base));
  if (!result) throw new HttpError(400, 'labelsJson');
  if (result.applied === 0) throw new HttpError(400, 'labelsEmpty');
  await saveLanguage(db, mine(store).id, { code, name, messages: result.messages });
  return {
    applied: result.applied,
    missing: result.missing,
    rejected: result.rejected.slice(0, 50),
    rejectedCount: result.rejected.length,
  };
});

// PUT /api/store/languages { defaultLanguage }: the language buyers see first (null: theirs).
export const PUT = api('settings', async ({ request, db, store }) => {
  const { defaultLanguage } = await readBody(request);
  await setDefaultLanguage(
    db,
    mine(store).id,
    typeof defaultLanguage === 'string' && defaultLanguage ? defaultLanguage : null,
  );
});
