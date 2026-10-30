import type { PluginPageProps } from '@devquake/plugin-sdk';
import { MenuEditor } from '../components/menu-editor';
import { localeOf, translator } from '../i18n';
import { menuOf } from '../lib/data';
import { ownVenue } from '../lib/page';

export async function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('nav.menu') };
}

/** The menu editor: categories and items with prices, VAT, station and allergens. */
export default async function Menu({ ctx }: PluginPageProps) {
  const t = translator(localeOf(ctx));
  const own = await ownVenue(ctx);
  if ('blocked' in own) return own.blocked;
  const { venue, db } = own;
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold">{t('nav.menu')}</h1>
      <MenuEditor
        initial={await menuOf(db, venue.id)}
        venue={{ currency: venue.currency, decimals: venue.decimals, vatRates: venue.vatRates }}
      />
    </div>
  );
}
