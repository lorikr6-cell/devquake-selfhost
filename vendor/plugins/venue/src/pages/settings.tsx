import type { PluginPageProps } from '@devquake/plugin-sdk';
import { Connections } from '../components/connections';
import { TipSettingsForm } from '../components/tip-settings';
import { VenueForm } from '../components/venue-form';
import { localeOf, translator } from '../i18n';
import { syncDarts, venueLink } from '../lib/links';
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
  // The darts copy for the public menu, refreshed while the owner uses Venue (ADR 0035).
  await syncDarts(own.db, venue.id, ctx.links).catch(() => undefined);
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
      <section className="space-y-3 rounded-lg border border-ink/10 p-4 dark:border-paper/10">
        <h2 className="font-semibold">{t('links.title')}</h2>
        <Connections
          apps={ctx.links ? await ctx.links.list().catch(() => []) : []}
          dartsOn={!!(await venueLink(own.db, venue.id, 'darts'))}
        />
      </section>
    </div>
  );
}
