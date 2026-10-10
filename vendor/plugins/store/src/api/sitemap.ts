import type { PluginApiHandler } from '@devquake/plugin-sdk';
import { listProducts, publishedStores, storeBySlug } from '../lib/data';

const XML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
};
const escape = (s: string) => s.replace(/[&<>"']/g, (c) => XML_ESCAPES[c]!);

// GET /api/sitemap.xml: every published shop and product, for search engines (the instance's
// robots.txt points here; ADR 0057).
export const GET: PluginApiHandler = async (_request, { ctx }) => {
  const urls: Array<{ loc: string; lastmod: string | null }> = [];
  if (ctx.db) {
    for (const s of await publishedStores(ctx.db)) {
      urls.push({ loc: `${ctx.baseUrl}/s/${s.slug}`, lastmod: s.updatedAt });
      urls.push({ loc: `${ctx.baseUrl}/s/${s.slug}/info`, lastmod: s.updatedAt });
      const store = await storeBySlug(ctx.db, s.slug);
      if (!store) continue;
      for (const p of await listProducts(ctx.db, store.id, { publishedOnly: true })) {
        urls.push({ loc: `${ctx.baseUrl}/s/${s.slug}/p/${p.slug}`, lastmod: p.updatedAt });
      }
      if (urls.length > 45_000) break;
    }
  }
  const entries = urls.map(
    (u) =>
      `  <url><loc>${escape(u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod.slice(0, 10)}</lastmod>` : ''}</url>`,
  );
  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    '</urlset>',
    '',
  ].join('\n');
  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
