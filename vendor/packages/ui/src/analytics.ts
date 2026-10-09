/**
 * Sends an event to Google Analytics, but only when the visitor accepted analytics cookies
 * (the host loads gtag after consent; without it this does nothing). The host tags every event
 * with the app it came from, so apps only send what happened.
 *
 * Never put personal data in `params` (no names, emails, list or product contents): only
 * counts, categories and yes/no flags.
 */
export function trackEvent(name: string, params?: Record<string, string | number | boolean>): void {
  if (typeof window === 'undefined') return;
  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
  if (typeof gtag === 'function') gtag('event', name, params ?? {});
}
