import type { PluginPageProps } from '@devquake/plugin-sdk';
import { LOCALE_TAGS, Link, buttonClass, cn } from '@devquake/ui';
import { orgScope } from '../components/guard';
import { PrintButton } from '../components/meals';
import { OrgNav } from '../components/org-nav';
import { localeOf, translator } from '../i18n';
import { birthdayIn, isMonth, monthGrid, shiftMonth } from '../lib/calendar';
import { listPeople } from '../lib/data';
import { DELIVERY_MEAL, dishLines, formatTime, portionsFor, type MealTime } from '../lib/meals';
import { eatersOf, listMealTimes, menusBetween, type Menu } from '../lib/meals-data';
import { ageOn } from '../lib/model';
import { routesBetween } from '../lib/routes-data';

export async function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('orgNav.calendar') };
}

/**
 * A month with a birthday badge on each person's day, and below it everything assigned day by
 * day (birthdays, menus, routes with their people, portions), as far as the viewer's role may
 * see it. Prints as the month on one page and the days after it.
 */
export default async function CalendarPage({ ctx, params, searchParams }: PluginPageProps) {
  const scope = await orgScope(ctx, params, 'people.view');
  if (!scope.ok) return scope.notice;
  const t = translator(scope.locale);
  const asked = (await searchParams).month;
  const month = isMonth(asked) ? asked : scope.today.slice(0, 7);
  const year = Number(month.slice(0, 4));
  const days = monthGrid(month).filter((d): d is string => d !== null);
  const kitchen = scope.can('kitchen.view');
  const planner = scope.can('routes.edit');
  const [allPeople, menus, mealTimes, eaters, routes] = await Promise.all([
    listPeople(scope.db, scope.org.id, scope.user.id),
    kitchen
      ? menusBetween(scope.db, scope.org.id, scope.user.id, days[0]!, days.length)
      : ([] as Menu[]),
    kitchen ? listMealTimes(scope.db, scope.org.id, scope.user.id) : ([] as MealTime[]),
    kitchen ? eatersOf(scope.db, scope.org.id, scope.user.id) : [],
    planner ? routesBetween(scope.db, scope.org.id, scope.user.id, days[0]!, days.at(-1)!) : [],
  ]);
  const people = allPeople.filter((p) => p.status !== 'ended' && p.birthDate);
  const byDay = new Map<string, { id: number; name: string; age: number }[]>();
  for (const p of people) {
    const day = birthdayIn(p.birthDate!, year);
    if (!day.startsWith(month)) continue;
    const list = byDay.get(day) ?? [];
    list.push({ id: p.id, name: `${p.firstName} ${p.lastName}`, age: ageOn(p.birthDate!, day) });
    byDay.set(day, list);
  }
  const meals = [
    { id: DELIVERY_MEAL, name: t('meals.delivered') },
    ...mealTimes.map((m) => ({
      id: m.id,
      name: `${m.name} ${formatTime(m.startsMin)}–${formatTime(m.endsMin)}`,
    })),
  ];
  const tag = LOCALE_TAGS[scope.locale];
  const title = new Date(`${month}-15T12:00:00Z`).toLocaleDateString(tag, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
  const dayTitle = (day: string) =>
    new Date(`${day}T12:00:00Z`).toLocaleDateString(tag, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      timeZone: 'UTC',
    });
  // 19 October 2026 is a Monday.
  const weekdays = [0, 1, 2, 3, 4, 5, 6].map((i) =>
    new Date(Date.UTC(2026, 9, 19 + i)).toLocaleDateString(tag, {
      weekday: 'short',
      timeZone: 'UTC',
    }),
  );
  const base = `/orgs/${scope.org.id}/calendar`;

  // Every day with something assigned, for the grid below the month.
  const agenda = days
    .map((day) => {
      const dayMenus = menus.filter((m) => m.day === day);
      const dayRoutes = routes.filter((r) => r.day === day);
      const portions = kitchen
        ? meals
            .map((m) => ({ meal: m.name, count: portionsFor(eaters, day, m.id).length }))
            .filter((p) => p.count > 0)
        : [];
      return { day, birthdays: byDay.get(day) ?? [], dayMenus, dayRoutes, portions };
    })
    .filter(
      (d) => d.birthdays.length || d.dayMenus.length || d.dayRoutes.length || d.portions.length,
    );

  return (
    <>
      <OrgNav
        orgId={scope.org.id}
        orgName={scope.org.name}
        current="calendar"
        can={scope.can}
        t={t}
      />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold capitalize">
          <span className="hidden print:inline">{scope.org.name} · </span>
          {title}
        </h1>
        <div className="flex flex-wrap gap-2 print:hidden">
          <Link href={`${base}?month=${shiftMonth(month, -1)}`} className={buttonClass('ghost')}>
            ← {t('calendar.previous')}
          </Link>
          <Link href={base} className={buttonClass('ghost')}>
            {t('calendar.thisMonth')}
          </Link>
          <Link href={`${base}?month=${shiftMonth(month, 1)}`} className={buttonClass('ghost')}>
            {t('calendar.next')} →
          </Link>
          <PrintButton />
        </div>
      </div>
      <div className="overflow-x-auto print:overflow-visible">
        <div className="grid min-w-[42rem] grid-cols-7 gap-1 print:min-w-0">
          {weekdays.map((w) => (
            <div
              key={w}
              className="px-2 py-1 text-xs font-medium capitalize text-ink/60 dark:text-paper/60"
            >
              {w}
            </div>
          ))}
          {monthGrid(month).map((day, i) =>
            day ? (
              <div
                key={day}
                className={cn(
                  'min-h-24 rounded-md border p-1.5 print:min-h-20',
                  day === scope.today ? 'border-quake' : 'border-ink/10 dark:border-paper/10',
                )}
              >
                <span className="text-xs tabular-nums">{Number(day.slice(8))}</span>
                <ul className="mt-1 space-y-1">
                  {(byDay.get(day) ?? []).map((b) => (
                    <li key={b.id}>
                      <Link
                        href={`/orgs/${scope.org.id}/people/${b.id}`}
                        className="block rounded bg-quake/15 px-1.5 py-0.5 text-[11px] leading-tight hover:bg-quake/25"
                        title={t('calendar.turns', { name: b.name, age: b.age })}
                      >
                        🎂 {b.name} · {b.age}
                      </Link>
                    </li>
                  ))}
                </ul>
                {routes.some((r) => r.day === day) ? (
                  <p className="mt-1 text-[11px] text-ink/60 dark:text-paper/60">
                    🚐{' '}
                    {t('routes.stops', {
                      count: routes
                        .filter((r) => r.day === day)
                        .reduce((n, r) => n + r.stops.length, 0),
                    })}
                  </p>
                ) : null}
              </div>
            ) : (
              <div key={`empty-${i}`} />
            ),
          )}
        </div>
      </div>

      <section className="mt-8 print:break-before-page">
        <h2 className="mb-3 text-lg font-semibold">{t('calendar.dayByDay')}</h2>
        {agenda.length === 0 ? (
          <p className="text-sm text-ink/70 dark:text-paper/70">{t('calendar.nothing')}</p>
        ) : (
          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full min-w-3xl border-collapse text-sm print:min-w-0 print:text-xs">
              <thead>
                <tr className="border-b-2 border-ink/20 text-left dark:border-paper/20">
                  <th className="w-28 py-2 pr-3 font-semibold">{t('calendar.day')}</th>
                  <th className="py-2 pr-3 font-semibold">{t('calendar.birthdays')}</th>
                  {kitchen ? (
                    <th className="py-2 pr-3 font-semibold">{t('orgNav.meals')}</th>
                  ) : null}
                  {planner ? (
                    <th className="py-2 pr-3 font-semibold">{t('orgNav.routes')}</th>
                  ) : null}
                  {kitchen ? <th className="py-2 font-semibold">{t('kitchen.perDiet')}</th> : null}
                </tr>
              </thead>
              <tbody>
                {agenda.map((d) => (
                  <tr
                    key={d.day}
                    className={cn(
                      'break-inside-avoid border-b border-ink/10 align-top dark:border-paper/10',
                      d.day === scope.today && 'bg-quake/5',
                    )}
                  >
                    <td className="py-2 pr-3 font-medium capitalize">{dayTitle(d.day)}</td>
                    <td className="py-2 pr-3">
                      {d.birthdays.map((b) => (
                        <div key={b.id}>
                          🎂 {b.name} ({b.age})
                        </div>
                      ))}
                    </td>
                    {kitchen ? (
                      <td className="py-2 pr-3">
                        {d.dayMenus.map((m) => (
                          <div key={m.meal} className="mb-1">
                            <span className="font-medium">
                              {meals.find((x) => x.id === m.meal)?.name ?? ''}:
                            </span>{' '}
                            {dishLines(m.dishes).join(', ')}
                            {Object.entries(m.variants).map(([diet, dishes]) => (
                              <div key={diet} className="text-xs text-ink/70 dark:text-paper/70">
                                {t(`diets.${diet}`)}: {dishLines(dishes ?? '').join(', ')}
                              </div>
                            ))}
                          </div>
                        ))}
                      </td>
                    ) : null}
                    {planner ? (
                      <td className="py-2 pr-3">
                        {d.dayRoutes.map((r) => (
                          <div key={r.driver} className="mb-1">
                            <span className="font-medium">{r.driver}:</span>{' '}
                            {r.stops.map((s, i) => (
                              <span key={i}>
                                {i ? ', ' : ''}
                                {i + 1}. {s.name}
                                {s.delivered ? ' ✓' : ''}
                                {s.note ? ` (“${s.note}”)` : ''}
                              </span>
                            ))}
                          </div>
                        ))}
                      </td>
                    ) : null}
                    {kitchen ? (
                      <td className="py-2">
                        {d.portions.map((p) => (
                          <div key={p.meal}>
                            {p.meal}: {p.count}
                          </div>
                        ))}
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
