'use client';

import type { ListSummary } from '../lib/data';
import { addDays, type IsoDate } from '../lib/dates';
import {
  computeTotals,
  formatQuantity,
  groupByStore,
  isOpen,
  lineTotal,
  type Item,
  type Store,
} from '../lib/model';
import { storeType } from '../lib/store-types';
import { Link, buttonClass, cn, rich, useT, thumbUrl } from '@devquake/ui';
import { Panel } from './ui';
import { useFormat } from './use-format';
import { useToday } from './use-today';

export interface ListDetails {
  stores: Store[];
  items: Item[];
}

/**
 * The lists planned for today (the visitor's local day) with their products and prices, grouped
 * by store. Other days live in the calendar.
 */
export function TodayView({
  lists,
  details,
  serverToday,
}: {
  lists: ListSummary[];
  /** Items of the lists around today, by list id (enough for any timezone). */
  details: Record<number, ListDetails>;
  serverToday: IsoDate;
}) {
  const t = useT('today');
  const f = useFormat();
  const today = useToday(serverToday);
  const todays = lists.filter((l) => l.shopDate === today);
  const upcoming = lists
    .filter((l) => l.shopDate > today)
    .sort((a, b) => a.shopDate.localeCompare(b.shopDate))[0];

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink/60 dark:text-paper/60">{f.day(today)}</p>
      {todays.length === 0 ? (
        <Panel>
          <p className="font-medium">{t('none')}</p>
          <p className="mt-1 text-sm text-ink/70 dark:text-paper/70">
            {upcoming
              ? rich(t('nextUp'), {
                  list: (
                    <Link
                      href={`/lists/${upcoming.id}`}
                      className="font-medium text-quake underline"
                    >
                      {upcoming.name}
                    </Link>
                  ),
                  day:
                    upcoming.shopDate === addDays(today, 1)
                      ? t('tomorrow')
                      : f.day(upcoming.shopDate),
                })
              : t('planHint')}
          </p>
          <a href="#new" className={buttonClass('primary', 'mt-3')}>
            {t('newList')}
          </a>
        </Panel>
      ) : (
        todays.map((l) => <TodayList key={l.id} list={l} details={details[l.id]} />)
      )}
    </div>
  );
}

function TodayList({ list, details }: { list: ListSummary; details?: ListDetails }) {
  const items = details?.items ?? [];
  const groups = groupByStore(details?.stores ?? [], items);
  const open = computeTotals(items.filter(isOpen));
  const all = computeTotals(items);
  const t = useT('today');
  const tRoot = useT();
  const f = useFormat();
  return (
    <Panel flush>
      <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-ink/10 px-4 py-3 dark:border-paper/10">
        <div>
          <h2 className="font-display text-xl font-bold">{list.name}</h2>
          <p className="text-xs text-ink/60 dark:text-paper/60">
            {t('summary', {
              open: list.open,
              done: list.done,
              people: t('people', { count: list.members }),
            })}
          </p>
        </div>
        <Link href={`/lists/${list.id}`} className={buttonClass()}>
          {t('open')}
        </Link>
      </header>
      {items.length === 0 ? (
        <p className="px-4 py-3 text-sm text-ink/60 dark:text-paper/60">{t('noProducts')}</p>
      ) : (
        groups.map((g) => (
          <section
            key={g.store?.id ?? 'none'}
            className="border-b border-ink/5 px-4 py-2 last:border-0 dark:border-paper/5"
          >
            <h3 className="flex items-baseline justify-between text-sm font-semibold">
              <span>
                {g.store?.name ?? tRoot('list.anyStore')}
                {g.store ? (
                  <span className="ml-2 text-xs font-normal text-ink/60 dark:text-paper/60">
                    {tRoot(`storeTypes.${storeType(g.store.type).code}.label`)}
                    {g.store.location ? ` · ${g.store.location}` : ''}
                  </span>
                ) : null}
              </span>
              <span className="tabular-nums">{f.money(g.total, list.currency)}</span>
            </h3>
            <ul className="mt-1 space-y-0.5">
              {g.items.map((i) => (
                <TodayItem key={i.id} item={i} currency={list.currency} />
              ))}
            </ul>
          </section>
        ))
      )}
      <footer className="flex justify-between border-t border-ink/10 px-4 py-2 text-sm dark:border-paper/10">
        <span>
          {rich(t('stillToBuy'), {
            amount: <strong className="tabular-nums">{f.money(open.total, list.currency)}</strong>,
          })}
        </span>
        <span className="text-ink/60 dark:text-paper/60">
          {t('whole', { amount: f.money(all.total, list.currency) })}
          {all.unpriced ? ` · ${t('unpriced', { count: all.unpriced })}` : ''}
        </span>
      </footer>
    </Panel>
  );
}

function TodayItem({ item, currency }: { item: Item; currency: string }) {
  const line = lineTotal(item);
  const t = useT('today');
  const f = useFormat();
  return (
    <li
      className={cn(
        'flex justify-between gap-3 rounded text-sm',
        item.done && 'text-ink/45 dark:text-paper/45',
        item.dropped && 'line-through',
        item.done && item.dropped && 'bg-ink/10 px-1 dark:bg-black/40',
      )}
    >
      <span className="flex min-w-0 items-center gap-2 truncate">
        {item.photo ? (
          // eslint-disable-next-line @next/next/no-img-element -- authenticated API image
          <img
            src={thumbUrl(item.photo)}
            alt=""
            loading="lazy"
            className="size-6 shrink-0 rounded object-cover"
          />
        ) : null}
        {item.name}{' '}
        <span className="text-ink/60 dark:text-paper/60">
          {formatQuantity(item.quantity, item.unit)}
        </span>
      </span>
      <span className="shrink-0 tabular-nums">
        {item.done && item.dropped ? (
          <span aria-label={t('wastedLabel')} title={t('wastedTitle')}>
            🙃{' '}
          </span>
        ) : null}
        {item.dropped && !item.done ? '—' : line === null ? '—' : f.money(line, currency)}
      </span>
    </li>
  );
}
