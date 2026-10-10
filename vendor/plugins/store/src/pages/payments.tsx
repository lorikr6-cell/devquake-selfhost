import type { PluginPageProps } from '@devquake/plugin-sdk';
import { localeOf, translator } from '../i18n';
import { needArea, ownerScope } from '../components/guard';
import { SubNav } from '../components/sub-nav';
import { PaymentsForm } from '../components/payments-form';
import { canKeepSecrets } from '../lib/secrets';

export function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('meta.payments') };
}

/** Card (Stripe), PayPal, bank transfer and cash on delivery, each set up by the owner. */
export default async function Payments({ ctx }: PluginPageProps) {
  const scope = await ownerScope(ctx);
  if (!scope.ok) return scope.notice;
  const { store, roles, locale } = scope;
  const missing = needArea(store, roles, 'payments', locale);
  if (missing || !store) return missing;
  const t = translator(locale, 'payments');
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">{t('title')}</h1>
        <p className="mt-1 max-w-2xl text-sm text-ink/70 dark:text-paper/70">{t('intro')}</p>
      </div>
      <SubNav group="settings" current="/settings/payments" roles={roles} locale={locale} />
      <PaymentsForm
        value={{ cod: store.cod, bank: store.bank, stripe: store.stripe, paypal: store.paypal }}
        webhookUrl={`${ctx.baseUrl}/api/s/${store.slug}/stripe`}
        canKeepSecrets={canKeepSecrets()}
      />
    </div>
  );
}
