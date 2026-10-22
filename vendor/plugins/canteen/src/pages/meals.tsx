import type { PluginPageProps } from '@devquake/plugin-sdk';
import { LOCALE_TAGS, Link, buttonClass } from '@devquake/ui';
import { orgScope } from '../components/guard';
import { CopyLastWeek, MealTimes, WeekMenus } from '../components/meals';
import { OrgNav } from '../components/org-nav';
import { localeOf, translator } from '../i18n';
import { addDays, isIsoDate, mondayOf } from '../lib/dates';
import { listMealTimes, weekMenus } from '../lib/meals-data';

export async function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('orgNav.meals') };
}

/** The week's menus (planners edit them), the residents' meal times and copying a week. */
export default async function MealsPage({ ctx, params, searchParams }: PluginPageProps) {
  const scope = await orgScope(ctx, params, 'kitchen.view');
  if (!scope.ok) return scope.notice;
  const t = translator(scope.locale);
  const asked = (await searchParams).week;
  const monday = mondayOf(typeof asked === 'string' && isIsoDate(asked) ? asked : scope.today);
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const [mealTimes, menus] = await Promise.all([
    listMealTimes(scope.db, scope.org.id, scope.user.id),
    weekMenus(scope.db, scope.org.id, scope.user.id, monday),
  ]);
  const canEdit = scope.can('meals.edit');
  const tag = LOCALE_TAGS[scope.locale];
  const range = `${new Date(`${monday}T12:00:00Z`).toLocaleDateString(tag, { day: 'numeric', month: 'long', timeZone: 'UTC' })} – ${new Date(`${days[6]}T12:00:00Z`).toLocaleDateString(tag, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })}`;
  const base = `/orgs/${scope.org.id}/meals`;

  return (
    <>
      <OrgNav orgId={scope.org.id} orgName={scope.org.name} current="meals" can={scope.can} t={t} />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold">{range}</h1>
        <div className="flex flex-wrap gap-2">
          <Link href={`${base}?week=${addDays(monday, -7)}`} className={buttonClass('ghost')}>
            ← {t('meals.previous')}
          </Link>
          <Link href={base} className={buttonClass('ghost')}>
            {t('meals.thisWeek')}
          </Link>
          <Link href={`${base}?week=${addDays(monday, 7)}`} className={buttonClass('ghost')}>
            {t('meals.next')} →
          </Link>
          {canEdit ? (
            <CopyLastWeek orgId={scope.org.id} from={addDays(monday, -7)} to={monday} />
          ) : null}
        </div>
      </div>
      <WeekMenus
        orgId={scope.org.id}
        days={days}
        mealTimes={mealTimes}
        menus={menus}
        canEdit={canEdit}
      />
      {canEdit ? (
        <div className="mt-6">
          <MealTimes orgId={scope.org.id} mealTimes={mealTimes} />
        </div>
      ) : null}
    </>
  );
}
