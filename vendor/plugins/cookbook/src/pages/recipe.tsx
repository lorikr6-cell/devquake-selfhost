import { notFound } from 'next/navigation';
import type { PluginPageProps } from '@devquake/plugin-sdk';
import { BackLink, Link, buttonClass, ZoomableImage } from '@devquake/ui';
import { localeOf, translator } from '../i18n';
import { pageScope } from '../components/guard';
import { PictureUpload } from '../components/picture-upload';
import {
  Comments,
  PlanCard,
  PublishControls,
  RecommendButton,
  type Household,
} from '../components/community';
import {
  CopyButton,
  DeleteRecipeButton,
  PublicLinkControls,
  ShareControls,
} from '../components/recipe-actions';
import { FavouriteButton, RecipeBody, type ShoppingList } from '../components/recipe-view';
import { checksOf } from '../lib/checks';
import {
  commentsOf,
  favouriteRefs,
  isRef,
  recipeByRef,
  recommendedBy,
  summaryOf,
} from '../lib/data';
import { todayIn } from '../lib/dates';
import { myFoodPhotos } from '../lib/food-photos';
import { thumbsOf } from '../lib/foods';
import { publishable } from '../lib/guide';
import { nutritionOf } from '../lib/recipe';

export async function generateMetadata({ ctx, params }: PluginPageProps) {
  const t = translator(localeOf(ctx));
  const ref = params.id ?? '';
  const r =
    ctx.user && isRef(ref) ? await recipeByRef(ctx.db, ref, ctx.user.id, localeOf(ctx)) : null;
  return { title: r ? t('meta.recipe', { title: r.title }) : t('meta.home') };
}

/** A recipe: servings and units, ingredients, nutrition, tags, steps, and what you can do with it. */
export default async function RecipePage({ ctx, params }: PluginPageProps) {
  const scope = await pageScope(ctx);
  if (!scope.ok) return scope.notice;
  const { db, user, locale } = scope;
  const ref = params.id ?? '';
  const r = isRef(ref) ? await recipeByRef(db, ref, user.id, locale) : null;
  if (!r) notFound();
  const t = translator(locale, 'recipe');
  const tDiff = translator(locale, 'difficulty');
  const summary = summaryOf(r);
  const isOwner = r.ownerId === user.id;
  const favourite = (await favouriteRefs(db, user.id)).includes(r.ref);
  const own = !r.library ? Number(r.ref) : null;
  const comments = own !== null && r.isPublic ? await commentsOf(db, own) : [];
  const recommended =
    own !== null && r.isPublic && !isOwner ? await recommendedBy(db, own, user.id) : false;
  const checks = isOwner ? checksOf(r) : [];
  const timeZone = ctx.timeZone || 'UTC';

  // The shopping app's lists (ADR 0035): only when the two apps are connected.
  let lists: ShoppingList[] | null = null;
  let connectUrl: string | null = null;
  if (ctx.links) {
    const shopping = (await ctx.links.list().catch(() => [])).find((a) => a.app === 'shopping');
    if (shopping?.state === 'connected') {
      const res = await ctx.links.call<{ lists?: ShoppingList[] }>('shopping', 'lists.overview', {
        limit: 10,
      });
      lists = res.ok ? (res.data.lists ?? []).map((l) => ({ id: l.id, name: l.name })) : [];
    } else if (shopping) {
      connectUrl = shopping.state === 'available' ? shopping.connectUrl : shopping.openUrl;
    }
  }

  // The meal planner's households (ADR 0035): "Plan this recipe", or a suggestion to connect.
  let households: Household[] | null = null;
  let mealsUrl: string | null = null;
  let mealsLabel: 'connect' | 'getIt' = 'connect';
  if (ctx.links) {
    const meals = (await ctx.links.list().catch(() => [])).find((a) => a.app === 'meals');
    if (meals?.state === 'connected') {
      const res = await ctx.links.call<{ households?: Household[] }>(
        'meals',
        'households.list',
        {},
      );
      households = res.ok ? (res.data.households ?? []) : [];
    } else if (meals) {
      mealsUrl = meals.state === 'available' ? meals.connectUrl : meals.openUrl;
      mealsLabel = meals.state === 'available' ? 'connect' : 'getIt';
    }
  }

  return (
    <article className="space-y-8">
      <div className="space-y-3">
        <BackLink href="/" className="text-sm text-ink/60 hover:text-quake dark:text-paper/60">
          {t('back')}
        </BackLink>
        <div className="flex flex-wrap items-start gap-4">
          {r.photo !== null ? (
            <ZoomableImage
              src={`/api/recipes/${r.ref}/photo?v=${r.photo}`}
              alt={r.title}
              className="w-full rounded-xl sm:w-64"
              imgClassName="h-40 w-full rounded-xl object-cover"
            />
          ) : (
            <span
              aria-hidden
              className="grid size-24 place-items-center rounded-xl bg-quake/10 text-5xl"
            >
              {r.icon}
            </span>
          )}
          <div className="min-w-0 flex-1 space-y-2">
            <h1 className="font-display text-3xl font-bold break-words">{r.title}</h1>
            <p className="text-sm text-ink/70 dark:text-paper/70">
              {[
                r.prepMin ? t('prep', { count: r.prepMin }) : null,
                r.cookMin ? t('cook', { count: r.cookMin }) : null,
                tDiff(r.difficulty),
                r.cuisine,
                r.library ? t('fromLibrary') : t('by', { name: r.ownerName ?? '' }),
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
            {r.intro ? <p className="whitespace-pre-wrap">{r.intro}</p> : null}
            <div className="flex flex-wrap gap-2">
              <Link href={`/r/${r.ref}/cook`} className={buttonClass('primary')}>
                {t('startCooking')}
              </Link>
              <FavouriteButton recipeRef={r.ref} initial={favourite} />
              {own !== null && r.isPublic ? (
                <RecommendButton
                  recipeId={own}
                  initial={recommended}
                  count={r.recommendations}
                  canRecommend={!isOwner}
                />
              ) : null}
              {isOwner ? (
                <Link href={`/r/${r.ref}/edit`} className={buttonClass('secondary')}>
                  {t('edit')}
                </Link>
              ) : (
                <CopyButton recipeRef={r.ref} />
              )}
            </div>
          </div>
        </div>
      </div>

      <RecipeBody
        recipeRef={r.ref}
        baseServings={r.servings}
        ingredients={r.ingredients}
        steps={r.steps}
        equipment={r.equipment}
        tags={summary.tags}
        allergens={summary.allergens}
        nutrition={nutritionOf(r.ingredients, r.servings)}
        thumbs={thumbsOf(r.ingredients, await myFoodPhotos(db, user.id))}
        lists={lists}
        connectUrl={connectUrl}
      />

      <PlanCard
        recipeRef={r.ref}
        households={households}
        connectUrl={mealsUrl}
        connectLabel={mealsLabel}
        today={todayIn(timeZone)}
        servings={r.servings}
      />

      {r.tips ? (
        <section className="rounded-lg border-l-4 border-quake bg-quake/5 px-4 py-3">
          <h2 className="text-sm font-semibold">{t('tips')}</h2>
          <p className="text-sm whitespace-pre-wrap">{r.tips}</p>
        </section>
      ) : null}

      <p className="text-xs text-ink/50 dark:text-paper/50">{t('disclaimer')}</p>

      {own !== null && r.isPublic ? (
        <Comments
          recipeId={own}
          comments={comments}
          meId={user.id}
          isOwner={isOwner}
          timeZone={timeZone}
        />
      ) : null}

      {isOwner ? (
        <section className="space-y-4 border-t border-ink/10 pt-6 dark:border-paper/10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">{t('photo')}</span>
            <PictureUpload
              path={`/recipes/${r.ref}/photo`}
              hasPicture={r.photo !== null}
              kind="photo"
              name={r.title}
            />
          </div>
          <PublishControls
            recipeId={Number(r.ref)}
            isPublic={r.isPublic}
            checks={checks}
            ready={publishable(checks)}
          />
          <ShareControls recipeId={Number(r.ref)} baseUrl={ctx.baseUrl} code={r.shareCode} />
          <PublicLinkControls
            recipeId={Number(r.ref)}
            baseUrl={ctx.baseUrl}
            code={r.publicCode}
            title={r.title}
            photo={r.photo}
          />
          <DeleteRecipeButton recipeId={Number(r.ref)} title={r.title} />
        </section>
      ) : null}
    </article>
  );
}
