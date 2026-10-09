'use client';

import { useEffect, useState } from 'react';
import { Button, LOCALE_TAGS, Link, buttonClass, cn, useLocale, useT } from '@devquake/ui';
import type { Allergen, FoodThumb, Nutrients } from '../lib/food-model';
import {
  LIMITS,
  formatQty,
  scaledIngredient,
  toImperial,
  type Ingredient,
  type Nutrition,
  type Step,
  type TagCheck,
} from '../lib/recipe';
import { FoodThumbImage } from './food-icon';
import { GetReady, StageSteps } from './recipe-guide';
import { callApi, errorMessage } from './call-api';
import { useFeedback } from './feedback';
import { Field, Select } from './ui';

export interface ShoppingList {
  id: number;
  name: string;
}

const UNITS_KEY = 'cookbook.units';

/** Servings, units, the scaled ingredients, nutrition per portion and "to a shopping list". */
export function RecipeBody({
  recipeRef,
  baseServings,
  ingredients,
  steps,
  equipment,
  tags,
  allergens,
  nutrition,
  thumbs,
  lists,
  connectUrl,
  cookLink = true,
}: {
  recipeRef: string;
  baseServings: number;
  ingredients: Ingredient[];
  steps: Step[];
  equipment: string | null;
  tags: TagCheck[];
  allergens: Allergen[];
  /** Per portion, worked out on the server (the food catalogue is there). */
  nutrition: Nutrition;
  /** The ingredients' thumbnails, by food id. */
  thumbs: Record<string, FoodThumb>;
  /** The member's shopping lists, or null when the apps are not connected. */
  lists: ShoppingList[] | null;
  connectUrl: string | null;
  /** false: no "Cook for …" button (a public link: cooking mode is for members). */
  cookLink?: boolean;
}) {
  const t = useT('recipe');
  const tUnit = useT('units');
  const tTag = useT('tags');
  const tWhy = useT('tagWhy');
  const tAll = useT('allergens');
  const tN = useT('nutrients');
  const tErr = useT('errors');
  const tag = LOCALE_TAGS[useLocale()];
  const { toast } = useFeedback();
  const [servings, setServings] = useState(baseServings);
  const [imperial, setImperial] = useState(false);
  useEffect(() => {
    try {
      setImperial(localStorage.getItem(UNITS_KEY) === 'imperial');
    } catch {
      // Private window: metric.
    }
  }, []);
  const [have, setHave] = useState<Set<number>>(new Set());
  const [listId, setListId] = useState(lists?.[0] ? String(lists[0].id) : '');
  const [busy, setBusy] = useState(false);

  const scaled = ingredients.map((i) => scaledIngredient(i, baseServings, servings));
  const p: Nutrients = nutrition.perPortion;

  function show(i: Ingredient): string {
    if (i.qty === null) return i.unit === 'taste' ? tUnit('taste') : '';
    const { qty, unit } = imperial ? toImperial(i.qty, i.unit) : { qty: i.qty, unit: i.unit };
    return `${formatQty(qty, tag)} ${tUnit(unit)}`;
  }

  function setUnits(next: boolean) {
    setImperial(next);
    try {
      localStorage.setItem(UNITS_KEY, next ? 'imperial' : 'metric');
    } catch {
      // A private window: the choice lasts for this page only.
    }
  }

  const fmt = (n: number, digits = 0) =>
    new Intl.NumberFormat(tag, { maximumFractionDigits: digits }).format(n);

  return (
    <div className="space-y-8">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-xl font-bold">{t('ingredients')}</h2>
            <div className="flex items-center gap-2" role="group" aria-label={t('servings')}>
              <Button
                type="button"
                variant="secondary"
                aria-label={t('fewer')}
                disabled={servings <= 1}
                onClick={() => setServings(servings - 1)}
              >
                −
              </Button>
              <span className="min-w-24 text-center text-sm font-medium" aria-live="polite">
                {t('servingsCount', { count: servings })}
              </span>
              <Button
                type="button"
                variant="secondary"
                aria-label={t('more')}
                disabled={servings >= LIMITS.maxServings}
                onClick={() => setServings(servings + 1)}
              >
                +
              </Button>
            </div>
          </div>
          <div className="flex gap-1 text-xs" role="group" aria-label={t('unitsLabel')}>
            {[false, true].map((imp) => (
              <button
                key={String(imp)}
                type="button"
                aria-pressed={imperial === imp}
                onClick={() => setUnits(imp)}
                className={cn(
                  'rounded-full border px-3 py-1',
                  imperial === imp
                    ? 'border-quake bg-quake/10'
                    : 'border-ink/15 dark:border-paper/15',
                )}
              >
                {imp ? t('imperial') : t('metric')}
              </button>
            ))}
          </div>
          <ul className="divide-y divide-ink/10 rounded-xl border border-ink/10 dark:divide-paper/10 dark:border-paper/10">
            {scaled.map((i, n) => (
              <li key={n} className="flex items-center gap-3 px-4 py-2 text-sm">
                <input
                  type="checkbox"
                  className="size-5 accent-quake"
                  aria-label={t('haveIt', { name: i.name })}
                  checked={have.has(n)}
                  onChange={(e) => {
                    const next = new Set(have);
                    if (e.target.checked) next.add(n);
                    else next.delete(n);
                    setHave(next);
                  }}
                />
                <span
                  className={cn(
                    'w-28 shrink-0 font-medium tabular-nums',
                    have.has(n) && 'opacity-50',
                  )}
                >
                  {show(i)}
                </span>
                {i.foodId && thumbs[i.foodId] ? (
                  <FoodThumbImage
                    thumb={thumbs[i.foodId]}
                    className={cn('size-8', have.has(n) && 'opacity-50')}
                  />
                ) : (
                  <span className="size-8 shrink-0" aria-hidden />
                )}
                <span className={cn('min-w-0', have.has(n) && 'line-through opacity-50')}>
                  {i.name}
                  {i.note ? (
                    <span className="text-ink/60 dark:text-paper/60">, {i.note}</span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-ink/60 dark:text-paper/60">{t('haveHint')}</p>

          {lists ? (
            lists.length ? (
              <div className="flex flex-wrap items-end gap-2">
                <Field label={t('toList')}>
                  <Select value={listId} onChange={(e) => setListId(e.target.value)}>
                    {lists.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Button
                  type="button"
                  disabled={busy || !listId}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      const res = await callApi<{ added: number }>('/shopping', 'POST', {
                        ref: recipeRef,
                        servings,
                        listId: Number(listId),
                        skip: [...have],
                      });
                      const list = lists.find((l) => String(l.id) === listId);
                      toast(t('addedToList', { count: res?.added ?? 0, list: list?.name ?? '' }));
                    } catch (err) {
                      toast(errorMessage(err, tErr), 'error');
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  {t('addToList', { count: servings })}
                </Button>
              </div>
            ) : (
              <p className="text-sm text-ink/60 dark:text-paper/60">{t('noLists')}</p>
            )
          ) : connectUrl ? (
            <p className="text-sm">
              <a href={connectUrl} className={buttonClass('secondary')}>
                {t('connectShopping')}
              </a>
            </p>
          ) : null}
        </section>

        <aside className="space-y-5">
          <div className="rounded-xl border border-ink/10 p-4 dark:border-paper/10">
            <h2 className="mb-2 text-sm font-semibold">{t('perPortion')}</h2>
            {nutrition.counted === 0 ? (
              <p className="text-sm text-ink/60 dark:text-paper/60">{t('noNutrition')}</p>
            ) : (
              <>
                <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
                  <dt>{tN('kcal')}</dt>
                  <dd className="text-right font-medium tabular-nums">{fmt(p.kcal)} kcal</dd>
                  {(['protein', 'carbs', 'fat', 'fibre', 'salt'] as const).map((k) => (
                    <div key={k} className="contents">
                      <dt>{tN(k)}</dt>
                      <dd className="text-right tabular-nums">{fmt(p[k], 1)} g</dd>
                    </div>
                  ))}
                </dl>
                {nutrition.counted < nutrition.total ? (
                  <p className="mt-2 text-xs text-ink/60 dark:text-paper/60">
                    {t('partial', { counted: nutrition.counted, total: nutrition.total })}
                  </p>
                ) : null}
                <p className="mt-2 text-xs text-ink/50 dark:text-paper/50">
                  {t('nutritionSource')}
                </p>
              </>
            )}
          </div>
          {tags.length ? (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold">{t('fits')}</h2>
              <ul className="space-y-1 text-sm">
                {tags.map((x) => (
                  <li key={x.tag}>
                    <span className="rounded-full bg-quake/10 px-2 py-0.5 text-xs font-medium">
                      {tTag(x.tag)}
                    </span>{' '}
                    {x.why ? (
                      <span className="text-xs text-ink/60 dark:text-paper/60">
                        {tWhy(x.why.key, x.why.values)}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="space-y-1">
            <h2 className="text-sm font-semibold">{t('allergens')}</h2>
            <p className="text-sm">
              {allergens.length ? allergens.map((a) => tAll(a)).join(', ') : t('noAllergens')}
            </p>
            <p className="text-xs text-ink/50 dark:text-paper/50">{t('allergenHint')}</p>
          </div>
        </aside>
      </div>
      <GetReady equipment={equipment} ingredients={scaled} show={show} />
      <StageSteps steps={steps} ingredients={scaled} show={show} />
      {cookLink ? (
        <p>
          <Link
            href={`/r/${recipeRef}/cook?servings=${servings}`}
            className={buttonClass('primary')}
          >
            {t('cookFor', { count: servings })}
          </Link>
        </p>
      ) : null}
    </div>
  );
}

/** The heart: add or remove a favourite. */
export function FavouriteButton({ recipeRef, initial }: { recipeRef: string; initial: boolean }) {
  const t = useT('recipe');
  const tErr = useT('errors');
  const { toast } = useFeedback();
  const [on, setOn] = useState(initial);
  return (
    <Button
      type="button"
      variant="secondary"
      aria-pressed={on}
      onClick={async () => {
        const next = !on;
        setOn(next);
        try {
          await callApi('/favourites', 'POST', { ref: recipeRef, on: next });
          toast(next ? t('favourited') : t('unfavourited'));
        } catch (err) {
          setOn(!next);
          toast(errorMessage(err, tErr), 'error');
        }
      }}
    >
      {on ? '♥ ' : '♡ '}
      {on ? t('favourite') : t('addFavourite')}
    </Button>
  );
}
