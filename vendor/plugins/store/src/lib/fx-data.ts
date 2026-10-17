import { ecbDate, parseEcbRates, type Rates } from './fx';

// The European Central Bank's daily reference rates (ADR 0061), fetched by the server at most
// every six hours and kept in memory. A failed fetch keeps the last rates; without any, shops
// show no approximate prices. Nothing about the visitor is sent.

const ECB_URL = 'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml';
const FRESH_MS = 6 * 60 * 60 * 1000;
const RETRY_MS = 10 * 60 * 1000;

type Cache = { rates: Rates | null; date: string | null; fetchedAt: number; triedAt: number };
const g = globalThis as unknown as { dqStoreFx?: Cache; dqStoreFxLoading?: Promise<void> };

async function refresh(): Promise<void> {
  const cache = (g.dqStoreFx ??= { rates: null, date: null, fetchedAt: 0, triedAt: 0 });
  cache.triedAt = Date.now();
  try {
    const res = await fetch(ECB_URL, { signal: AbortSignal.timeout(5000), cache: 'no-store' });
    if (!res.ok) return;
    const xml = await res.text();
    const rates = parseEcbRates(xml);
    if (rates) Object.assign(cache, { rates, date: ecbDate(xml), fetchedAt: Date.now() });
  } catch {
    // Keep the last rates.
  }
}

/** The latest rates (euros per currency) and their date, or null when none could be fetched. */
export async function currentRates(): Promise<{ rates: Rates; date: string | null } | null> {
  const cache = g.dqStoreFx;
  const now = Date.now();
  const stale = !cache || now - cache.fetchedAt > FRESH_MS;
  const mayTry = !cache || now - cache.triedAt > RETRY_MS;
  if (stale && mayTry) {
    g.dqStoreFxLoading ??= refresh().finally(() => {
      g.dqStoreFxLoading = undefined;
    });
    // Wait only when there is nothing to show yet; otherwise refresh in the background.
    if (!cache?.rates) await g.dqStoreFxLoading;
  }
  const c = g.dqStoreFx;
  return c?.rates ? { rates: c.rates, date: c.date } : null;
}
