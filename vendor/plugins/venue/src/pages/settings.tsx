import type { PluginPageProps } from '@devquake/plugin-sdk';
import { TipSettingsForm } from '../components/tip-settings';
import { VenueForm } from '../components/venue-form';
import { localeOf, translator } from '../i18n';
import { ownVenue } from '../lib/page';

export async function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('nav.settings') };
}

/** The venue's name, country, currency, VAT rates, whether its menu is public, and tips. */
export default async function Settings({ ctx }: PluginPageProps) {
  const t = translator(localeOf(ctx));
  const own = await ownVenue(ctx);
  if ('blocked' in own) return own.blocked;
  const { venue } = own;
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold">{t('nav.settings')}</h1>
      <VenueForm
        venue={{
          name: venue.name,
          country: venue.country,
          currency: venue.currency,
          vatRates: venue.vatRates,
          decimals: venue.decimals,
          menuPublic: venue.menuPublic,
        }}
      />
      <section className="space-y-3 rounded-lg border border-ink/10 p-4 dark:border-paper/10">
        <h2 className="font-semibold">{t('tipsForm.title')}</h2>
        <TipSettingsForm tips={venue.tips} currency={venue.currency} decimals={venue.decimals} />
      </section>
    </div>
  );
}
