import type { PluginPageProps } from '@devquake/plugin-sdk';
import { PrintHeader } from '../components/print-header';
import { LOCALE_TAGS, Link, buttonClass } from '@devquake/ui';
import { orgScope } from '../components/guard';
import { PrintButton } from '../components/meals';
import { OrgNav } from '../components/org-nav';
import { Panel } from '../components/ui';
import { localeOf, translator } from '../i18n';
import { addDays, isIsoDate } from '../lib/dates';
import { DELIVERY_MEAL, countByDiet, dishLines, formatTime, portionsFor } from '../lib/meals';
import { dishFor, linesToCook, scaledDish } from '../lib/dishes';
import { listDishes } from '../lib/dishes-data';
import { dayMenus, eatersOf, listMealTimes } from '../lib/meals-data';
import { DIETS } from '../lib/model';

export async function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('orgNav.kitchen') };
}

/**
 * The kitchen sheet of a day: per meal, the dishes and each diet's variant, the portions per
 * diet, the allergies, and a label per box (first name and initial, never an address).
 */
export default async function KitchenPage({ ctx, params, searchParams }: PluginPageProps) {
  const scope = await orgScope(ctx, params, 'kitchen.view');
  if (!scope.ok) return scope.notice;
  const t = translator(scope.locale);
  const asked = (await searchParams).day;
  const day = typeof asked === 'string' && isIsoDate(asked) ? asked : scope.today;
  const [mealTimes, menus, eaters, dishes] = await Promise.all([
    listMealTimes(scope.db, scope.org.id, scope.user.id),
    dayMenus(scope.db, scope.org.id, scope.user.id, day),
    eatersOf(scope.db, scope.org.id, scope.user.id),
    listDishes(scope.db, scope.org.id, scope.user.id),
  ]);
  const meals = [
    { id: DELIVERY_MEAL, name: t('meals.delivered') },
    ...mealTimes.map((m) => ({
      id: m.id,
      name: `${m.name} ${formatTime(m.startsMin)}–${formatTime(m.endsMin)}`,
    })),
  ];
  const tag = LOCALE_TAGS[scope.locale];
  const title = new Date(`${day}T12:00:00Z`).toLocaleDateString(tag, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
  const base = `/orgs/${scope.org.id}/kitchen`;

  return (
    <>
      <PrintHeader scope={scope} />
      <OrgNav
        orgId={scope.org.id}
        demo={scope.org.demo ? scope.staff.role : undefined}
        orgName={scope.org.name}
        current="kitchen"
        can={scope.can}
        t={t}
      />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold capitalize">{title}</h1>
        <div className="flex flex-wrap gap-2 print:hidden">
          <Link href={`${base}?day=${addDays(day, -1)}`} className={buttonClass('ghost')}>
            ← {t('kitchen.previous')}
          </Link>
          <Link href={base} className={buttonClass('ghost')}>
            {t('kitchen.today')}
          </Link>
          <Link href={`${base}?day=${addDays(day, 1)}`} className={buttonClass('ghost')}>
            {t('kitchen.next')} →
          </Link>
          <PrintButton />
        </div>
      </div>

      <div className="space-y-6">
        {meals.map((meal) => {
          const portions = portionsFor(eaters, day, meal.id);
          if (portions.length === 0) return null;
          const menu = menus.find((m) => m.meal === meal.id);
          const counts = countByDiet(portions);
          const allergies = portions.filter((p) => p.allergies);
          // Dishes from Cookbook: their ingredients for the portions that eat them.
          const toCook = menu
            ? linesToCook({
                dishes: menu.dishes,
                variants: menu.variants,
                portions: counts,
              }).flatMap(({ line, portions: n }) => {
                const dish = dishFor(line, dishes);
                return dish ? [{ dish, portions: n }] : [];
              })
            : [];
          return (
            <Panel key={meal.id} className="break-inside-avoid">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-lg font-semibold">{meal.name}</h2>
                <span className="text-sm font-medium">
                  {t('kitchen.portions', { count: portions.length })}
                </span>
              </div>
              <div className="mt-3 grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="mb-1 text-sm font-semibold">{t('kitchen.menu')}</h3>
                  {menu ? (
                    <ul className="list-disc pl-5 text-sm">
                      {dishLines(menu.dishes).map((line, i) => (
                        <li key={i}>{line}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-amber-800 dark:text-amber-300">
                      {t('kitchen.noMenu')}
                    </p>
                  )}
                </div>
                <div>
                  <h3 className="mb-1 text-sm font-semibold">{t('kitchen.perDiet')}</h3>
                  <ul className="space-y-2 text-sm">
                    {DIETS.filter((d) => counts[d]).map((diet) => (
                      <li key={diet}>
                        <span className="font-medium">
                          {t(`diets.${diet}`)}: {counts[diet]}
                        </span>
                        {diet !== 'normal' && menu?.variants[diet] ? (
                          <span className="block text-xs text-ink/70 dark:text-paper/70">
                            {dishLines(menu.variants[diet]!).join(' · ')}
                          </span>
                        ) : diet !== 'normal' && menu ? (
                          <span className="block text-xs text-ink/60 dark:text-paper/60">
                            {t('kitchen.sameMenu')}
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              {toCook.length ? (
                <div className="mt-4">
                  <h3 className="mb-1 text-sm font-semibold">{t('kitchenApps.ingredients')}</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {toCook.map(({ dish, portions: n }) => (
                      <div key={dish.id} className="break-inside-avoid text-sm">
                        <p className="font-medium">
                          {dish.title}{' '}
                          <span className="font-normal text-ink/60 dark:text-paper/60">
                            · {t('kitchen.portions', { count: n })}
                          </span>
                        </p>
                        <ul className="mt-0.5">
                          {scaledDish(dish, n).map((i, k) => (
                            <li key={k} className="flex justify-between gap-3">
                              <span>{i.name}</span>
                              <span className="tabular-nums">
                                {i.qty === null ? '—' : `${i.qty} ${i.unit ?? ''}`}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              {allergies.length ? (
                <div className="mt-4 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-950 dark:border-red-800 dark:bg-red-950 dark:text-red-100">
                  <h3 className="mb-1 font-semibold">{t('kitchen.allergies')}</h3>
                  <ul>
                    {allergies.map((p, i) => (
                      <li key={i}>
                        {p.label}: {p.allergies}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <h3 className="mt-4 mb-2 text-sm font-semibold">{t('kitchen.labels')}</h3>
              <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {portions.map((p, i) => (
                  <li
                    key={i}
                    className="rounded-md border border-dashed border-ink/30 p-2 text-xs dark:border-paper/30"
                  >
                    <span className="block text-sm font-semibold">{p.label}</span>
                    {t(`diets.${p.diet}`)}
                    {p.allergies ? (
                      <span className="block font-medium text-red-700 dark:text-red-400">
                        ⚠ {p.allergies}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </Panel>
          );
        })}
        {meals.every((m) => portionsFor(eaters, day, m.id).length === 0) ? (
          <p className="text-sm text-ink/70 dark:text-paper/70">{t('kitchen.nobody')}</p>
        ) : null}
      </div>
    </>
  );
}
