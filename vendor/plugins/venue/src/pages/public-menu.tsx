import type { Metadata } from 'next';
import type { PluginPageProps } from '@devquake/plugin-sdk';
import { MenuBrowser, type PublicMenuData } from '../components/menu-browser';
import { localeOf, translator } from '../i18n';
import { menuOf, venueBySlug, type Venue } from '../lib/data';

type Db = NonNullable<PluginPageProps['ctx']['db']>;

/** A venue's public menu data (only what guests see). */
export async function publicMenu(db: Db, venue: Venue): Promise<PublicMenuData> {
  const menu = await menuOf(db, venue.id);
  return {
    name: venue.name,
    currency: venue.currency,
    decimals: venue.decimals,
    categories: menu.categories,
    items: menu.items.map((i) => ({
      id: i.id,
      categoryId: i.categoryId,
      name: i.name,
      description: i.description,
      priceMinor: i.priceMinor,
      allergens: i.allergens,
      available: i.available,
    })),
  };
}

/** A venue whose menu is public, or null (also without the database). */
async function load({ ctx, params }: PluginPageProps) {
  if (!ctx.db) return null;
  const venue = await venueBySlug(ctx.db, params.slug ?? '').catch(() => null);
  if (!venue || !venue.menuPublic) return null;
  return publicMenu(ctx.db, venue);
}

export async function generateMetadata(props: PluginPageProps): Promise<Metadata> {
  const t = translator(localeOf(props.ctx), 'publicMenu');
  const found = await load(props);
  // For guests with the link or the QR code on the table, not for search engines (yet).
  const robots = { index: false, follow: false };
  if (!found) return { title: t('goneTitle'), robots };
  return { title: t('title', { name: found.name }), robots };
}

/** The menu for guests (an open route, ADR 0047): only what is on it, nothing about people. */
export default async function PublicMenu(props: PluginPageProps) {
  const t = translator(localeOf(props.ctx));
  const menu = await load(props);
  if (!menu)
    return (
      <section className="space-y-3">
        <h1 className="font-display text-3xl font-bold">{t('publicMenu.goneTitle')}</h1>
        <p>{t('publicMenu.goneBody')}</p>
      </section>
    );
  return <MenuBrowser menu={menu} />;
}
