import { notFound } from 'next/navigation';
import type { PluginPageProps } from '@devquake/plugin-sdk';
import { BackLink } from '@devquake/ui';
import { localeOf, translator } from '../i18n';
import { moneyIn, needArea, ownerScope } from '../components/guard';
import { NewsletterEditor } from '../components/newsletter-editor';
import { listProducts } from '../lib/data';
import { shopMailConfigured } from '../lib/mailer';
import { listVouchers } from '../lib/marketing-data';
import { newsletterById, subscriberCounts } from '../lib/newsletter-data';
import { composeNewsletter } from '../lib/shop-mail';

export async function generateMetadata({ ctx, params }: PluginPageProps) {
  const t = translator(localeOf(ctx));
  return { title: params.id ? t('meta.newsletter', { store: '' }) : t('meta.newNewsletter') };
}

/**
 * An email campaign: its texts, a voucher, the products on offer and the new ones (cards in a
 * grid, made from the products themselves), a preview, a test email, and sending it.
 */
export default async function NewsletterPage({ ctx, params }: PluginPageProps) {
  const scope = await ownerScope(ctx);
  if (!scope.ok) return scope.notice;
  const { db, store, roles, locale } = scope;
  const missing = needArea(store, roles, 'marketing', locale);
  if (missing || !store) return missing;
  const t = translator(locale, 'newsletters');
  let newsletter = null;
  if (params.id !== undefined) {
    const id = Number(params.id);
    if (!Number.isSafeInteger(id) || id <= 0) notFound();
    newsletter = await newsletterById(db, store.id, id);
    if (!newsletter) notFound();
  }
  const [products, vouchers, counts] = await Promise.all([
    listProducts(db, store.id, { publishedOnly: true, sort: 'newest' }),
    listVouchers(db, store.id),
    subscriberCounts(db, store.id),
  ]);
  const money = moneyIn(locale, store.currency);
  // The email as subscribers get it, in the owner's language (refreshed after each save).
  const preview =
    newsletter && newsletter.products.length + (newsletter.intro ? 1 : 0) > 0
      ? (
          await composeNewsletter(
            db,
            store,
            newsletter,
            ctx.baseUrl,
            locale,
            'preview@example.com',
            null,
          )
        ).html
      : null;

  return (
    <div className="space-y-6">
      <BackLink href="/newsletters">{t('title')}</BackLink>
      <h1 className="font-display text-3xl font-bold break-words">
        {newsletter ? newsletter.subject : t('new')}
      </h1>
      <NewsletterEditor
        key={newsletter?.id ?? 'new'}
        value={
          newsletter
            ? {
                id: newsletter.id,
                subject: newsletter.subject,
                preheader: newsletter.preheader ?? '',
                heading: newsletter.heading ?? '',
                intro: newsletter.intro ?? '',
                voucherId: newsletter.voucherId ? String(newsletter.voucherId) : '',
                products: newsletter.products,
              }
            : {
                id: null,
                subject: '',
                preheader: '',
                heading: '',
                intro: '',
                voucherId: '',
                products: [],
              }
        }
        status={newsletter?.status ?? 'draft'}
        progress={
          newsletter
            ? {
                recipients: newsletter.recipients,
                sent: newsletter.sentCount,
                failed: newsletter.failedCount,
              }
            : null
        }
        products={products.map((p) => ({
          id: p.id,
          name: p.name,
          photo: p.photoId ? `/api/products/${p.id}/photos/${p.photoId}?size=thumb` : null,
          price: money(p.fromCents),
          onSale: p.onSale,
          isNew: p.createdAt ? Date.now() - Date.parse(p.createdAt) < 30 * 86_400_000 : false,
        }))}
        vouchers={vouchers.filter((v) => v.active).map((v) => ({ id: v.id, code: v.code }))}
        preview={preview}
        subscribers={counts.confirmed}
        canSend={shopMailConfigured() && store.published}
      />
    </div>
  );
}
