import { linkedCalendarEvents, nextDays, type PluginPageProps } from '@devquake/plugin-sdk';
import { LOCALE_TAGS, LinkedEvents, Link, buttonClass, cn } from '@devquake/ui';
import { localeOf, translator } from '../i18n';
import { Calendar } from '../components/calendar';
import { pageScope, requireProfile } from '../components/guard';
import { JoinForm } from '../components/share-actions';
import { StatsView } from '../components/stats-view';
import { StatusBadge } from '../components/status';
import { SwipeTabs } from '../components/swipe-tabs';
import { Panel } from '../components/ui';
import { UtilityForm } from '../components/utility-form';
import { UtilitySuggestions } from '../components/utility-suggestions';
import { overviewForUser, type UtilitySummary } from '../lib/data';
import { todayIn } from '../lib/dates';
import { formatters, type Formatters } from '../lib/format';
import { CATEGORIES, category } from '../lib/model';

export function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('meta.home') };
}

/**
 * Home: four tabs that can be swiped on phones. "Bills" lists the utilities the user shares
 * (grouped by category), "Calendar" their part month by month or by year, "Statistics" the
 * consumption, payments and prices, "New" creates a utility or joins one with a code.
 */
export default async function Home({ ctx }: PluginPageProps) {
  const scope = pageScope(ctx);
  if (!scope.ok) return scope.notice;
  const { db, user } = scope;
  await requireProfile(ctx, db, user, '/');
  const locale = localeOf(ctx);
  const t = translator(locale, 'home');
  const f = formatters(LOCALE_TAGS[locale]);
  const today = todayIn(ctx.timeZone);
  const tl = translator(locale, 'linkedEvents');
  const [{ utilities, bills }, linked] = await Promise.all([
    overviewForUser(db, user.id),
    // The next 31 days of the apps this one is connected to (ADR 0035).
    linkedCalendarEvents(ctx.links, nextDays(today), '/'),
  ]);

  return (
    <div>
      <h1 className="sr-only">{t('srTitle')}</h1>
      <SwipeTabs
        label={t('tabs')}
        tabs={[
          {
            id: 'bills',
            label: t('bills'),
            content: <UtilityList utilities={utilities} t={translator(locale)} f={f} />,
          },
          {
            id: 'calendar',
            label: t('calendar'),
            content: (
              <div className="space-y-6">
                <Calendar bills={bills} thisMonth={today.slice(0, 7)} />
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
            id: 'stats',
            label: t('stats'),
            content: <StatsView bills={bills} thisYear={Number(today.slice(0, 4))} />,
          },
          {
            id: 'new',
            label: t('new'),
            content: (
              <div className="grid gap-4 md:grid-cols-2">
                <Panel>
                  <h2 className="font-display text-lg font-semibold">{t('createTitle')}</h2>
                  <p className="mt-1 text-sm text-ink/70 dark:text-paper/70">{t('createBody')}</p>
                  <div className="mt-3">
                    <UtilitySuggestions />
                  </div>
                  <UtilityForm />
                </Panel>
                <Panel>
                  <h2 className="font-display text-lg font-semibold">{t('joinTitle')}</h2>
                  <p className="mt-1 text-sm text-ink/70 dark:text-paper/70">{t('joinBody')}</p>
                  <JoinForm />
                </Panel>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}

function UtilityList({
  utilities,
  t,
  f,
}: {
  utilities: UtilitySummary[];
  t: ReturnType<typeof translator>;
  f: Formatters;
}) {
  if (utilities.length === 0) {
    return (
      <Panel className="text-center">
        <p className="text-sm text-ink/70 dark:text-paper/70">{t('home.empty')}</p>
        <p className="mt-3">
          <a href="#new" className={buttonClass()}>
            {t('home.new')}
          </a>
        </p>
      </Panel>
    );
  }
  // Grouped by category, in the order of the catalogue.
  const groups = new Map<string, UtilitySummary[]>();
  for (const u of utilities) groups.set(u.category, [...(groups.get(u.category) ?? []), u]);
  const tStatus = (key: string) => t(`status.${key}`);
  const order = (code: string) => CATEGORIES.findIndex((c) => c.code === code);
  return (
    <div className="space-y-6">
      {[...groups.entries()]
        .sort(([a], [b]) => order(a) - order(b))
        .map(([code, list]) => (
          <section key={code}>
            <h2 className="mb-2 font-display text-lg font-semibold">
              <span aria-hidden>{category(code).icon} </span>
              {t(`categories.${code}`)}
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {list.map((u) => (
                <li key={u.id}>
                  <Link
                    href={`/utilities/${u.id}`}
                    className="block h-full rounded-xl border border-ink/10 bg-white/70 p-4 hover:border-quake dark:border-paper/10 dark:bg-paper/5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{u.name}</p>
                        <p className="truncate text-xs text-ink/60 dark:text-paper/60">
                          {[
                            u.provider,
                            u.role === 'owner'
                              ? t('home.yours')
                              : t('home.sharedBy', { name: u.ownerName }),
                            t('home.people', { count: u.members }),
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      </div>
                      {u.latest ? (
                        <StatusBadge status={u.latest.status} t={tStatus} compact />
                      ) : null}
                    </div>
                    <p className="mt-3 text-sm">
                      {u.latest
                        ? t('home.latest', {
                            month: f.month(u.latest.period),
                            amount: f.money(u.latest.total, u.currency),
                          })
                        : t('home.noBills')}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-x-3 text-xs">
                      {u.myMissingReadings > 0 ? (
                        <span className="font-medium text-amber-700 dark:text-amber-400">
                          <span aria-hidden>⏳ </span>
                          {t('home.readingsDue', { count: u.myMissingReadings })}
                        </span>
                      ) : null}
                      {u.outstanding > 0 ? (
                        <span className={cn('font-medium text-amber-700 dark:text-amber-400')}>
                          <span aria-hidden>⚠ </span>
                          {u.role === 'owner'
                            ? t('home.owedToYou', { amount: f.money(u.outstanding, u.currency) })
                            : t('home.youOwe', { amount: f.money(u.outstanding, u.currency) })}
                        </span>
                      ) : null}
                      {u.openBills > 0 ? (
                        <span className="text-ink/60 dark:text-paper/60">
                          {t('home.openBills', { count: u.openBills })}
                        </span>
                      ) : null}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
    </div>
  );
}
