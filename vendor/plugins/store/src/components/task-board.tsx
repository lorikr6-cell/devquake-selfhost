import type { ReactNode } from 'react';
import { Link, cn, formatDateTime, type Locale } from '@devquake/ui';
import { translator } from '../i18n';
import { orderReference } from '../lib/model';
import type { TaskBoard as Board } from '../lib/tasks-data';
import { countryNamer } from './guard';
import { QuickAction } from './task-actions';

// The Overview's task board: one panel per role (the owner and managers see all), with what
// waits, how the area stands, and buttons for the most common actions.

function Panel({
  title,
  href,
  hrefLabel,
  children,
  alert,
}: {
  title: string;
  href: string;
  hrefLabel: string;
  children: ReactNode;
  alert: boolean;
}) {
  return (
    <section
      className={cn(
        'flex flex-col gap-3 rounded-xl border bg-white/70 p-4 dark:bg-paper/5',
        alert ? 'border-quake/60' : 'border-ink/10 dark:border-paper/10',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-display text-lg font-semibold">{title}</h3>
        <Link href={href} className="text-sm underline hover:text-quake">
          {hrefLabel}
        </Link>
      </div>
      {children}
    </section>
  );
}

function Counts({ items }: { items: Array<[string, number, boolean?]> }) {
  return (
    <dl className="grid grid-cols-2 gap-2 text-sm">
      {items.map(([label, n, warn]) => (
        <div key={label} className="rounded-lg bg-ink/5 px-3 py-2 dark:bg-paper/5">
          <dt className="text-xs text-ink/60 dark:text-paper/60">{label}</dt>
          <dd className={cn('font-display text-xl font-bold', warn && n > 0 && 'text-quake')}>
            {n}
          </dd>
        </div>
      ))}
    </dl>
  );
}

const Empty = ({ children }: { children: ReactNode }) => (
  <p className="text-sm text-green-700 dark:text-green-400">✓ {children}</p>
);

export function TaskBoard({
  board,
  locale,
  timeZone,
}: {
  board: Board;
  locale: Locale;
  timeZone: string;
}) {
  const t = translator(locale, 'tasks');
  const tMethods = translator(locale, 'methods');
  const tStatus = translator(locale, 'status');
  const country = countryNamer(locale);
  const when = (v: string) => formatDateTime(v, timeZone, 'datetime', locale);
  const { shipping, support, catalog, marketing, maintenance } = board;

  return (
    <section className="space-y-3">
      <h2 className="font-display text-xl font-semibold">{t('title')}</h2>
      <div className="grid gap-4 lg:grid-cols-2">
        {shipping ? (
          <Panel
            title={t('shipping.title')}
            href="/orders"
            hrefLabel={t('shipping.all')}
            alert={shipping.toShip > 0}
          >
            <Counts
              items={[
                [t('shipping.toShip'), shipping.toShip, true],
                [t('shipping.inTransit'), shipping.inTransit],
              ]}
            />
            {shipping.orders.length === 0 ? (
              <Empty>{t('shipping.none')}</Empty>
            ) : (
              <ul className="divide-y divide-ink/10 text-sm dark:divide-paper/10">
                {shipping.orders.map((o) => (
                  <li key={o.id} className="flex flex-wrap items-center gap-2 py-2">
                    <Link href={`/orders/${o.id}`} className="font-mono hover:text-quake">
                      {orderReference(o.id)}
                    </Link>
                    <span className="min-w-0 flex-1 truncate">
                      {o.buyerName} · {country(o.country)}
                    </span>
                    <span className="text-xs text-ink/60 dark:text-paper/60">
                      {tMethods(o.method)} · {tStatus(o.status)}
                    </span>
                    <QuickAction
                      path={`/orders/${o.id}`}
                      method="PATCH"
                      body={{ status: 'shipped' }}
                      label={t('shipping.markShipped')}
                      done={t('shipping.shipped')}
                    />
                  </li>
                ))}
              </ul>
            )}
            {shipping.zones === 0 ? (
              <Link href="/settings/shipping" className="text-sm font-medium text-quake underline">
                {t('shipping.noZones')}
              </Link>
            ) : null}
          </Panel>
        ) : null}

        {support ? (
          <Panel
            title={t('support.title')}
            href="/messages"
            hrefLabel={t('support.all')}
            alert={support.unread + support.pendingReviews > 0}
          >
            <Counts
              items={[
                [t('support.unread'), support.unread, true],
                [t('support.open'), support.open],
                [t('support.pendingReviews'), support.pendingReviews, true],
              ]}
            />
            {support.threads.length === 0 && support.reviews.length === 0 ? (
              <Empty>{t('support.none')}</Empty>
            ) : null}
            {support.threads.length > 0 ? (
              <ul className="divide-y divide-ink/10 text-sm dark:divide-paper/10">
                {support.threads.map((th) => (
                  <li key={th.id} className="py-2">
                    <Link href={`/messages/${th.id}`} className="font-medium hover:text-quake">
                      {th.subject}
                    </Link>
                    <span className="block text-xs text-ink/60 dark:text-paper/60">
                      {th.buyer} · {when(th.lastAt)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
            {support.reviews.length > 0 ? (
              <ul className="divide-y divide-ink/10 text-sm dark:divide-paper/10">
                {support.reviews.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center gap-2 py-2">
                    <span className="text-quake">{'★'.repeat(r.rating)}</span>
                    <span className="min-w-0 flex-1 truncate">
                      {r.productName} · {r.author}
                    </span>
                    <QuickAction
                      path={`/reviews/${r.id}`}
                      method="PATCH"
                      body={{ status: 'published' }}
                      label={t('support.publish')}
                      done={t('support.published')}
                    />
                    <Link href="/reviews" className="text-xs underline hover:text-quake">
                      {t('support.read')}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </Panel>
        ) : null}

        {catalog ? (
          <Panel
            title={t('catalog.title')}
            href="/products"
            hrefLabel={t('catalog.all')}
            alert={catalog.soldOut > 0}
          >
            <Counts
              items={[
                [t('catalog.soldOut'), catalog.soldOut, true],
                [t('catalog.lowStock'), catalog.lowStock, true],
                [t('catalog.drafts'), catalog.drafts],
                [t('catalog.noPhoto'), catalog.noPhoto, true],
              ]}
            />
            {catalog.products.length === 0 ? (
              <Empty>{t('catalog.none')}</Empty>
            ) : (
              <ul className="divide-y divide-ink/10 text-sm dark:divide-paper/10">
                {catalog.products.map((p) => (
                  <li key={p.id} className="flex items-center gap-2 py-2">
                    <Link
                      href={`/products/${p.id}`}
                      className="min-w-0 flex-1 truncate hover:text-quake"
                    >
                      {p.name}
                    </Link>
                    <span
                      className={cn(
                        'text-xs font-semibold',
                        p.stock <= 0
                          ? 'text-red-700 dark:text-red-400'
                          : 'text-amber-700 dark:text-amber-400',
                      )}
                    >
                      {p.stock <= 0 ? t('catalog.out') : t('catalog.left', { count: p.stock })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/settings/seo" className="text-sm underline hover:text-quake">
              {t('catalog.seo')}
            </Link>
          </Panel>
        ) : null}

        {marketing ? (
          <Panel
            title={t('marketing.title')}
            href="/marketing"
            hrefLabel={t('marketing.all')}
            alert={marketing.usedUpVouchers > 0 || marketing.draftNewsletters > 0}
          >
            <Counts
              items={[
                [t('marketing.vouchers'), marketing.liveVouchers],
                [t('marketing.rules'), marketing.liveRules],
                [t('marketing.usedUp'), marketing.usedUpVouchers, true],
                [t('marketing.subscribers'), marketing.subscribers],
              ]}
            />
            {marketing.liveCampaigns.length === 0 ? (
              <p className="text-sm text-ink/60 dark:text-paper/60">{t('marketing.noCampaign')}</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {marketing.liveCampaigns.map((c) => (
                  <li key={c.id} className="flex flex-wrap justify-between gap-2">
                    <span className="font-medium">
                      {c.name} · −{c.percentOff}%
                    </span>
                    <span className="text-xs text-ink/60 dark:text-paper/60">
                      {c.endsAt
                        ? t('marketing.until', { date: when(c.endsAt) })
                        : t('marketing.noEnd')}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-sm">
              {t('marketing.newsletters', {
                drafts: marketing.draftNewsletters,
                sending: marketing.sendingNewsletters,
              })}{' '}
              <Link href="/newsletters" className="underline hover:text-quake">
                {t('marketing.openNewsletters')}
              </Link>
            </p>
            {marketing.scheduledCampaigns > 0 ? (
              <p className="text-xs text-ink/60 dark:text-paper/60">
                {t('marketing.scheduled', { count: marketing.scheduledCampaigns })}
              </p>
            ) : null}
          </Panel>
        ) : null}

        {maintenance ? (
          <Panel
            title={t('maintenance.title')}
            href="/settings"
            hrefLabel={t('maintenance.all')}
            alert={maintenance.maintenance || maintenance.checks.some((c) => !c.ok)}
          >
            {maintenance.maintenance ? (
              <div className="flex flex-wrap items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
                <span className="flex-1">{t('maintenance.on')}</span>
                <QuickAction
                  path="/store/maintenance"
                  method="PUT"
                  body={{ on: false, message: null }}
                  label={t('maintenance.turnOff')}
                  done={t('maintenance.turnedOff')}
                  refresh
                />
              </div>
            ) : null}
            <ul className="space-y-1 text-sm">
              {maintenance.checks.map((c) => (
                <li key={c.key} className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className={c.ok ? 'text-green-700 dark:text-green-400' : 'text-quake'}
                  >
                    {c.ok ? '✓' : '!'}
                  </span>
                  {c.ok ? (
                    <span>{t(`maintenance.ok.${c.key}`)}</span>
                  ) : (
                    <Link href={c.href} className="underline hover:text-quake">
                      {t(`maintenance.todo.${c.key}`)}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </Panel>
        ) : null}
      </div>
    </section>
  );
}
