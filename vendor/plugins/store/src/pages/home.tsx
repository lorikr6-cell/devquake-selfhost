import type { Metadata } from 'next';
import type { PluginPageProps } from '@devquake/plugin-sdk';
import { Link, buttonClass, formatDateTime } from '@devquake/ui';
import { localeOf, translator } from '../i18n';
import { moneyIn, ownerScope } from '../components/guard';
import { mayOpenShop } from '../lib/api';
import { preparePromo } from '../components/devquake-promo';
import { StatusBadge } from '../components/order-view';
import { StoreForm } from '../components/store-form';
import { JoinButton } from '../components/team-editor';
import { Notice, Panel } from '../components/ui';
import { TaskBoard } from '../components/task-board';
import { can, taskPanels } from '../lib/roles';
import { taskBoard } from '../lib/tasks-data';
import {
  listOrders,
  methodsOf,
  publishedStores,
  storeBySlug,
  storeNumbers,
  zonesOf,
} from '../lib/data';
import { orderReference } from '../lib/model';
import { StoreFront, frontFilters, shopMetadata } from './shop';

/**
 * The instance's open shop at the root (ADR 0057: one store per instance), for visitors and for
 * members who may not open a shop of their own (ADR 0059).
 */
async function rootShop(props: PluginPageProps, member = false) {
  if ((props.ctx.user && !member) || !props.ctx.db) return null;
  const [first] = await publishedStores(props.ctx.db);
  return first ? storeBySlug(props.ctx.db, first.slug) : null;
}

export async function generateMetadata(props: PluginPageProps): Promise<Metadata> {
  const shop = await rootShop(props).catch(() => null);
  if (shop) return shopMetadata(shop, props.ctx.baseUrl, false);
  return { title: translator(localeOf(props.ctx))('meta.home'), robots: { index: false } };
}

/**
 * Visitors see the shop; its owner sees the overview: numbers, what is still missing before
 * opening, and the latest orders. Before there is a shop, the form to open one.
 */
export default async function Home(props: PluginPageProps) {
  const { ctx, searchParams } = props;
  const locale = localeOf(ctx);
  if (!ctx.user) {
    const shop = await rootShop(props);
    if (shop) {
      await preparePromo(ctx);
      return (
        <StoreFront
          ctx={ctx}
          store={shop}
          preview={false}
          team={false}
          locale={locale}
          {...frontFilters(searchParams)}
        />
      );
    }
    const tShop = translator(locale, 'shop');
    return (
      <Notice title={tShop('noShopTitle')}>
        <p>{tShop('noShopBody')}</p>
      </Notice>
    );
  }

  const scope = await ownerScope(ctx);
  if (!scope.ok) return scope.notice;
  const { db, store, roles, timeZone } = scope;
  if (!store && !(await mayOpenShop(ctx))) {
    // A member on a site where only its administrators open shops: they shop like visitors.
    const shop = await rootShop(props, true);
    if (shop) {
      return (
        <StoreFront
          ctx={ctx}
          store={shop}
          preview={false}
          team={false}
          locale={locale}
          {...frontFilters(searchParams)}
        />
      );
    }
    const tShop = translator(locale, 'shop');
    return (
      <Notice title={tShop('noShopTitle')}>
        <p>{tShop('noShopBody')}</p>
      </Notice>
    );
  }
  if (!store) {
    const t = translator(locale, 'create');
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold">{t('title')}</h1>
          <p className="mt-1 max-w-2xl text-ink/70 dark:text-paper/70">{t('intro')}</p>
        </div>
        <Panel>
          <StoreForm baseUrl={ctx.baseUrl} />
        </Panel>
      </div>
    );
  }

  const t = translator(locale, 'dashboard');
  const tOwner = translator(locale, 'owner');
  const tNum = translator(locale, 'dashboard.numbers');
  const tTeam = translator(locale, 'team');
  const owner = roles.includes('owner');
  const seesOrders = can(roles, 'orders');
  const [numbers, zones, orders, board] = await Promise.all([
    storeNumbers(db, store.id),
    zonesOf(db, store.id),
    seesOrders ? listOrders(db, store.id, null, 8) : Promise.resolve([]),
    taskBoard(db, store, taskPanels(roles), new Date()),
  ]);
  const money = moneyIn(locale, store.currency);
  const shopUrl = `${ctx.baseUrl}/s/${store.slug}`;
  const steps = [
    { label: t('stepProduct'), done: numbers.published > 0, href: '/products' },
    { label: t('stepPayment'), done: methodsOf(store).length > 0, href: '/settings/payments' },
    { label: t('stepShipping'), done: zones.length > 0, href: '/settings/shipping' },
    {
      label: t('stepSeller'),
      done: Boolean(store.seller.companyName && store.seller.email && store.terms),
      href: '/settings',
    },
    { label: t('stepOpen'), done: store.published, href: '/settings' },
  ];
  const tiles: Array<[string, string, string | null]> = [
    [tNum('products'), String(numbers.products), can(roles, 'products') ? '/products' : null],
    [tNum('published'), String(numbers.published), null],
    ...(seesOrders
      ? ([
          [tNum('openOrders'), String(numbers.openOrders), '/orders'],
          [tNum('toShip'), String(numbers.toShip), '/orders?status=paid'],
        ] as Array<[string, string, string | null]>)
      : []),
    ...(can(roles, 'stats')
      ? ([[tNum('sales30d'), money(numbers.sales30dCents), '/stats']] as Array<
          [string, string, string | null]
        >)
      : []),
    [tNum('soldOut'), String(numbers.soldOut), null],
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold break-words">{store.name}</h1>
          <p className="mt-1 text-sm text-ink/70 dark:text-paper/70">
            {store.published ? t('open', { url: shopUrl }) : t('closed')}
          </p>
        </div>
        <Link href={`/s/${store.slug}`} className={buttonClass('secondary')}>
          {tOwner('viewShop')}
        </Link>
      </div>

      {!owner ? (
        <Panel className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm">
            {tTeam('youAre', {
              store: store.name,
              role: roles.map((x) => translator(locale, 'team.roles')(x)).join(', '),
            })}
          </p>
          <JoinButton leave />
        </Panel>
      ) : null}

      {can(roles, 'settings') && steps.some((s) => !s.done) ? (
        <Panel className="space-y-2">
          <h2 className="font-display text-lg font-semibold">{t('checklist')}</h2>
          <ol className="space-y-1 text-sm">
            {steps.map((s) => (
              <li key={s.label} className="flex items-center gap-2">
                <span
                  aria-hidden
                  className={
                    s.done ? 'text-green-700 dark:text-green-400' : 'text-ink/30 dark:text-paper/30'
                  }
                >
                  {s.done ? '✓' : '○'}
                </span>
                {s.done ? (
                  <span className="text-ink/60 line-through dark:text-paper/60">
                    {s.label} <span className="sr-only">({t('done')})</span>
                  </span>
                ) : (
                  <Link href={s.href} className="underline hover:text-quake">
                    {s.label}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </Panel>
      ) : null}

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {tiles.map(([label, value, href]) => (
          <div
            key={label}
            className="relative rounded-xl border border-ink/10 bg-white/70 p-4 hover:border-quake dark:border-paper/10 dark:bg-paper/5"
          >
            <dt className="text-xs text-ink/60 dark:text-paper/60">
              {href ? (
                <Link href={href} className="after:absolute after:inset-0">
                  {label}
                </Link>
              ) : (
                label
              )}
            </dt>
            <dd className="font-display text-2xl font-bold">{value}</dd>
          </div>
        ))}
      </dl>

      <TaskBoard board={board} locale={locale} timeZone={timeZone} />

      {seesOrders ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-xl font-semibold">{t('recentOrders')}</h2>
            <Link href="/orders" className="text-sm underline hover:text-quake">
              {t('allOrders')}
            </Link>
          </div>
          {orders.length === 0 ? (
            <p className="text-sm text-ink/60 dark:text-paper/60">{t('noOrders')}</p>
          ) : (
            <ul className="divide-y divide-ink/10 rounded-xl border border-ink/10 dark:divide-paper/10 dark:border-paper/10">
              {orders.map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/orders/${o.id}`}
                    className="flex flex-wrap items-center gap-3 p-3 hover:bg-quake/5"
                  >
                    <span className="font-mono text-sm">{orderReference(o.id)}</span>
                    <span className="min-w-0 flex-1 truncate">{o.buyerName}</span>
                    <StatusBadge status={o.status} locale={locale} />
                    <span className="text-xs text-ink/60 dark:text-paper/60">
                      {formatDateTime(o.createdAt, timeZone, 'datetime', locale)}
                    </span>
                    <span className="font-semibold">
                      {moneyIn(locale, o.currency)(o.totalCents)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-ink/60 dark:text-paper/60">{t('mailNote')}</p>
        </section>
      ) : null}
    </div>
  );
}
