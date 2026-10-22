import type { PluginPageProps } from '@devquake/plugin-sdk';
import { LOCALE_TAGS, Link, buttonClass, cn } from '@devquake/ui';
import { orgScope } from '../components/guard';
import { OrgNav } from '../components/org-nav';
import { localeOf, translator } from '../i18n';
import { birthdayIn, isMonth, monthGrid, shiftMonth } from '../lib/calendar';
import { listPeople } from '../lib/data';
import { ageOn } from '../lib/model';

export async function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('orgNav.calendar') };
}

/** A month with a birthday badge on each person's day, and the age they turn. */
export default async function CalendarPage({ ctx, params, searchParams }: PluginPageProps) {
  const scope = await orgScope(ctx, params, 'people.view');
  if (!scope.ok) return scope.notice;
  const t = translator(scope.locale);
  const asked = (await searchParams).month;
  const month = isMonth(asked) ? asked : scope.today.slice(0, 7);
  const year = Number(month.slice(0, 4));
  const people = (await listPeople(scope.db, scope.org.id, scope.user.id)).filter(
    (p) => p.status !== 'ended' && p.birthDate,
  );
  const byDay = new Map<string, { id: number; name: string; age: number }[]>();
  for (const p of people) {
    const day = birthdayIn(p.birthDate!, year);
    if (!day.startsWith(month)) continue;
    const list = byDay.get(day) ?? [];
    list.push({ id: p.id, name: `${p.firstName} ${p.lastName}`, age: ageOn(p.birthDate!, day) });
    byDay.set(day, list);
  }
  const tag = LOCALE_TAGS[scope.locale];
  const title = new Date(`${month}-15T12:00:00Z`).toLocaleDateString(tag, {
    month: 'long',
    year: 'numeric',
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
        <h1 className="font-display text-2xl font-bold capitalize">{title}</h1>
        <div className="flex flex-wrap gap-2">
          <Link href={`${base}?month=${shiftMonth(month, -1)}`} className={buttonClass('ghost')}>
            ← {t('calendar.previous')}
          </Link>
          <Link href={base} className={buttonClass('ghost')}>
            {t('calendar.thisMonth')}
          </Link>
          <Link href={`${base}?month=${shiftMonth(month, 1)}`} className={buttonClass('ghost')}>
            {t('calendar.next')} →
          </Link>
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="grid min-w-[42rem] grid-cols-7 gap-1">
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
                  'min-h-24 rounded-md border p-1.5',
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
              </div>
            ) : (
              <div key={`empty-${i}`} />
            ),
          )}
        </div>
      </div>
    </>
  );
}
