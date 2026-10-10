import type { PluginPageProps } from '@devquake/plugin-sdk';
import { localeOf, translator } from '../i18n';
import { moneyIn, needArea, ownerScope } from '../components/guard';
import { MarketingEditor } from '../components/marketing-editor';
import { RulesEditor } from '../components/rules-editor';
import { SubNav } from '../components/sub-nav';
import { categoriesOf, listProducts } from '../lib/data';
import { toLocalInput } from '../lib/dates';
import { windowState } from '../lib/marketing';
import { listAnnouncements, listCampaigns, listRules, listVouchers } from '../lib/marketing-data';
import { centsToText } from '../lib/pricing';

export function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('meta.marketing') };
}

/**
 * Promotions: automatic discounts and free shipping, campaigns (a percentage off for a while),
 * voucher codes typed at checkout, and announcements on the shop's pages.
 */
export default async function MarketingPage({ ctx }: PluginPageProps) {
  const scope = await ownerScope(ctx);
  if (!scope.ok) return scope.notice;
  const { db, store, roles, locale, timeZone } = scope;
  const missing = needArea(store, roles, 'marketing', locale);
  if (missing || !store) return missing;
  const t = translator(locale, 'marketing');
  const now = new Date();
  const tRules = translator(locale, 'rules');
  const [rules, campaigns, vouchers, announcements, products, categories] = await Promise.all([
    listRules(db, store.id),
    listCampaigns(db, store.id),
    listVouchers(db, store.id),
    listAnnouncements(db, store.id),
    listProducts(db, store.id, { publishedOnly: false }),
    categoriesOf(db, store.id, false),
  ]);
  const money = moneyIn(locale, store.currency);
  const local = (v: string | null) => toLocalInput(v, timeZone);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">{t('title')}</h1>
        <p className="mt-1 max-w-2xl text-ink/70 dark:text-paper/70">{t('intro')}</p>
      </div>
      <SubNav group="marketing" current="/marketing" roles={roles} locale={locale} />
      <RulesEditor
        currency={store.currency}
        rules={rules.map((r) => ({
          id: r.id,
          kind: r.kind,
          threshold: r.kind === 'quantity' ? String(r.threshold) : centsToText(r.threshold),
          percentOff: r.percentOff === null ? '' : String(r.percentOff),
          startsAt: local(r.startsAt),
          endsAt: local(r.endsAt),
          active: r.active,
          state: windowState(r, now),
          summary:
            r.kind === 'free_shipping'
              ? tRules('summaryShipping', { amount: money(r.threshold) })
              : r.kind === 'quantity'
                ? tRules('labelQuantity', { percent: r.percentOff ?? 0, count: r.threshold })
                : tRules('labelSpend', { percent: r.percentOff ?? 0, amount: money(r.threshold) }),
        }))}
      />
      <MarketingEditor
        shopPath={`/s/${store.slug}`}
        products={products.map((p) => ({ id: p.id, name: p.name }))}
        categories={categories}
        campaigns={campaigns.map((c) => ({
          id: c.id,
          name: c.name,
          description: c.description ?? '',
          percentOff: String(c.percentOff),
          scope: c.scope,
          category: c.category ?? '',
          productIds: c.productIds,
          startsAt: local(c.startsAt),
          endsAt: local(c.endsAt),
          active: c.active,
          state: windowState(c, now),
        }))}
        vouchers={vouchers.map((v) => ({
          id: v.id,
          code: v.code,
          description: v.description ?? '',
          kind: v.kind,
          percentOff: v.percentOff === null ? '' : String(v.percentOff),
          amount: v.amountCents === null ? '' : centsToText(v.amountCents),
          minOrder: v.minOrderCents === null ? '' : centsToText(v.minOrderCents),
          maxUses: v.maxUses === null ? '' : String(v.maxUses),
          oncePerBuyer: v.oncePerBuyer,
          startsAt: local(v.startsAt),
          endsAt: local(v.endsAt),
          active: v.active,
          uses: v.uses,
          state: windowState(v, now),
          summary:
            v.kind === 'percent'
              ? t('voucherPercent', { percent: v.percentOff ?? 0 })
              : v.kind === 'amount'
                ? t('voucherAmount', { amount: money(v.amountCents ?? 0) })
                : t('voucherShipping'),
        }))}
        announcements={announcements.map((a) => ({
          id: a.id,
          message: a.message,
          details: a.details ?? '',
          tone: a.tone,
          placement: a.placement,
          linkUrl: a.linkUrl ?? '',
          linkLabel: a.linkLabel ?? '',
          voucherId: a.voucherId ? String(a.voucherId) : '',
          campaignId: a.campaignId ? String(a.campaignId) : '',
          startsAt: local(a.startsAt),
          endsAt: local(a.endsAt),
          active: a.active,
          state: windowState(a, now),
        }))}
      />
    </div>
  );
}
