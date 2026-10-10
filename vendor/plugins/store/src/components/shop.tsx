import type { CSSProperties, ReactNode } from 'react';
import type { PluginDatabase } from '@devquake/plugin-sdk';
import { I18nProvider, Link, cn, type Locale } from '@devquake/ui';
import { FALLBACK_MESSAGES, shopLanguageState, translator } from '../i18n';
import { DevQuakePromo } from './devquake-promo';
import { ShopLanguagePicker } from './shop-language';
import type { ProductSummary, Store } from '../lib/data';
import { shopMailConfigured } from '../lib/mailer';
import { liveAnnouncements, type Announcement } from '../lib/marketing-data';
import { themeVars } from '../lib/theme';
import { AnnouncementView } from './announcement-view';
import { CartLink, CompareLink, CompareToggle, NewsletterSignup } from './shop-client';
import { moneyIn } from './guard';
import { S, SHOP_ROOT } from './shop-style';
import { CookieSettingsLink, ShopTracking } from './shop-tracking';
import { needsConsent } from '../lib/tracking';

// The shop's frame for buyers (server components): the owner's design, the header with the
// logo, account, comparison and cart, announcements, product cards, prices, and the seller's
// details and newsletter in the footer (EU consumer law, ADR 0057, 0058).

/**
 * A product photo's address. Open shops serve photos to anyone; in the team's preview of a
 * closed shop they come from the owner's own route.
 */
export function photoUrl(
  store: Store,
  preview: boolean,
  productId: number,
  photoId: number,
  thumb = false,
) {
  const base = preview
    ? `/api/products/${productId}/photos/${photoId}`
    : `/api/s/${store.slug}/photos/${photoId}`;
  return thumb ? `${base}?size=thumb` : base;
}

/** The shop's logo or banner, from the open route (or the team's while it is closed). */
export function assetUrl(store: Store, preview: boolean, kind: 'logo' | 'banner'): string | null {
  const version = kind === 'logo' ? store.logoVersion : store.bannerVersion;
  if (!version) return null;
  return preview
    ? `/api/store/assets/${kind}?v=${version}`
    : `/api/s/${store.slug}/assets/${kind}?v=${version}`;
}

export async function ShopFrame({
  store,
  preview,
  locale,
  children,
  db,
  team = false,
}: {
  store: Store;
  preview: boolean;
  locale: Locale;
  children: ReactNode;
  /** Shows the live announcement bar when given. */
  db?: PluginDatabase;
  /** The owner or their team is looking: their visits load no tracking tags. */
  team?: boolean;
}) {
  const t = translator(locale, 'shop');
  const tInfo = translator(locale, 'info');
  const tCookies = translator(locale, 'cookies');
  const s = store.seller;
  const tracking = !preview && !team && needsConsent(store.tracking) ? store.tracking : null;
  const theme = store.theme;
  const logo = assetUrl(store, preview, 'logo');
  const bars: Announcement[] = db
    ? (await liveAnnouncements(db, store.id, new Date()).catch(() => [])).filter(
        (a) => a.placement === 'bar',
      )
    : [];
  const language = shopLanguageState();
  const frame = (
    <div
      data-shop-theme={theme ? '' : undefined}
      style={theme ? (themeVars(theme) as CSSProperties) : undefined}
      className={cn(SHOP_ROOT, 'space-y-8')}
    >
      {theme ? (
        // The whole page in the shop's colours (the values are checked hex colours).
        <style>{`div:has(> main [data-shop-theme]){background-color:${theme.background};color:${theme.text}}div:has(> main [data-shop-theme])>footer{color:${theme.text};opacity:.75}`}</style>
      ) : null}
      {preview ? (
        <p className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
          {t('ownerPreview')}
        </p>
      ) : store.maintenance ? (
        <p className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
          {t('maintenanceTeam')}
        </p>
      ) : null}
      {bars.map((a) => (
        <AnnouncementView key={a.id} store={store} announcement={a} locale={locale} compact />
      ))}
      <header
        className={cn(
          'flex flex-wrap items-end justify-between gap-4 border-b pb-4',
          S.line,
          theme?.header === 'center' && 'flex-col items-center text-center',
        )}
      >
        <div className="min-w-0">
          <Link href={`/s/${store.slug}`} className="inline-flex items-center gap-3">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt={store.name} className="max-h-14 max-w-56 object-contain" />
            ) : (
              <span className={cn('text-3xl font-bold break-words', S.heading)}>{store.name}</span>
            )}
          </Link>
          {store.tagline ? <p className={cn('mt-1', S.muted)}>{store.tagline}</p> : null}
        </div>
        <nav aria-label={t('shopNav')} className="flex flex-wrap items-center gap-2">
          <Link href={`/s/${store.slug}/account`} className={S.buttonSecondary}>
            {t('account')}
          </Link>
          <CompareLink slug={store.slug} label={t('compare')} />
          <CartLink slug={store.slug} label={t('cart')} />
        </nav>
      </header>
      {children}
      {preview || team ? null : <DevQuakePromo locale={locale} />}
      <footer className={cn('space-y-4 border-t pt-6 text-xs', S.line, S.muted)}>
        {shopMailConfigured() && !preview ? (
          <NewsletterSignup slug={store.slug} source="shop" />
        ) : null}
        <p>{t('vatIncluded')}</p>
        <p className="flex flex-wrap gap-x-3 gap-y-1">
          {s.companyName ? <span>{s.companyName}</span> : null}
          {s.companyNumber ? <span>{s.companyNumber}</span> : null}
          {s.vatNumber ? <span>{s.vatNumber}</span> : null}
          {s.email ? (
            <a href={`mailto:${s.email}`} className="underline">
              {s.email}
            </a>
          ) : null}
          {s.phone ? <span>{s.phone}</span> : null}
          <Link href={`/s/${store.slug}/info`} className="underline">
            {t('info')}
          </Link>
          {tracking ? <CookieSettingsLink label={tCookies('settings')} /> : null}
        </p>
        {store.showAnpc ? <AnpcLinks label={tInfo('anpcSal')} labelSol={tInfo('anpcSol')} /> : null}
        {language.options.length > 0 ? (
          <ShopLanguagePicker
            storeId={store.id}
            current={
              language.code && language.options.some((o) => o.code === language.code)
                ? language.code
                : null
            }
            options={language.options}
          />
        ) : null}
      </footer>
      {tracking ? (
        <ShopTracking
          storeId={store.id}
          tracking={tracking}
          privacyUrl={`/s/${store.slug}/info#privacy`}
        />
      ) : null}
    </div>
  );
  // The shop's own labels for its client parts too (cart, checkout, forms).
  return language.catalog ? (
    <I18nProvider locale={locale} messages={language.catalog} fallback={FALLBACK_MESSAGES}>
      {frame}
    </I18nProvider>
  ) : (
    frame
  );
}

export function AnpcLinks({ label, labelSol }: { label: string; labelSol: string }) {
  return (
    <p className="flex flex-wrap gap-2">
      <a
        href="https://anpc.ro/ce-este-sal/"
        target="_blank"
        rel="noopener noreferrer nofollow"
        className={cn('rounded border px-2 py-1', S.line, S.hoverAccent)}
      >
        {label}
      </a>
      <a
        href="https://ec.europa.eu/consumers/odr"
        target="_blank"
        rel="noopener noreferrer nofollow"
        className={cn('rounded border px-2 py-1', S.line, S.hoverAccent)}
      >
        {labelSol}
      </a>
    </p>
  );
}

/** The price now, the regular one struck through during a sale or campaign. */
export function Price({
  cents,
  regularCents,
  onSale,
  from = false,
  locale,
  currency,
  className,
}: {
  cents: number;
  regularCents: number;
  onSale: boolean;
  from?: boolean;
  locale: Locale;
  currency: string;
  className?: string;
}) {
  const t = translator(locale, 'shop');
  const money = moneyIn(locale, currency);
  const now = money(cents);
  return (
    <span className={cn('inline-flex flex-wrap items-baseline gap-x-2', className)}>
      <span className={cn('font-semibold', onSale && S.accent)}>
        {from ? t('from', { price: now }) : now}
      </span>
      {onSale ? (
        <s className={cn('text-sm', S.muted)} aria-label={t('was', { price: money(regularCents) })}>
          {money(regularCents)}
        </s>
      ) : null}
    </span>
  );
}

/** Five stars, filled to `value` (0 to 5), with the number for screen readers. */
export function Stars({
  value,
  label,
  className,
}: {
  value: number;
  label: string;
  className?: string;
}) {
  return (
    <span role="img" aria-label={label} className={cn('inline-flex', S.accent, className)}>
      {[1, 2, 3, 4, 5].map((n) => {
        const fill = Math.max(0, Math.min(1, value - (n - 1)));
        return (
          <svg key={n} viewBox="0 0 20 20" aria-hidden className="size-[1em]">
            <defs>
              <linearGradient id={`star-${n}-${Math.round(fill * 100)}`}>
                <stop offset={`${fill * 100}%`} stopColor="currentColor" />
                <stop offset={`${fill * 100}%`} stopColor="currentColor" stopOpacity="0.2" />
              </linearGradient>
            </defs>
            <path
              d="M10 1.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L10 15l-5.2 2.7 1-5.9L1.5 7.7l5.9-.8z"
              fill={`url(#star-${n}-${Math.round(fill * 100)})`}
            />
          </svg>
        );
      })}
    </span>
  );
}

export function ProductCard({
  store,
  product,
  preview,
  locale,
}: {
  store: Store;
  product: ProductSummary;
  preview: boolean;
  locale: Locale;
}) {
  const t = translator(locale, 'shop');
  const soldOut = product.stock === 0;
  const badge = soldOut
    ? t('soldOut')
    : product.campaign
      ? `−${product.campaign.percentOff}%`
      : product.onSale
        ? t('onSale')
        : null;
  return (
    <div className={cn('group relative flex h-full flex-col', S.card)}>
      <Link
        href={`/s/${store.slug}/p/${product.slug}`}
        className="flex flex-1 flex-col focus-visible:outline-2 focus-visible:[outline-color:var(--shop-accent)]"
      >
        <span className="relative block aspect-square [background-color:var(--shop-surface)]">
          {product.photoId !== null ? (
            // Photos are served by the app itself; next/image is not used in apps.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl(store, preview, product.id, product.photoId, true)}
              alt={product.name}
              loading="lazy"
              className="size-full object-cover"
            />
          ) : (
            <span aria-hidden className="grid size-full place-items-center text-4xl opacity-40">
              🛍️
            </span>
          )}
          {badge ? (
            <span
              className={cn(
                'absolute top-2 left-2',
                soldOut
                  ? 'rounded-full bg-ink px-2 py-0.5 text-xs font-semibold text-paper'
                  : S.badge,
              )}
            >
              {badge}
            </span>
          ) : null}
        </span>
        <span className="flex flex-1 flex-col gap-1 p-3">
          {product.brand ? (
            <span className={cn('text-xs tracking-wide uppercase', S.muted)}>{product.brand}</span>
          ) : null}
          <span className="font-medium group-hover:[color:var(--shop-accent)]">{product.name}</span>
          {product.rating.count > 0 ? (
            <span className="flex items-center gap-1 text-xs">
              <Stars
                value={product.rating.average}
                label={t('ratingLabel', { rating: product.rating.average })}
              />
              <span className={S.muted}>({product.rating.count})</span>
            </span>
          ) : null}
          {product.summary ? (
            <span className={cn('line-clamp-2 text-xs', S.muted)}>{product.summary}</span>
          ) : null}
          <Price
            cents={product.fromCents}
            regularCents={product.regularCents}
            onSale={product.onSale}
            from={product.priceVaries}
            locale={locale}
            currency={store.currency}
            className="mt-auto pt-1"
          />
        </span>
      </Link>
      <CompareToggle slug={store.slug} product={product.slug} className="absolute top-2 right-2" />
    </div>
  );
}

/** Paragraphs from a multi-line text (empty lines separate them). */
export function Paragraphs({ text, className }: { text: string; className?: string }) {
  return (
    <div className={cn('space-y-3', className)}>
      {text.split(/\n\s*\n/).map((p, i) => (
        <p key={i} className="whitespace-pre-line">
          {p}
        </p>
      ))}
    </div>
  );
}
