// Tracking tags and site verification the owner adds to the shop's pages (ADR 0058): Google
// Analytics 4, Google Ads, Google Tag Manager, the Meta pixel, search engines' verification
// codes and their own snippets for anything else. Pure and tested (tracking.test.ts).
//
// Only the owner may set them (they run for every buyer, on the same site as the team's
// pages). Buyers in the EU choose first: Google's tags load with Consent Mode v2 and everything
// denied until they accept; the Meta pixel and the owner's own snippets load only after.

export const TRACKING_LIMITS = { snippet: 20_000, verification: 100 } as const;

export interface Tracking {
  /** GA4 measurement ID, "G-XXXXXXX". */
  ga4: string | null;
  /** Google Ads conversion ID, "AW-123456789". */
  googleAds: string | null;
  /** Google Tag Manager container, "GTM-XXXXXX". */
  gtm: string | null;
  /** Meta (Facebook) pixel ID, digits. */
  metaPixel: string | null;
  /** google-site-verification content. */
  googleVerification: string | null;
  /** msvalidate.01 (Bing Webmaster Tools) content. */
  bingVerification: string | null;
  /** The owner's HTML for <head> and for the end of <body>, run after consent. */
  headSnippet: string | null;
  bodySnippet: string | null;
}

export const EMPTY_TRACKING: Tracking = {
  ga4: null,
  googleAds: null,
  gtm: null,
  metaPixel: null,
  googleVerification: null,
  bingVerification: null,
  headSnippet: null,
  bodySnippet: null,
};

const PATTERNS = {
  ga4: /^G-[A-Z0-9]{4,16}$/,
  googleAds: /^AW-\d{6,14}$/,
  gtm: /^GTM-[A-Z0-9]{4,12}$/,
  metaPixel: /^\d{8,20}$/,
  googleVerification: /^[A-Za-z0-9_-]{10,100}$/,
  bingVerification: /^[A-Fa-f0-9]{16,64}$/,
} as const;

export type TrackingProblem = keyof typeof PATTERNS | 'snippetTooLong';

/** "<meta name="google-site-verification" content="abc" />" or "abc" → "abc". */
export function verificationCode(text: string): string {
  return text.match(/content=["']([^"']+)["']/)?.[1]?.trim() ?? text.trim();
}

/** Checks the form; answers the clean settings or the first field that is wrong. */
export function parseTracking(
  value: unknown,
): { ok: true; tracking: Tracking } | { ok: false; problem: TrackingProblem } {
  const v = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
  const text = (k: string) => (typeof v[k] === 'string' ? (v[k] as string).trim() : '');
  const out: Tracking = { ...EMPTY_TRACKING };
  for (const key of Object.keys(PATTERNS) as Array<keyof typeof PATTERNS>) {
    let raw = text(key);
    if (key === 'googleVerification' || key === 'bingVerification') raw = verificationCode(raw);
    if (key === 'ga4' || key === 'googleAds' || key === 'gtm') raw = raw.toUpperCase();
    if (!raw) continue;
    if (!PATTERNS[key].test(raw)) return { ok: false, problem: key };
    out[key] = raw;
  }
  for (const key of ['headSnippet', 'bodySnippet'] as const) {
    const raw = text(key);
    if (raw.length > TRACKING_LIMITS.snippet) return { ok: false, problem: 'snippetTooLong' };
    out[key] = raw || null;
  }
  return { ok: true, tracking: out };
}

/** Stored settings (JSON) as Tracking; null when there are none or they do not parse. */
export function storedTracking(value: unknown): Tracking | null {
  if (typeof value !== 'string' || !value) return null;
  try {
    const r = parseTracking(JSON.parse(value));
    return r.ok && hasTracking(r.tracking) ? r.tracking : null;
  } catch {
    return null;
  }
}

/** Anything that needs the buyer's consent (verification codes do not). */
export function needsConsent(t: Tracking | null): boolean {
  return Boolean(
    t && (t.ga4 || t.googleAds || t.gtm || t.metaPixel || t.headSnippet || t.bodySnippet),
  );
}

export function hasTracking(t: Tracking): boolean {
  return Object.values(t).some((x) => x !== null);
}

/**
 * The Google tag's script for the given IDs, with Consent Mode v2 defaults (everything denied
 * unless `granted`). IDs are checked by parseTracking, so they are safe inside the script.
 */
export function gtagScript(t: Tracking, granted: boolean): string {
  const state = granted ? 'granted' : 'denied';
  const ids = [t.ga4, t.googleAds].filter(Boolean) as string[];
  return [
    'window.dataLayer = window.dataLayer || [];',
    'function gtag(){dataLayer.push(arguments);}',
    `gtag('consent', 'default', { analytics_storage: '${state}', ad_storage: '${state}', ad_user_data: '${state}', ad_personalization: '${state}', wait_for_update: 500 });`,
    "gtag('js', new Date());",
    ...ids.map((id) => `gtag('config', '${id}');`),
  ].join('\n');
}

/** Google Tag Manager's loader for a checked container ID. */
export function gtmScript(id: string): string {
  return `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${id}');`;
}

/** The Meta pixel's base code for a checked ID. */
export function metaPixelScript(id: string): string {
  return `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${id}');fbq('track','PageView');`;
}
