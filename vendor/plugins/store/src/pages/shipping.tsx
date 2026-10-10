import type { PluginPageProps } from '@devquake/plugin-sdk';
import { localeOf, translator } from '../i18n';
import { needArea, ownerScope } from '../components/guard';
import { SubNav } from '../components/sub-nav';
import { ZonesForm } from '../components/zones-form';
import { zonesOf } from '../lib/data';

export function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('meta.shipping') };
}

/** Where the shop ships and what it costs: zones of countries with a flat rate. */
export default async function Shipping({ ctx }: PluginPageProps) {
  const scope = await ownerScope(ctx);
  if (!scope.ok) return scope.notice;
  const { db, store, roles, locale } = scope;
  const missing = needArea(store, roles, 'shipping', locale);
  if (missing || !store) return missing;
  const t = translator(locale, 'shipping');
  const zones = await zonesOf(db, store.id);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">{t('title')}</h1>
        <p className="mt-1 max-w-2xl text-sm text-ink/70 dark:text-paper/70">{t('intro')}</p>
      </div>
      <SubNav group="settings" current="/settings/shipping" roles={roles} locale={locale} />
      <ZonesForm zones={zones} currency={store.currency} />
    </div>
  );
}
