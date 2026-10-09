import { notFound } from 'next/navigation';
import type { PluginPageProps } from '@devquake/plugin-sdk';
import { Link } from '@devquake/ui';
import { localeOf, translator } from '../i18n';
import { pageScope } from '../components/guard';
import { RecipeEditor } from '../components/recipe-editor';
import { recipeByRef } from '../lib/data';
import { myFoodPhotos } from '../lib/food-photos';
import { foodById, thumbsOf } from '../lib/foods';

export function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('meta.edit') };
}

/** Changing an own recipe (owner only; others get a 404). */
export default async function EditRecipe({ ctx, params }: PluginPageProps) {
  const scope = await pageScope(ctx);
  if (!scope.ok) return scope.notice;
  const { db, user, locale } = scope;
  const ref = params.id ?? '';
  const r = /^[1-9]\d{0,9}$/.test(ref) ? await recipeByRef(db, ref, user.id, locale) : null;
  if (!r || r.ownerId !== user.id) notFound();
  const t = translator(locale, 'editor');
  const thumbs = thumbsOf(r.ingredients, await myFoodPhotos(db, user.id));
  return (
    <div className="space-y-6">
      <Link
        href={`/r/${r.ref}`}
        className="text-sm text-ink/60 hover:text-quake dark:text-paper/60"
      >
        {t('backTo', { title: r.title })}
      </Link>
      <h1 className="font-display text-3xl font-bold">{t('editTitle')}</h1>
      <RecipeEditor
        recipeId={Number(r.ref)}
        isPublic={r.isPublic}
        initial={{
          title: r.title,
          intro: r.intro ?? '',
          tips: r.tips ?? '',
          servings: String(r.servings),
          prepMin: r.prepMin ? String(r.prepMin) : '',
          cookMin: r.cookMin ? String(r.cookMin) : '',
          difficulty: r.difficulty,
          cuisine: r.cuisine ?? '',
          equipment: r.equipment ?? '',
          tags: r.declaredTags,
          allergens: r.declaredAllergens,
          ingredients: r.ingredients.map((i) => ({
            name: i.name,
            qty: i.qty === null ? '' : String(i.qty),
            unit: i.unit,
            foodId: i.foodId,
            foodName: foodById(i.foodId)?.name[locale] ?? null,
            foodThumb: thumbs[i.foodId ?? ''] ?? null,
            scaling: i.scaling,
            note: i.note ?? '',
          })),
          steps: r.steps.map((s) => ({
            text: s.text,
            stage: s.stage,
            uses: s.uses,
            timerMin: s.timerSec ? String(Math.round((s.timerSec / 60) * 10) / 10) : '',
          })),
        }}
      />
    </div>
  );
}
