import type { PluginPageProps } from '@devquake/plugin-sdk';
import { localeOf, translator } from '../i18n';
import { needArea, ownerScope } from '../components/guard';
import { SubNav } from '../components/sub-nav';
import { LegalForm, StoreForm } from '../components/store-form';
import { MaintenanceForm } from '../components/maintenance-form';
import { Panel } from '../components/ui';
import { listOrders } from '../lib/data';

export function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('meta.settings') };
}

/** The shop's name, address, texts, currency, VAT, open or closed; seller details and terms. */
export default async function Settings({ ctx }: PluginPageProps) {
  const scope = await ownerScope(ctx);
  if (!scope.ok) return scope.notice;
  const { db, store, roles, locale } = scope;
  const missing = needArea(store, roles, 'settings', locale);
  if (missing || !store) return missing;
  const t = translator(locale, 'settings');
  const tMaintenance = translator(locale, 'maintenance');
  const hasOrders = (await listOrders(db, store.id, null, 1)).length > 0;
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold">{t('title')}</h1>
      <SubNav group="settings" current="/settings" roles={roles} locale={locale} />
      <Panel className="space-y-3">
        <div>
          <h2 className="font-display text-lg font-semibold">{tMaintenance('title')}</h2>
          <p className="text-sm text-ink/60 dark:text-paper/60">{tMaintenance('intro')}</p>
        </div>
        <MaintenanceForm on={store.maintenance} message={store.maintenanceMessage} />
      </Panel>
      <Panel className="space-y-3">
        <h2 className="font-display text-lg font-semibold">{t('basics')}</h2>
        <StoreForm
          baseUrl={ctx.baseUrl}
          currencyLocked={hasOrders}
          store={{
            name: store.name,
            slug: store.slug,
            tagline: store.tagline,
            about: store.about,
            currency: store.currency,
            vatRate: store.vatRate,
            published: store.published,
          }}
        />
      </Panel>
      <Panel className="space-y-3">
        <div>
          <h2 className="font-display text-lg font-semibold">{t('seller')}</h2>
          <p className="text-sm text-ink/60 dark:text-paper/60">{t('sellerHint')}</p>
        </div>
        <LegalForm
          value={{
            ...store.seller,
            terms: store.terms,
            returnsPolicy: store.returnsPolicy,
            showAnpc: store.showAnpc,
          }}
        />
      </Panel>
    </div>
  );
}
