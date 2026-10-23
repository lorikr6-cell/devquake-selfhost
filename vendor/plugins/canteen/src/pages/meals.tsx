import type { PluginPageProps } from '@devquake/plugin-sdk';
import { PrintHeader } from '../components/print-header';
import { LOCALE_TAGS, Link, buttonClass } from '@devquake/ui';
import { orgScope } from '../components/guard';
import { Dishes, ShoppingWeek, type AppLink } from '../components/kitchen-apps';
import { CopyLastWeek, MealTimes, PrintButton, WeekMenus } from '../components/meals';
import { OrgNav } from '../components/org-nav';
import { localeOf, translator } from '../i18n';
import { addDays, isIsoDate, mondayOf } from '../lib/dates';
import { listDishes } from '../lib/dishes-data';
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
  const [mealTimes, menus, dishes, linked] = await Promise.all([
    listMealTimes(scope.db, scope.org.id, scope.user.id),
    weekMenus(scope.db, scope.org.id, scope.user.id, monday),
    listDishes(scope.db, scope.org.id, scope.user.id),
    // Cookbook and Shopping, when the visitor has them (ADR 0035); the page works without.
    ctx.links ? ctx.links.list().catch(() => []) : Promise.resolve([]),
  ]);
  const linkOf = (app: string): AppLink | null => {
    const l = linked.find((a) => a.app === app);
    return l ? { state: l.state, connectUrl: l.connectUrl } : null;
  };
  const canEdit = scope.can('meals.edit');
  const tag = LOCALE_TAGS[scope.locale];
  const range = `${new Date(`${monday}T12:00:00Z`).toLocaleDateString(tag, { day: 'numeric', month: 'long', timeZone: 'UTC' })} – ${new Date(`${days[6]}T12:00:00Z`).toLocaleDateString(tag, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })}`;
  const base = `/orgs/${scope.org.id}/meals`;

  return (
    <>
      <PrintHeader scope={scope} />
      <OrgNav
        orgId={scope.org.id}
        demo={scope.org.demo ? scope.staff.role : undefined}
        orgName={scope.org.name}
        current="meals"
        can={scope.can}
        t={t}
      />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold">{range}</h1>
        <div className="flex flex-wrap gap-2 print:hidden">
          <Link href={`${base}?week=${addDays(monday, -7)}`} className={buttonClass('ghost')}>
            ← {t('meals.previous')}
          </Link>
          <Link href={base} className={buttonClass('ghost')}>
            {t('meals.thisWeek')}
          </Link>
          <Link href={`${base}?week=${addDays(monday, 7)}`} className={buttonClass('ghost')}>
            {t('meals.next')} →
          </Link>
          <PrintButton />
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
        dishes={dishes.map((d) => d.title)}
      />
      {canEdit ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-2 print:hidden">
          <Dishes
            orgId={scope.org.id}
            cookbook={linkOf('cookbook')}
            dishes={dishes.map((d) => ({
              id: d.id,
              title: d.title,
              allergens: d.allergens,
              ingredients: d.ingredients.length,
            }))}
          />
          <ShoppingWeek orgId={scope.org.id} week={monday} shopping={linkOf('shopping')} />
        </div>
      ) : null}
      {canEdit ? (
        <div className="mt-6 print:hidden">
          <MealTimes orgId={scope.org.id} mealTimes={mealTimes} />
        </div>
      ) : null}
    </>
  );
}
