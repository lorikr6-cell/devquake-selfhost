import { Link, type Translate, thumbUrl } from '@devquake/ui';
import type { RecipeSummary } from '../lib/data';

/** A recipe in a list: photo or emoji, title, time, calories per portion and its tags. */
export function RecipeCard({
  recipe,
  t,
  tTags,
}: {
  recipe: RecipeSummary;
  /** useT('card') */
  t: Translate;
  tTags: Translate;
}) {
  return (
    <Link
      href={`/r/${recipe.ref}`}
      className="flex h-full gap-3 rounded-xl border border-ink/10 bg-white/70 p-3 hover:border-quake dark:border-paper/10 dark:bg-paper/5"
    >
      {recipe.photo !== null ? (
        // eslint-disable-next-line @next/next/no-img-element -- served by the app's own API
        <img
          src={thumbUrl(`/api/recipes/${recipe.ref}/photo?v=${recipe.photo}`)}
          loading="lazy"
          alt=""
          className="size-16 shrink-0 rounded-lg object-cover"
        />
      ) : (
        <span
          aria-hidden
          className="grid size-16 shrink-0 place-items-center rounded-lg bg-quake/10 text-3xl"
        >
          {recipe.icon}
        </span>
      )}
      <span className="min-w-0 space-y-1">
        <span className="block font-medium">{recipe.title}</span>
        <span className="block text-xs text-ink/60 dark:text-paper/60">
          {[
            recipe.minutes ? t('minutes', { count: recipe.minutes }) : null,
            recipe.kcal !== null ? t('kcal', { kcal: recipe.kcal }) : null,
            recipe.library ? t('library') : recipe.ownerName,
            recipe.isPublic ? `👍 ${recipe.recommendations}` : null,
          ]
            .filter(Boolean)
            .join(' · ')}
        </span>
        {recipe.tags.length ? (
          <span className="flex flex-wrap gap-1">
            {recipe.tags.slice(0, 4).map((x) => (
              <span
                key={x.tag}
                className="rounded-full bg-ink/5 px-2 py-0.5 text-[11px] dark:bg-paper/10"
              >
                {tTags(x.tag)}
              </span>
            ))}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
