import type { PluginPageProps } from '@devquake/plugin-sdk';
import { Link, buttonClass, cn } from '@devquake/ui';
import { localeOf, translator } from '../i18n';
import { pageScope } from '../components/guard';
import { RecipeCard } from '../components/recipe-card';
import { Input, Select } from '../components/ui';
import {
  allVisible,
  communityRecipes,
  favouriteRefs,
  libraryViews,
  ownRecipes,
  summaryOf,
  type RecipeView,
} from '../lib/data';
import { TAGS, isTag } from '../lib/recipe';

export function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('meta.home') };
}

const TABS = ['library', 'community', 'mine', 'shared', 'favourites'] as const;
type Tab = (typeof TABS)[number];

const fold = (s: string) => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Browsing: the library, own, shared and favourite recipes; search, diet and time filters. */
export default async function Home({ ctx, searchParams }: PluginPageProps) {
  const scope = await pageScope(ctx);
  if (!scope.ok) return scope.notice;
  const { db, user, locale } = scope;
  const t = translator(locale, 'home');
  const sp = (await searchParams) ?? {};
  const one = (v: unknown) => (Array.isArray(v) ? v[0] : v) as string | undefined;
  const tab: Tab = TABS.includes(one(sp.tab) as Tab) ? (one(sp.tab) as Tab) : 'library';
  const q = (one(sp.q) ?? '').slice(0, 60);
  const tag = isTag(one(sp.tag)) ? one(sp.tag)! : '';
  const max = Number(one(sp.max)) || 0;

  let recipes: RecipeView[];
  if (tab === 'mine') recipes = await ownRecipes(db, user.id, 'mine');
  else if (tab === 'shared') recipes = await ownRecipes(db, user.id, 'shared');
  else if (tab === 'community') recipes = await communityRecipes(db);
  else if (tab === 'favourites') {
    const refs = await favouriteRefs(db, user.id);
    const all = await allVisible(db, user.id, locale);
    recipes = refs.flatMap((r) => all.filter((x) => x.ref === r));
  } else recipes = libraryViews(locale);

  const summaries = recipes
    .map(summaryOf)
    .filter(
      (s) =>
        (!q || fold(s.title).includes(fold(q))) &&
        (!tag || s.tags.some((x) => x.tag === tag)) &&
        (!max || s.minutes <= max),
    );
  const tCard = translator(locale, 'card');
  const tTags = translator(locale, 'tags');
  const href = (next: Tab) => `/?tab=${next}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">{t('title')}</h1>
          <p className="mt-1 text-sm text-ink/70 dark:text-paper/70">{t('intro')}</p>
        </div>
        <span className="flex flex-wrap gap-2">
          {user.isAdmin ? (
            <Link href="/admin/foods" className={buttonClass('ghost')}>
              {translator(locale, 'foodAdmin')('openLink')}
            </Link>
          ) : null}
          <Link href="/comments" className={buttonClass('secondary')}>
            {t('comments')}
          </Link>
          <Link href="/new" className={buttonClass('primary')}>
            {t('new')}
          </Link>
        </span>
      </div>

      <nav
        aria-label={t('tabsLabel')}
        className="flex gap-1 overflow-x-auto border-b border-ink/10 text-sm dark:border-paper/10"
      >
        {TABS.map((x) => (
          <Link
            key={x}
            href={href(x)}
            aria-current={x === tab ? 'page' : undefined}
            className={cn(
              '-mb-px shrink-0 border-b-2 px-3 py-2.5 font-medium whitespace-nowrap',
              x === tab
                ? 'border-quake text-ink dark:text-paper'
                : 'border-transparent text-ink/60 hover:text-ink dark:text-paper/60 dark:hover:text-paper',
            )}
          >
            {t(`tabs.${x}`)}
          </Link>
        ))}
      </nav>

      <form method="get" className="grid gap-2 sm:grid-cols-[1fr_12rem_10rem_auto] sm:items-end">
        <input type="hidden" name="tab" value={tab} />
        <Input name="q" defaultValue={q} placeholder={t('search')} aria-label={t('search')} />
        <Select name="tag" defaultValue={tag} aria-label={t('diet')}>
          <option value="">{t('anyDiet')}</option>
          {TAGS.map((x) => (
            <option key={x} value={x}>
              {tTags(x)}
            </option>
          ))}
        </Select>
        <Select name="max" defaultValue={max ? String(max) : ''} aria-label={t('time')}>
          <option value="">{t('anyTime')}</option>
          {[15, 30, 45, 60].map((m) => (
            <option key={m} value={m}>
              {t('upTo', { count: m })}
            </option>
          ))}
        </Select>
        <button type="submit" className={buttonClass('secondary')}>
          {t('filter')}
        </button>
      </form>

      {summaries.length === 0 ? (
        <p className="text-sm text-ink/60 dark:text-paper/60">{t(`empty.${tab}`)}</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {summaries.map((s) => (
            <li key={s.ref}>
              <RecipeCard recipe={s} t={tCard} tTags={tTags} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
