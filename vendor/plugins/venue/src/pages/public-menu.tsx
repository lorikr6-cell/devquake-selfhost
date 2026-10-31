import type { Metadata } from 'next';
import type { PluginPageProps } from '@devquake/plugin-sdk';
import { MenuBrowser, type PublicMenuData } from '../components/menu-browser';
import { panelStyle, sheetStyle } from '../components/menu-sheet';
import { localeOf, translator } from '../i18n';
import { menuOf, venueBySlug, type Venue } from '../lib/data';
import { designOf } from '../lib/design';
import { venueTournaments, type VenueTournament } from '../lib/links';

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
      available: i.available && i.short.length === 0,
    })),
  };
}

/**
 * The public menu in the owner's design (when they show it there): their background, font and
 * colours around the searchable menu.
 */
export async function DesignedMenu({
  db,
  venue,
  intro,
  t,
}: {
  db: Db;
  venue: Venue;
  intro?: string;
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  const [menu, design, tournaments] = await Promise.all([
    publicMenu(db, venue),
    designOf(db, venue.id),
    venueTournaments(db, venue.id).catch(() => [] as VenueTournament[]),
  ]);
  const darts = <Tournaments list={tournaments} t={t} />;
  if (!design.onPublic)
    return (
      <>
        <MenuBrowser menu={menu} intro={intro} />
        {darts}
      </>
    );
  const bg =
    design.background !== null ? `/api/menu-bg/${venue.slug}?v=${design.background}` : null;
  return (
    <div
      className="-mx-4 rounded-none p-4 sm:mx-0 sm:rounded-xl sm:p-8"
      style={sheetStyle(design, bg)}
    >
      <div style={panelStyle(design)}>
        <MenuBrowser
          menu={{ ...menu, name: design.title || menu.name }}
          intro={intro || design.subtitle}
        />
        {darts}
      </div>
    </div>
  );
}

/** The owner's open darts tournaments (a copy kept from Darts), with a link to join. */
function Tournaments({
  list,
  t,
}: {
  list: VenueTournament[];
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  if (!list.length) return null;
  return (
    <section className="mt-8 space-y-2">
      <h2 className="font-display text-xl font-bold">🎯 {t('publicMenu.darts')}</h2>
      <ul className="space-y-2">
        {list.map((x) => (
          <li key={x.ref} className="flex flex-wrap items-baseline gap-x-3">
            <span className="font-medium">{x.name}</span>
            <span className="text-sm opacity-80">
              {x.game} · {t('publicMenu.players', { count: x.players })}
              {x.fee ? ` · ${t('publicMenu.fee', { fee: x.fee })}` : ''}
            </span>
            {x.url ? (
              <a href={x.url} className="text-sm font-medium underline">
                {t('publicMenu.join')}
              </a>
            ) : (
              <span className="text-sm">{t('publicMenu.playing')}</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
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
  const db = props.ctx.db;
  const venue = db ? await venueBySlug(db, props.params.slug ?? '').catch(() => null) : null;
  if (!db || !venue || !venue.menuPublic)
    return (
      <section className="space-y-3">
        <h1 className="font-display text-3xl font-bold">{t('publicMenu.goneTitle')}</h1>
        <p>{t('publicMenu.goneBody')}</p>
      </section>
    );
  return <DesignedMenu db={db} venue={venue} t={t} />;
}
