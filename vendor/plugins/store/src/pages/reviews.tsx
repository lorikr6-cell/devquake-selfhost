import type { PluginPageProps } from '@devquake/plugin-sdk';
import { formatDateTime } from '@devquake/ui';
import { localeOf, translator } from '../i18n';
import { needArea, ownerScope } from '../components/guard';
import { ReviewModeration } from '../components/review-moderation';
import { REVIEW_STATUSES, type ReviewStatus } from '../lib/reviews';
import { storeReviews } from '../lib/reviews-data';

export function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('meta.reviews') };
}

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Buyers' ratings and comments: publish or hide them, answer them, and how they are published. */
export default async function ReviewsPage({ ctx, searchParams }: PluginPageProps) {
  const scope = await ownerScope(ctx);
  if (!scope.ok) return scope.notice;
  const { db, store, roles, locale, timeZone } = scope;
  const missing = needArea(store, roles, 'reviews', locale);
  if (missing || !store) return missing;
  const t = translator(locale, 'reviews');
  const asked = one(searchParams.status);
  const status: ReviewStatus | null = REVIEW_STATUSES.includes(asked as ReviewStatus)
    ? (asked as ReviewStatus)
    : asked === 'all'
      ? null
      : 'pending';
  const reviews = await storeReviews(db, store.id, status);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">{t('title')}</h1>
        <p className="mt-1 max-w-2xl text-ink/70 dark:text-paper/70">{t('intro')}</p>
      </div>
      <ReviewModeration
        mode={store.reviewsMode}
        status={status ?? 'all'}
        shopSlug={store.slug}
        reviews={reviews.map((r) => ({
          ...r,
          date: formatDateTime(r.createdAt, timeZone, 'datetime', locale),
        }))}
      />
    </div>
  );
}
