import { api } from '../lib/api';
import { isCountryCode } from '../lib/address';
import { HttpError } from '../lib/http';
import { suggestionsFor } from '../lib/provider-catalog';
import { readBody } from '../lib/validate';

// POST /api/utility-suggestions { countryCode, region }: utility services to suggest for the
// country and county / state the person confirmed (or typed). Nothing is saved.
export const POST = api(async ({ request }) => {
  const body = await readBody(request);
  const countryCode = typeof body.countryCode === 'string' ? body.countryCode.toUpperCase() : '';
  if (!isCountryCode(countryCode)) throw new HttpError(400, 'invalidRequest');
  const region =
    typeof body.region === 'string' ? body.region.replace(/\s+/g, ' ').trim().slice(0, 100) : '';
  const suggestions = suggestionsFor(countryCode, region || null);
  return { currency: suggestions?.currency ?? null, services: suggestions?.services ?? [] };
});
