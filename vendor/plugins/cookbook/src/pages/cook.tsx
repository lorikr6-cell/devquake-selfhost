import { notFound } from 'next/navigation';
import type { PluginPageProps } from '@devquake/plugin-sdk';
import { localeOf, translator } from '../i18n';
import { CookMode } from '../components/cook-mode';
import { pageScope } from '../components/guard';
import { isRef, recipeByRef } from '../lib/data';
import { LIMITS, scaledIngredient } from '../lib/recipe';

export function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('meta.cook') };
}

/** Cooking mode: one step per screen, timers and a voice. */
export default async function Cook({ ctx, params, searchParams }: PluginPageProps) {
  const scope = await pageScope(ctx);
  if (!scope.ok) return scope.notice;
  const ref = params.id ?? '';
  const r = isRef(ref) ? await recipeByRef(scope.db, ref, scope.user.id, scope.locale) : null;
  if (!r || r.steps.length === 0) notFound();
  const sp = (await searchParams) ?? {};
  const asked = Number(Array.isArray(sp.servings) ? sp.servings[0] : sp.servings);
  const servings =
    Number.isInteger(asked) && asked >= 1 && asked <= LIMITS.maxServings ? asked : r.servings;
  return (
    <CookMode
      recipeRef={r.ref}
      title={r.title}
      steps={r.steps}
      ingredients={r.ingredients.map((i) => scaledIngredient(i, r.servings, servings))}
      equipment={r.equipment}
      servings={servings}
    />
  );
}
