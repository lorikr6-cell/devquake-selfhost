import { Link, cn, type Locale } from '@devquake/ui';
import { translator } from '../i18n';
import type { Store } from '../lib/data';
import type { Announcement } from '../lib/marketing-data';
import type { AnnouncementTone } from '../lib/marketing';
import { CopyCode } from './shop-client';
import { S } from './shop-style';

const TONE: Record<AnnouncementTone, string> = {
  info: 'border-sky-300 bg-sky-50 text-sky-950 dark:border-sky-500/40 dark:bg-sky-500/10 dark:text-sky-100',
  sale: 'border-transparent [background-color:var(--shop-accent)] [color:var(--shop-on-accent)]',
  new: 'border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-100',
  warning:
    'border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100',
};

/** An announcement in the shop: a slim bar on every page or a banner on the front page. */
export function AnnouncementView({
  store,
  announcement: a,
  locale,
  compact = false,
}: {
  store: Store;
  announcement: Announcement;
  locale: Locale;
  compact?: boolean;
}) {
  const t = translator(locale, 'shop');
  const href = a.campaignId ? `/s/${store.slug}?campaign=${a.campaignId}` : a.linkUrl;
  const label = a.linkLabel ?? t('announcementLink');
  return (
    <aside
      aria-label={t('announcement')}
      className={cn(
        'border',
        S.radius,
        TONE[a.tone],
        compact
          ? 'flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-2 text-center text-sm'
          : 'space-y-2 px-5 py-6 sm:px-8',
      )}
    >
      <p className={cn('font-semibold', !compact && cn('text-2xl', S.heading))}>{a.message}</p>
      {a.details && !compact ? <p className="max-w-2xl opacity-90">{a.details}</p> : null}
      {a.voucherCode ? <CopyCode code={a.voucherCode} /> : null}
      {href ? (
        href.startsWith('/') ? (
          <Link href={href} className="font-semibold underline">
            {label}
          </Link>
        ) : (
          <a href={href} className="font-semibold underline" rel="noopener">
            {label}
          </a>
        )
      ) : null}
    </aside>
  );
}
