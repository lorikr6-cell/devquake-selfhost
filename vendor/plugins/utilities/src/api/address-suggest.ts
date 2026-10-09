import { api } from '../lib/api';
import {
  SUGGEST_FIELDS,
  isCountryCode,
  photonUrl,
  suggestionsFrom,
  type SuggestField,
  type SuggestQuery,
} from '../lib/address';
import { HttpError } from '../lib/http';

// GET /api/address-suggest?field=state|city|street&q=...&country=RO[&state=...][&city=...]
// Address suggestions for the profile form, from OpenStreetMap through Photon (komoot). Only for
// signed-in people (not an open proxy); answers are cached for a day; when Photon is slow or
// down the answer is simply empty and the person types the address.

const CACHE_MS = 24 * 60 * 60 * 1000;
const CACHE_MAX = 500;
const cache = new Map<string, { at: number; suggestions: string[] }>();

const text = (value: string | null, max: number) =>
  (value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

export const GET = api(async ({ request }) => {
  const params = new URL(request.url).searchParams;
  const field = params.get('field') as SuggestField;
  const countryCode = (params.get('country') ?? '').toUpperCase();
  const q = text(params.get('q'), 80);
  if (!(SUGGEST_FIELDS as readonly string[]).includes(field) || !isCountryCode(countryCode)) {
    throw new HttpError(400, 'invalidRequest');
  }
  if (q.length < 2) return { suggestions: [] };
  const query: SuggestQuery = {
    field,
    q,
    countryCode,
    state: text(params.get('state'), 100) || undefined,
    city: text(params.get('city'), 100) || undefined,
  };

  const key = JSON.stringify(query).toLowerCase();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return { suggestions: hit.suggestions };

  let suggestions: string[] = [];
  try {
    const res = await fetch(photonUrl(query), {
      headers: { 'User-Agent': 'DevQuake-Utilities (https://utilities.devquake.com)' },
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) suggestions = suggestionsFrom(await res.json(), query);
  } catch {
    // Photon unavailable or slow: no suggestions this time.
    return { suggestions: [] };
  }
  if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value!);
  cache.set(key, { at: Date.now(), suggestions });
  return { suggestions };
});
