import type { Metadata } from 'next';
import type { PluginPageProps } from '@devquake/plugin-sdk';
import { Link, cn, formatDateTime } from '@devquake/ui';
import { localeOf, translator } from '../i18n';
import { RemoveFavorite } from '../components/favorite-remove';
import { currentBuyer, moneyIn, shopScope } from '../components/guard';
import { photoUrl, ShopFrame, shopIcons } from '../components/shop';
import { S } from '../components/shop-style';
import { favoriteOwner } from '../lib/favorites';
import { favoritesOf } from '../lib/favorites-data';

export async function generateMetadata({ ctx, params }: PluginPageProps): Promise<Metadata> {
  const scope = await shopScope(ctx, params.slug).catch(() => null);
  const store = scope?.ok ? scope.store.name : '';
  // A buyer's own list: never indexed.
  return {
    title: translator(localeOf(ctx))('meta.favorites', { store }),
    robots: { index: false, follow: false },
    icons: scope?.ok ? shopIcons(scope.store, scope.preview) : undefined,
  };
}

/**
 * The buyer's favourites (ADR 0064): when each was saved, whether it can still be bought (struck
 * through when not), and how today's price compares to the price when it was saved.
 */
export default async function FavoritesPage({ ctx, params }: PluginPageProps) {
  const scope = await shopScope(ctx, params.slug);
  if (!scope.ok) return scope.notice;
  const { store, preview, team, locale, timeZone, db } = scope;
  const t = translator(locale, 'favorites');
  const money = moneyIn(locale, store.currency);
  const buyer = ctx.user ? null : await currentBuyer(db, store, null);
  const owner = favoriteOwner(ctx.user?.id, buyer?.id);
  const list = owner ? await favoritesOf(db, store.id, owner) : [];

  return (
    <ShopFrame store={store} preview={preview} team={team} locale={locale} db={db}>
      <div className="space-y-5">
        <div>
          <h1 className={cn('text-2xl font-bold', S.heading)}>{t('title')}</h1>
          <p className={cn('mt-1 max-w-2xl', S.muted)}>{t('intro')}</p>
        </div>
        {!owner ? (
          <p className={S.panel}>
            {t('signInBody')}{' '}
            <Link href={`/s/${store.slug}/account`} className="font-medium underline">
              {t('signInLink')}
            </Link>
          </p>
        ) : list.length === 0 ? (
          <p className={S.panel}>{t('empty')}</p>
        ) : (
          <ul className="space-y-3">
            {list.map((f) => {
              const gone = f.state !== 'available';
              const diff = f.diffCents ?? 0;
              return (
                <li key={f.id} className={cn('flex flex-wrap items-center gap-4 p-3', S.card)}>
                  {f.photoId !== null && f.productId !== null ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photoUrl(store, preview, f.productId, f.photoId, true)}
                      alt=""
                      className={cn(
                        'size-16 object-cover',
                        S.radius,
                        gone && 'opacity-50 grayscale',
                      )}
                    />
                  ) : (
                    <span
                      aria-hidden
                      className="grid size-16 place-items-center text-2xl opacity-40"
                    >
                      🛍️
                    </span>
                  )}
                  <div className="min-w-0 flex-1 space-y-0.5">
                    {f.state === 'gone' ? (
                      <p className="font-semibold break-words line-through opacity-70">{f.name}</p>
                    ) : (
                      <Link
                        href={`/s/${store.slug}/p/${f.slug}`}
                        className={cn(
                          'font-semibold break-words underline-offset-2 hover:underline',
                          gone && 'line-through opacity-70',
                        )}
                      >
                        {f.name}
                      </Link>
                    )}
                    <p className={cn('text-xs', S.muted)}>
                      {t('savedOn', { date: formatDateTime(f.addedAt, timeZone, 'date', locale) })}
                      {' · '}
                      {t('savedPrice', { price: money(f.priceCents) })}
                    </p>
                    <p className="text-sm">
                      {f.state === 'gone' ? (
                        <span className="font-medium">{t('gone')}</span>
                      ) : (
                        <>
                          <span className="font-medium">
                            {t('nowPrice', { price: money(f.nowCents ?? 0) })}
                          </span>{' '}
                          {diff < 0 ? (
                            <span className="font-medium text-emerald-700 dark:text-emerald-400">
                              {t('cheaper', { amount: money(-diff) })}
                            </span>
                          ) : diff > 0 ? (
                            <span className="font-medium text-red-700 dark:text-red-400">
                              {t('dearer', { amount: money(diff) })}
                            </span>
                          ) : (
                            <span className={S.muted}>{t('samePrice')}</span>
                          )}
                          {f.state === 'soldOut' ? (
                            <span className="ml-2 font-medium">{t('soldOut')}</span>
                          ) : null}
                        </>
                      )}
                    </p>
                  </div>
                  <RemoveFavorite slug={store.slug} id={f.id} name={f.name} />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </ShopFrame>
  );
}
