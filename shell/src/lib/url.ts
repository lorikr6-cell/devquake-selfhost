import { configuredPublicUrl } from './env';

type HeaderBag = { get(name: string): string | null };

/** Behind Caddy (docker-compose.yml) or Hostinger's proxy, the original scheme is forwarded. */
export function isHttps(h: HeaderBag): boolean {
  const configured = configuredPublicUrl();
  if (configured) return configured.startsWith('https://');
  return (h.get('x-forwarded-proto') ?? '').split(',')[0]?.trim() === 'https';
}

/** The instance's address: PUBLIC_URL, else the host the request came to. */
export function publicUrl(h: HeaderBag): string {
  const configured = configuredPublicUrl();
  if (configured) return configured;
  const host = (h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000')
    .split(',')[0]!
    .trim();
  return `${isHttps(h) ? 'https' : 'http'}://${host}`;
}

/** Same-origin check for requests that change something (cookies are SameSite=Lax too). */
export function sameOrigin(request: Request, h: HeaderBag): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true; // same-origin GETs and non-browser clients send none
  try {
    const host = (h.get('x-forwarded-host') ?? h.get('host') ?? '').split(',')[0]!.trim();
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
