import type { PluginPageProps } from '@devquake/plugin-sdk';
import { StockManager } from '../components/stock-manager';
import { localeOf, translator } from '../i18n';
import { venueLink } from '../lib/links';
import { ownVenue } from '../lib/page';
import { ingredientsOf, shortNow } from '../lib/stock';

export async function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('nav.stock') };
}

/** The venue's stock: ingredients and drinks, their levels, counts and what to buy (owner's). */
export default async function Stock({ ctx }: PluginPageProps) {
  const t = translator(localeOf(ctx));
  const own = await ownVenue(ctx);
  if ('blocked' in own) return own.blocked;
  const { db, venue } = own;
  const [ingredients, list, short] = await Promise.all([
    ingredientsOf(db, venue.id),
    venueLink(db, venue.id, 'shoppingList'),
    shortNow(db, venue.id),
  ]);
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-bold">{t('nav.stock')}</h1>
        <p className="text-ink/70 dark:text-paper/70">{t('stock.intro')}</p>
        {short.size ? (
          <p className="text-sm font-medium text-red-700 dark:text-red-400">
            {t('stock.shortItems', { count: short.size })}
          </p>
        ) : null}
      </header>
      <StockManager initial={ingredients} timeZone={ctx.timeZone || 'UTC'} hasList={!!list} />
    </div>
  );
}
