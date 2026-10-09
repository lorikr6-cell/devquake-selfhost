import type { PluginLinkHandlerModule } from '@devquake/plugin-sdk';
import { isLocale } from '@devquake/ui';
import { loadFoods } from '../lib/food-store';
import { allVisible, summaryOf } from '../lib/data';
import { isAllergen } from '../lib/foods';
import { isTag } from '../lib/recipe';

const fold = (s: string) =>
  s
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

/**
 * Link point "recipes.search" (read, ADR 0035): recipes the member can use (the library, their
 * own and shared ones), for the meal planner. Input { query?, tags? (all must fit), without?
 * (allergens to avoid), maxMinutes?, limit? (default 20, at most 100) }. Reply { recipes: [{ ref,
 * title, servings, minutes, kcal, protein, tags, allergens, visibility }] } with nutrition per
 * portion. Public recipes of other members are included.
 */
const handler: PluginLinkHandlerModule['default'] = async (input, ctx) => {
  const raw = (input ?? {}) as Record<string, unknown>;
  const locale = isLocale(ctx.locale) ? ctx.locale : 'en';
  const query = typeof raw.query === 'string' ? fold(raw.query.trim()).slice(0, 60) : '';
  const tags = Array.isArray(raw.tags) ? raw.tags.filter(isTag) : [];
  const without = Array.isArray(raw.without) ? raw.without.filter(isAllergen) : [];
  const maxMinutes = Number.isInteger(raw.maxMinutes) ? Number(raw.maxMinutes) : null;
  const limit = Math.min(100, Math.max(1, Number.isInteger(raw.limit) ? Number(raw.limit) : 20));
  const { nutritionOf } = await import('../lib/recipe');
  await loadFoods(ctx.db);
  const recipes = (await allVisible(ctx.db, ctx.user.id, locale))
    .map((r) => ({ r, s: summaryOf(r) }))
    .filter(({ r, s }) => {
      if (query && !fold(r.title).includes(query)) return false;
      if (maxMinutes !== null && s.minutes > maxMinutes) return false;
      if (tags.some((t) => !s.tags.some((x) => x.tag === t))) return false;
      return !without.some((a) => s.allergens.includes(a));
    })
    .slice(0, limit)
    .map(({ r, s }) => ({
      ref: s.ref,
      title: s.title,
      servings: s.servings,
      minutes: s.minutes,
      kcal: s.kcal,
      protein: Math.round(nutritionOf(r.ingredients, r.servings).perPortion.protein),
      tags: s.tags.map((x) => x.tag),
      allergens: s.allergens,
      visibility: r.library
        ? 'library'
        : r.isPublic
          ? 'public'
          : r.shareCode
            ? 'shared'
            : 'private',
    }));
  return { ok: true, data: { recipes } };
};

export default handler;
