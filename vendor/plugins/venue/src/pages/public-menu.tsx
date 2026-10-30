import type { Metadata } from 'next';
import type { PluginPageProps } from '@devquake/plugin-sdk';
import { localeOf, translator } from '../i18n';
import { menuOf, venueBySlug } from '../lib/data';
import { allergensOf, formatMinor } from '../lib/model';

/** A venue whose menu is public, with its menu, or null (also without the database). */
async function load({ ctx, params }: PluginPageProps) {
  if (!ctx.db) return null;
  const venue = await venueBySlug(ctx.db, params.slug ?? '').catch(() => null);
  if (!venue || !venue.menuPublic) return null;
  return { venue, menu: await menuOf(ctx.db, venue.id) };
}

export async function generateMetadata(props: PluginPageProps): Promise<Metadata> {
  const t = translator(localeOf(props.ctx), 'publicMenu');
  const found = await load(props);
  // For guests with the link or the QR code on the table, not for search engines (yet).
  const robots = { index: false, follow: false };
  if (!found) return { title: t('goneTitle'), robots };
  return { title: t('title', { name: found.venue.name }), robots };
}

/** The menu for guests (an open route, ADR 0047): only what is on it, nothing about people. */
export default async function PublicMenu(props: PluginPageProps) {
  const t = translator(localeOf(props.ctx));
  const found = await load(props);
  if (!found)
    return (
      <section className="space-y-3">
        <h1 className="font-display text-3xl font-bold">{t('publicMenu.goneTitle')}</h1>
        <p>{t('publicMenu.goneBody')}</p>
      </section>
    );
  const { venue, menu } = found;
  return (
    <article className="space-y-8">
      <h1 className="font-display text-3xl font-bold">{venue.name}</h1>
      {menu.categories.map((c) => {
        const items = menu.items.filter((i) => i.categoryId === c.id);
        if (!items.length) return null;
        return (
          <section key={c.id} className="space-y-3">
            <h2 className="font-display text-xl font-bold">{c.name}</h2>
            <ul className="space-y-3">
              {items.map((i) => (
                <li key={i.id} className={i.available ? '' : 'opacity-50'}>
                  <div className="flex items-baseline gap-3">
                    <span className="font-medium">{i.name}</span>
                    {i.available ? null : <span className="text-sm">{t('menu.soldOut')}</span>}
                    <span className="ml-auto tabular-nums">
                      {formatMinor(i.priceMinor, venue.decimals)} {venue.currency}
                    </span>
                  </div>
                  {i.description ? (
                    <p className="text-sm text-ink/70 dark:text-paper/70">{i.description}</p>
                  ) : null}
                  {i.allergens ? (
                    <p className="text-xs text-ink/60 dark:text-paper/60">
                      {t('publicMenu.allergens')}{' '}
                      {allergensOf(i.allergens)
                        .map((a) => t(`menu.allergens.${a}`))
                        .join(', ')}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
      <p className="text-xs text-ink/60 dark:text-paper/60">{t('publicMenu.vatNote')}</p>
    </article>
  );
}
