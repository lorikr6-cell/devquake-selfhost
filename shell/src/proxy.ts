import { NextResponse, type NextRequest } from 'next/server';
import { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE, isLocale, stripLocale } from '@devquake/ui';

// Languages in the URL, as on DevQuake (ADR 0011): /de/…, /ro/…, /hu/…; English has no prefix.
// The prefix is removed before routing and the language passed on in a request header. API
// calls carry no prefix: they use the remembered language.

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const { locale, path } = stripLocale(pathname);
  const headers = new Headers(request.headers);

  if (locale === 'en') {
    const res = NextResponse.redirect(new URL(`${path}${search}`, request.url));
    res.cookies.set(LOCALE_COOKIE, 'en', { path: '/', maxAge: LOCALE_COOKIE_MAX_AGE });
    return res;
  }
  if (locale) {
    if (path.startsWith('/api/')) {
      return NextResponse.redirect(new URL(`${path}${search}`, request.url));
    }
    headers.set('x-dq-locale', locale);
    // When the server sees the rewrite as external (it listens on another host name than the
    // URL's), the request comes back here without the prefix but with this header: kept below.
    const res = NextResponse.rewrite(new URL(`${path}${search}`, request.url), {
      request: { headers },
    });
    if (request.cookies.get(LOCALE_COOKIE)?.value !== locale) {
      res.cookies.set(LOCALE_COOKIE, locale, { path: '/', maxAge: LOCALE_COOKIE_MAX_AGE });
    }
    return res;
  }
  const saved = request.cookies.get(LOCALE_COOKIE)?.value;
  const passed = request.headers.get('x-dq-locale');
  // A page opened without a prefix goes to the language the visitor chose before (not a
  // rewrite coming back, which already has its language).
  const isDocument =
    request.method === 'GET' && request.headers.get('sec-fetch-dest') === 'document';
  if (
    isDocument &&
    !isLocale(passed) &&
    isLocale(saved) &&
    saved !== 'en' &&
    !path.startsWith('/api/')
  ) {
    return NextResponse.redirect(
      new URL(`/${saved}${path === '/' ? '' : path}${search}`, request.url),
    );
  }
  // Already chosen by the prefix (a rewrite that came back), else the remembered language for
  // API calls, else English. A forged header only changes the language of the reply.
  headers.set(
    'x-dq-locale',
    isLocale(passed) ? passed : path.startsWith('/api/') && isLocale(saved) ? saved : 'en',
  );
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ['/((?!_next/|favicon.ico).*)'],
};
