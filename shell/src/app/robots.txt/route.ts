import { loadPlugin } from '@/generated/app';
import { getOrigins, getPlace } from '@/lib/place';

// /robots.txt for every hostname of the instance. Pages say themselves whether search engines
// may index them (the layout says no; an app's public pages, like a shop, say yes). An app with
// a sitemap at /api/sitemap.xml (the Store, ADR 0057 in DevQuake) has it listed here.

export async function GET() {
  const lines = ['User-agent: *', 'Disallow: /instance/', 'Disallow: /api/'];
  const place = await getPlace().catch(() => null);
  if (place?.kind === 'app') {
    const plugin = await loadPlugin(place.id);
    if (plugin.api?.['/sitemap.xml']) {
      const origin = (await getOrigins()).app(place.id);
      // The shop's product photos may show in image search and link previews.
      lines.push(
        'Allow: /api/s/',
        'Allow: /api/sitemap.xml',
        '',
        `Sitemap: ${origin}/api/sitemap.xml`,
      );
    }
  }
  return new Response(`${lines.join('\n')}\n`, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

export const dynamic = 'force-dynamic';
