import type { PluginPageProps } from '@devquake/plugin-sdk';
import { LOCALE_TAGS, Link, buttonClass, PartnerPromo } from '@devquake/ui';
import { localeOf, translator } from '../i18n';
import { householdScope } from '../components/guard';
import { WeekActions, WeekPlan, type ShoppingList } from '../components/week-plan';
import { cookbookLink } from '../lib/cookbook';
import { eatersOf, mealsBetween } from '../lib/data';
import { addDays, formatDayShort } from '../lib/dates';
import { householdServings, weekDays, weekStart } from '../lib/plan';

export async function generateMetadata({ ctx, params }: PluginPageProps) {
  const scope = await householdScope(ctx, params);
  const t = translator(localeOf(ctx));
  return { title: scope.ok ? t('meta.week', { name: scope.me.household.name }) : t('meta.home') };
}

/** A household's week: the plan, suggestions, the shopping list and links to the recipes. */
export default async function Week({ ctx, params, searchParams }: PluginPageProps) {
  const scope = await householdScope(ctx, params);
  if (!scope.ok) return scope.notice;
  const { db, me, today, locale } = scope;
  const h = me.household;
  const t = translator(locale, 'week');
  const tag = LOCALE_TAGS[locale];
  const sp = (await searchParams) ?? {};
  const monday = weekStart(Array.isArray(sp.week) ? sp.week[0] : sp.week, today);
  const days = weekDays(monday);
  const meals = await mealsBetween(db, h.id, days[0]!, days[6]!);
  const eaters = await eatersOf(db, h.id);
  const back = `/h/${h.id}?week=${monday}`;

  // The cookbook (recipes) and shopping (lists) apps, when connected (ADR 0035).
  const cookbook = await cookbookLink(ctx.links);
  const cookbookOn = cookbook?.state === 'connected';
  const recipeUrls: Record<string, string> = {};
  if (ctx.links && cookbookOn) {
    for (const m of meals) {
      m.items.forEach((item, i) => {
        if (!item.recipeRef) return;
        const url = ctx.links!.deepLink(
          'cookbook',
          'recipe',
          { id: item.recipeRef },
          { returnTo: back },
        );
        if (url) recipeUrls[`${m.id}:${i}`] = url;
      });
    }
  }
  // The family planner, where the week's meals can show (ADR 0035): a card until connected.
  const family = (await ctx.links?.list().catch(() => []))?.find((x) => x.app === 'family') ?? null;
  let lists: ShoppingList[] | null = null;
  let shoppingConnect: { url: string; label: 'connect' | 'getIt' } | null = null;
  if (ctx.links) {
    const shopping = (await ctx.links.list().catch(() => [])).find((a) => a.app === 'shopping');
    if (shopping?.state === 'connected') {
      const res = await ctx.links.call<{ lists?: ShoppingList[] }>('shopping', 'lists.overview', {
        limit: 10,
      });
      lists = res.ok ? (res.data.lists ?? []).map((l) => ({ id: l.id, name: l.name })) : [];
    } else if (shopping) {
      shoppingConnect =
        shopping.state === 'available'
          ? { url: shopping.connectUrl, label: 'connect' }
          : { url: shopping.openUrl, label: 'getIt' };
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/?all" className="text-sm text-ink/60 hover:text-quake dark:text-paper/60">
            {t('households')}
          </Link>
          <h1 className="font-display text-3xl font-bold">{h.name}</h1>
          <p className="text-sm text-ink/70 dark:text-paper/70">
            {t('weekOf', {
              from: formatDayShort(days[0]!, tag),
              to: formatDayShort(days[6]!, tag),
            })}{' '}
            · {t('eating', { count: eaters.length })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/h/${h.id}?week=${addDays(monday, -7)}`}
            className={buttonClass('secondary')}
          >
            {t('previous')}
          </Link>
          <Link href={`/h/${h.id}`} className={buttonClass('secondary')}>
            {t('thisWeek')}
          </Link>
          <Link href={`/h/${h.id}?week=${addDays(monday, 7)}`} className={buttonClass('secondary')}>
            {t('next')}
          </Link>
          <Link href="/meals" className={buttonClass('ghost')}>
            {t('savedMeals')}
          </Link>
          <Link href={`/h/${h.id}/household`} className={buttonClass('ghost')}>
            {t('household')}
          </Link>
        </div>
      </div>

      {!cookbookOn && cookbook ? (
        <p className="flex flex-wrap items-center gap-3 rounded-xl border border-quake/30 bg-quake/5 px-4 py-3 text-sm">
          <span className="flex-1">{t('connectCookbook')}</span>
          <a
            href={cookbook.state === 'available' ? cookbook.connectUrl : cookbook.openUrl}
            className={buttonClass('primary')}
          >
            {cookbook.state === 'available' ? t('connect') : t('getCookbook')}
          </a>
        </p>
      ) : null}

      {family ? <PartnerPromo partner={family} message={t('familyPromo')} /> : null}

      <WeekPlan
        householdId={h.id}
        days={days}
        today={today}
        meals={meals}
        recipeUrls={recipeUrls}
        defaultServings={householdServings(eaters.map((e) => e.portion))}
        cookbook={cookbookOn}
        targets={{ kcal: h.kcalTarget, protein: h.proteinTarget }}
      />

      <WeekActions
        householdId={h.id}
        monday={monday}
        isPlanner={me.isPlanner}
        cookbook={cookbookOn}
        lists={lists}
        shoppingConnect={shoppingConnect}
      />

      <p className="text-xs text-ink/50 dark:text-paper/50">{t('disclaimer')}</p>
    </div>
  );
}
