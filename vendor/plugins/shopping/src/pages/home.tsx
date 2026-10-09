import { linkedCalendarEvents, nextDays, type PluginPageProps } from '@devquake/plugin-sdk';
import { LinkedEvents, PartnerPromo } from '@devquake/ui';
import { localeOf, translator } from '../i18n';
import { Calendar } from '../components/calendar';
import { pageScope } from '../components/guard';
import { CopyListsForm, CreateListForm, JoinForm } from '../components/home-forms';
import { LiveRefresh } from '../components/live-refresh';
import { StatsView } from '../components/stats-view';
import { SwipeTabs } from '../components/swipe-tabs';
import { TodayView, type ListDetails } from '../components/today-view';
import { Panel } from '../components/ui';
import {
  changesFingerprint,
  itemsOfLists,
  listsForUser,
  priceHistory,
  statsInput,
} from '../lib/data';
import { averageChange, estimateAccuracy, priceChanges } from '../lib/prices';
import { addDays, todayIn } from '../lib/dates';
import { buildStats } from '../lib/stats';

export function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('meta.home') };
}

/**
 * Home: four tabs that can be swiped on phones. "Today" (default) shows today's lists with
 * products and prices, "Calendar" every list by date, "New list" creates or joins one, and
 * "Statistics" sums everything up.
 */
export default async function Home({ ctx }: PluginPageProps) {
  const scope = pageScope(ctx);
  if (!scope.ok) return scope.notice;
  const { db, user } = scope;
  const locale = localeOf(ctx);
  const t = translator(locale, 'home');
  const tl = translator(locale, 'linkedEvents');

  // Today in the visitor's time zone (ctx.timeZone, ADR 0010); the browser re-checks it.
  // Items are loaded for one day around it in case the zone is not known yet.
  const serverToday = todayIn(ctx.timeZone);
  const [lists, input, history, fingerprint, linked] = await Promise.all([
    listsForUser(db, user.id),
    statsInput(db, user.id),
    priceHistory(db, user.id),
    changesFingerprint(db, user.id),
    // The next 31 days of the apps this one is connected to (ADR 0035).
    linkedCalendarEvents(ctx.links, nextDays(serverToday), '/'),
  ]);
  const near = lists.filter(
    (l) => l.shopDate >= addDays(serverToday, -1) && l.shopDate <= addDays(serverToday, 1),
  );
  const items = await itemsOfLists(
    db,
    user.id,
    near.map((l) => l.id),
  );
  const details: Record<number, ListDetails> = Object.fromEntries(items);

  // The family planner, where shopping days can show (ADR 0035): a card until connected.
  const family = (await ctx.links?.list().catch(() => []))?.find((x) => x.app === 'family') ?? null;
  return (
    <div>
      <h1 className="sr-only">{t('srTitle')}</h1>
      <LiveRefresh fingerprint={fingerprint} />
      {family ? (
        <div className="mb-4">
          <PartnerPromo partner={family} message={t('familyPromo')} />
        </div>
      ) : null}
      <SwipeTabs
        label={t('tabs')}
        tabs={[
          {
            id: 'today',
            label: t('today'),
            content: <TodayView lists={lists} details={details} serverToday={serverToday} />,
          },
          {
            id: 'calendar',
            label: t('calendar'),
            content: (
              <div className="space-y-6">
                <Calendar lists={lists} serverToday={serverToday} />
                <LinkedEvents
                  events={linked}
                  timeZone={ctx.timeZone ?? 'UTC'}
                  locale={locale}
                  labels={{
                    title: tl('title'),
                    intro: tl('intro'),
                    allDay: tl('allDay'),
                    openIn: tl('openIn'),
                    month: tl('month'),
                    allMonths: tl('allMonths'),
                    day: tl('day'),
                    allDays: tl('allDays'),
                    noEvents: tl('noEvents'),
                  }}
                />
              </div>
            ),
          },
          {
            id: 'new',
            label: t('new'),
            content: (
              <div className="grid gap-4 sm:grid-cols-2">
                <Panel>
                  <h2 className="font-display text-lg font-semibold">{t('planTitle')}</h2>
                  <CreateListForm serverToday={serverToday} />
                </Panel>
                <Panel>
                  <h2 className="font-display text-lg font-semibold">{t('joinTitle')}</h2>
                  <JoinForm />
                </Panel>
                <Panel className="sm:col-span-2">
                  <h2 className="font-display text-lg font-semibold">{t('copyTitle')}</h2>
                  <p className="mt-1 text-sm text-ink/70 dark:text-paper/70">{t('copyIntro')}</p>
                  <CopyListsForm
                    lists={lists.map((l) => ({ id: l.id, name: l.name, shopDate: l.shopDate }))}
                    serverToday={serverToday}
                  />
                </Panel>
              </div>
            ),
          },
          {
            id: 'stats',
            label: t('stats'),
            content: (
              <StatsView
                stats={buildStats(input)}
                prices={{
                  changes: priceChanges(history),
                  average: averageChange(priceChanges(history, 1000)),
                  accuracy: estimateAccuracy(history),
                }}
              />
            ),
          },
        ]}
      />
    </div>
  );
}
