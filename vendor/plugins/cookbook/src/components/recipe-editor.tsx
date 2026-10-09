'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, cn, photoUpload, trackEvent, useT } from '@devquake/ui';
import { ALLERGENS, type FoodThumb } from '../lib/food-model';
import { EQUIPMENT, mentions, publishable, recipeChecks, suggestedTimerMin } from '../lib/guide';
import { DIFFICULTIES, SCALINGS, STAGES, TAGS, UNITS, type Stage } from '../lib/recipe';
import { parseQty } from '../lib/validate';
import { callApi, errorMessage } from './call-api';
import { Checklist } from './community';
import { useFeedback } from './feedback';
import { FoodThumbImage } from './food-icon';
import { ErrorText, Field, Input, Select, TextArea } from './ui';
import { useAppRouter } from './use-app-router';

export interface IngredientDraft {
  name: string;
  qty: string;
  unit: string;
  foodId: string | null;
  /** Shown name of the linked food. */
  foodName: string | null;
  /** The linked food's thumbnail for this member (their picture, the chosen one or the drawing). */
  foodThumb?: FoodThumb | null;
  /** '' = automatic from the unit and food. */
  scaling: string;
  /** How to prepare it ("finely chopped"): shown under "Get ready". */
  note: string;
}

export interface StepDraft {
  text: string;
  timerMin: string;
  stage: Stage;
  /** Ingredient rows the step uses; null = follow what the text mentions. */
  uses: number[] | null;
}

export interface RecipeDraft {
  title: string;
  intro: string;
  tips: string;
  servings: string;
  prepMin: string;
  cookMin: string;
  difficulty: string;
  cuisine: string;
  equipment: string;
  tags: string[];
  allergens: string[];
  ingredients: IngredientDraft[];
  steps: StepDraft[];
  /** Make it public when saving (new recipes and private ones). */
  makePublic?: boolean;
}

export const emptyIngredient = (): IngredientDraft => ({
  name: '',
  qty: '',
  unit: 'g',
  foodId: null,
  foodName: null,
  scaling: '',
  note: '',
});
const emptyStep = (stage: Stage = 'cook'): StepDraft => ({
  text: '',
  timerMin: '',
  stage,
  uses: null,
});

export const emptyRecipe = (): RecipeDraft => ({
  title: '',
  intro: '',
  tips: '',
  servings: '4',
  prepMin: '',
  cookMin: '',
  difficulty: 'easy',
  cuisine: '',
  equipment: '',
  tags: [],
  allergens: [],
  ingredients: [emptyIngredient(), emptyIngredient(), emptyIngredient()],
  steps: [emptyStep('prepare'), emptyStep('cook'), emptyStep('serve')],
});

const WIZARD = ['basics', 'ingredients', 'steps', 'check'] as const;
type WizardStep = (typeof WIZARD)[number];

/** A food offered for an ingredient (GET /api/foods), with its thumbnail. */
interface FoodOption {
  id: string;
  name: string;
  thumb?: FoodThumb;
}

/** The linked food as the picker shows it. */
interface LinkedFood {
  id: string | null;
  name: string | null;
  thumb?: FoodThumb | null;
}

/**
 * The member's own picture of an ingredient (camera or library): only they see it until the
 * DevQuake team chooses one for everyone. Changes the thumbnail right away.
 */
function IngredientPicture({
  foodId,
  thumb,
  onChange,
}: {
  foodId: string;
  thumb: FoodThumb | null | undefined;
  onChange: (thumb: FoodThumb | null) => void;
}) {
  const t = useT('editor');
  const tErr = useT('errors');
  const { toast } = useFeedback();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const mine = thumb?.mine === true;

  async function upload(file: File) {
    setBusy(true);
    try {
      const body = await photoUpload(file, 800).catch(() => {
        throw new Error(tErr('photoPrepare'));
      });
      const res = await fetch(`/api/foods/${foodId}/my-photo`, { method: 'PUT', body });
      const data = (await res.json().catch(() => null)) as {
        thumb?: FoodThumb;
        error?: string;
      } | null;
      if (!res.ok) throw new Error(data?.error ?? tErr('photoSave', { status: res.status }));
      trackEvent('ingredient_picture_set');
      onChange(data?.thumb ?? null);
      toast(t('myPictureSaved'));
    } catch (err) {
      toast(err instanceof Error ? err.message : tErr('genericShort'), 'error');
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  }

  async function remove() {
    setBusy(true);
    try {
      const res = await callApi<{ thumb: FoodThumb | null }>(`/foods/${foodId}/my-photo`, 'DELETE');
      onChange(res?.thumb ?? null);
      toast(t('myPictureRemoved'));
    } catch (err) {
      toast(errorMessage(err, tErr), 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
        }}
      />
      <button
        type="button"
        className="underline"
        disabled={busy}
        title={t('myPictureHint')}
        onClick={() => input.current?.click()}
      >
        {busy ? t('myPictureUploading') : mine ? t('myPictureChange') : t('myPictureAdd')}
      </button>
      {mine ? (
        <button type="button" className="underline" disabled={busy} onClick={remove}>
          {t('myPictureRemove')}
        </button>
      ) : null}
    </>
  );
}

/**
 * Links an ingredient to a food of the nutrition table: a one-tap suggestion from its name, or a
 * search.
 */
function FoodPicker({
  value,
  onChange,
  suggestFrom,
}: {
  value: LinkedFood;
  onChange: (food: LinkedFood) => void;
  suggestFrom: string;
}) {
  const t = useT('editor');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [foods, setFoods] = useState<FoodOption[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const q = (open ? query || suggestFrom : suggestFrom).trim();

  useEffect(() => {
    if (value.id && !open) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      if (q.length < 3) return setFoods([]);
      const res = await callApi<{ foods: FoodOption[] }>(`/foods?q=${encodeURIComponent(q)}`).catch(
        () => null,
      );
      setFoods(res?.foods ?? []);
    }, 300);
  }, [q, open, value.id]);

  if (value.id && !open) {
    return (
      <span className="flex flex-wrap items-center gap-1 text-xs">
        <FoodThumbImage thumb={value.thumb} className="size-7" />
        <span className="rounded-full bg-emerald-600/10 px-2 py-0.5 text-emerald-800 dark:text-emerald-300">
          {t('linkedTo', { food: value.name ?? value.id })}
        </span>
        <IngredientPicture
          foodId={value.id}
          thumb={value.thumb}
          onChange={(thumb) => onChange({ ...value, thumb })}
        />
        <button type="button" className="underline" onClick={() => setOpen(true)}>
          {t('change')}
        </button>
        <button
          type="button"
          className="underline"
          onClick={() => onChange({ id: null, name: null, thumb: null })}
        >
          {t('unlink')}
        </button>
      </span>
    );
  }
  if (!open) {
    const first = foods[0];
    return (
      <span className="flex flex-wrap items-center gap-1 text-xs">
        {first ? (
          <button
            type="button"
            className="rounded-full border border-emerald-600/40 px-2 py-0.5 text-emerald-800 hover:bg-emerald-600/10 dark:text-emerald-300"
            onClick={() => onChange(first)}
          >
            <FoodThumbImage thumb={first.thumb} className="-my-1 mr-1 inline size-4" />
            {t('suggestLink', { food: first.name })}
          </button>
        ) : null}
        <button type="button" className="underline" onClick={() => setOpen(true)}>
          {first ? t('otherFood') : t('linkFood')}
        </button>
      </span>
    );
  }
  return (
    <div className="space-y-1 text-xs">
      <Input
        aria-label={t('searchFood')}
        placeholder={suggestFrom || t('searchFood')}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="text-xs"
      />
      <div className="flex flex-wrap gap-1">
        {foods.map((f) => (
          <button
            key={f.id}
            type="button"
            className="inline-flex items-center gap-1 rounded-full border border-ink/15 px-2 py-0.5 hover:border-quake dark:border-paper/15"
            onClick={() => {
              onChange(f);
              setOpen(false);
              setQuery('');
            }}
          >
            <FoodThumbImage thumb={f.thumb} className="size-4" />
            {f.name}
          </button>
        ))}
        {foods.length === 0 ? (
          <span className="text-ink/60 dark:text-paper/60">{t('noFood')}</span>
        ) : null}
        <button type="button" className="underline" onClick={() => setOpen(false)}>
          {t('done')}
        </button>
      </div>
    </div>
  );
}

/**
 * Writing or changing an own recipe, in four guided steps: the basics, the ingredients (with how
 * to prepare each, linked to the nutrition table), the steps (stage, the ingredients each uses,
 * timers the text mentions) and a check of everything someone else needs to cook it.
 */
export function RecipeEditor({
  recipeId,
  initial,
  isPublic = false,
}: {
  recipeId?: number;
  initial: RecipeDraft;
  isPublic?: boolean;
}) {
  const t = useT('editor');
  const tUnit = useT('units');
  const tScale = useT('scalings');
  const tTag = useT('tags');
  const tAll = useT('allergens');
  const tDiff = useT('difficulty');
  const tStage = useT('guide');
  const tEq = useT('equipmentNames');
  const tErr = useT('errors');
  const router = useAppRouter();
  const { toast } = useFeedback();
  const [d, setD] = useState(initial);
  const [at, setAt] = useState<WizardStep>('basics');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const setIng = (n: number, patch: Partial<IngredientDraft>) =>
    setD({ ...d, ingredients: d.ingredients.map((x, j) => (j === n ? { ...x, ...patch } : x)) });
  const setStep = (n: number, patch: Partial<StepDraft>) =>
    setD({ ...d, steps: d.steps.map((x, j) => (j === n ? { ...x, ...patch } : x)) });
  const move = <T,>(list: T[], n: number, by: number): T[] => {
    const next = [...list];
    const [x] = next.splice(n, 1);
    next.splice(Math.max(0, Math.min(next.length, n + by)), 0, x!);
    return next;
  };
  const toggle = (list: string[], v: string) =>
    list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
  /** Ingredient rows that have a name, with their row numbers. */
  const named = d.ingredients.map((i, n) => ({ i, n })).filter((x) => x.i.name.trim());

  const checks = useMemo(
    () =>
      recipeChecks({
        title: d.title,
        servings: Number(d.servings) || 0,
        prepMin: Number(d.prepMin) || 0,
        cookMin: Number(d.cookMin) || 0,
        equipment: d.equipment,
        ingredients: named.map(({ i }) => {
          const qty = parseQty(i.qty);
          return {
            name: i.name,
            qty: typeof qty === 'number' && !Number.isNaN(qty) ? qty : null,
            unit: i.unit,
            foodId: i.foodId,
            note: i.note || null,
          };
        }),
        steps: d.steps.map((s) => ({
          text: s.text,
          timerSec: Number(s.timerMin) > 0 ? Number(s.timerMin) * 60 : null,
          stage: s.stage,
          // Row numbers → positions among the named rows.
          uses:
            s.uses === null
              ? null
              : s.uses.map((row) => named.findIndex((x) => x.n === row)).filter((p) => p >= 0),
        })),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [d],
  );
  const ready = publishable(checks);

  async function save() {
    setBusy(true);
    setError('');
    try {
      const body = {
        ...d,
        ingredients: d.ingredients.map((i) => ({ ...i, scaling: i.scaling || undefined })),
      };
      let id = recipeId;
      if (id) await callApi(`/recipes/${id}`, 'PUT', body);
      else {
        const res = await callApi<{ id: number }>('/recipes', 'POST', body);
        id = res!.id;
        trackEvent('recipe_created');
      }
      if (d.makePublic && !isPublic) await callApi(`/recipes/${id}/publish`, 'POST');
      toast(recipeId ? t('saved') : t('created'));
      router.push(`/r/${id}`);
    } catch (err) {
      setError(errorMessage(err, tErr));
      setBusy(false);
    }
  }

  const index = WIZARD.indexOf(at);
  return (
    <div className="space-y-6">
      <ol className="flex flex-wrap gap-2 text-sm" aria-label={t('wizard')}>
        {WIZARD.map((w, i) => (
          <li key={w}>
            <button
              type="button"
              aria-current={w === at ? 'step' : undefined}
              onClick={() => setAt(w)}
              className={cn(
                'rounded-full px-3 py-1',
                w === at
                  ? 'bg-ink text-paper dark:bg-paper dark:text-ink'
                  : i < index
                    ? 'bg-quake/15'
                    : 'bg-ink/5 dark:bg-paper/10',
              )}
            >
              {i + 1}. {t(`step.${w}`)}
            </button>
          </li>
        ))}
      </ol>

      {at === 'basics' ? (
        <section className="space-y-4">
          <p className="text-sm text-ink/70 dark:text-paper/70">{t('basicsIntro')}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('title')} hint={t('titleHint')} className="sm:col-span-2">
              <Input
                required
                maxLength={100}
                value={d.title}
                onChange={(e) => setD({ ...d, title: e.target.value })}
              />
            </Field>
            <Field label={t('intro')} hint={t('introHint')} className="sm:col-span-2">
              <TextArea
                maxLength={1000}
                value={d.intro}
                onChange={(e) => setD({ ...d, intro: e.target.value })}
              />
            </Field>
            <Field label={t('servings')} hint={t('servingsHint')}>
              <Input
                inputMode="numeric"
                value={d.servings}
                onChange={(e) => setD({ ...d, servings: e.target.value.replace(/\D/g, '') })}
              />
            </Field>
            <Field label={t('difficulty')}>
              <Select
                value={d.difficulty}
                onChange={(e) => setD({ ...d, difficulty: e.target.value })}
              >
                {DIFFICULTIES.map((x) => (
                  <option key={x} value={x}>
                    {tDiff(x)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t('prepMin')} hint={t('prepHint')}>
              <Input
                inputMode="numeric"
                value={d.prepMin}
                onChange={(e) => setD({ ...d, prepMin: e.target.value.replace(/\D/g, '') })}
              />
            </Field>
            <Field label={t('cookMin')} hint={t('cookHint')}>
              <Input
                inputMode="numeric"
                value={d.cookMin}
                onChange={(e) => setD({ ...d, cookMin: e.target.value.replace(/\D/g, '') })}
              />
            </Field>
            <Field label={t('cuisine')} hint={t('cuisineHint')}>
              <Input
                maxLength={40}
                value={d.cuisine}
                onChange={(e) => setD({ ...d, cuisine: e.target.value })}
              />
            </Field>
          </div>
          <Field label={t('equipment')} hint={t('equipmentHint')}>
            <TextArea
              maxLength={500}
              value={d.equipment}
              onChange={(e) => setD({ ...d, equipment: e.target.value })}
            />
          </Field>
          <div className="flex flex-wrap gap-1">
            {EQUIPMENT.map((x) => (
              <button
                key={x}
                type="button"
                className="rounded-full border border-ink/15 px-3 py-1 text-xs hover:border-quake dark:border-paper/15"
                onClick={() =>
                  setD({ ...d, equipment: [d.equipment.trim(), tEq(x)].filter(Boolean).join('\n') })
                }
              >
                + {tEq(x)}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {at === 'ingredients' ? (
        <section className="space-y-3">
          <p className="text-sm text-ink/70 dark:text-paper/70">{t('ingredientsIntro')}</p>
          {d.ingredients.map((i, n) => (
            <div
              key={n}
              className="space-y-2 rounded-lg border border-ink/10 p-3 dark:border-paper/10"
            >
              <div className="grid gap-2 sm:grid-cols-[6rem_8rem_1fr]">
                <Input
                  aria-label={t('qty')}
                  placeholder={t('qty')}
                  inputMode="decimal"
                  value={i.qty}
                  disabled={i.unit === 'taste'}
                  onChange={(e) => setIng(n, { qty: e.target.value })}
                />
                <Select
                  aria-label={t('unit')}
                  value={i.unit}
                  onChange={(e) => setIng(n, { unit: e.target.value })}
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {tUnit(u)}
                    </option>
                  ))}
                </Select>
                <Input
                  aria-label={t('ingredientName')}
                  placeholder={t('ingredientPlaceholder')}
                  maxLength={80}
                  value={i.name}
                  onChange={(e) => setIng(n, { name: e.target.value })}
                />
              </div>
              <Input
                aria-label={t('prepare')}
                placeholder={t('preparePlaceholder')}
                maxLength={80}
                value={i.note}
                onChange={(e) => setIng(n, { note: e.target.value })}
                className="text-sm"
              />
              <div className="flex flex-wrap items-center gap-3">
                <FoodPicker
                  value={{ id: i.foodId, name: i.foodName, thumb: i.foodThumb }}
                  suggestFrom={i.name}
                  onChange={(f) =>
                    setIng(n, { foodId: f.id, foodName: f.name, foodThumb: f.thumb ?? null })
                  }
                />
                <label className="flex items-center gap-1 text-xs">
                  {t('scaling')}
                  <select
                    className="rounded border border-ink/15 bg-transparent px-1 py-0.5 dark:border-paper/15"
                    value={i.scaling}
                    onChange={(e) => setIng(n, { scaling: e.target.value })}
                  >
                    <option value="">{t('automatic')}</option>
                    {SCALINGS.map((s) => (
                      <option key={s} value={s}>
                        {tScale(s)}
                      </option>
                    ))}
                  </select>
                </label>
                <span className="ml-auto flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    aria-label={t('up')}
                    disabled={n === 0}
                    onClick={() => setD({ ...d, ingredients: move(d.ingredients, n, -1) })}
                  >
                    ↑
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    aria-label={t('down')}
                    disabled={n === d.ingredients.length - 1}
                    onClick={() => setD({ ...d, ingredients: move(d.ingredients, n, 1) })}
                  >
                    ↓
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    aria-label={t('removeIngredient')}
                    onClick={() =>
                      setD({ ...d, ingredients: d.ingredients.filter((_, j) => j !== n) })
                    }
                  >
                    ✕
                  </Button>
                </span>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            onClick={() => setD({ ...d, ingredients: [...d.ingredients, emptyIngredient()] })}
          >
            {t('addIngredient')}
          </Button>
        </section>
      ) : null}

      {at === 'steps' ? (
        <section className="space-y-3">
          <p className="text-sm text-ink/70 dark:text-paper/70">{t('stepsIntro')}</p>
          {d.steps.map((s, n) => {
            const auto = mentions(
              s.text,
              named.map(({ i }) => i),
            ).map((p) => named[p]!.n);
            const uses = s.uses ?? auto;
            const timer = s.timerMin ? null : suggestedTimerMin(s.text);
            return (
              <div
                key={n}
                className="space-y-2 rounded-lg border border-ink/10 p-3 dark:border-paper/10"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{t('stepN', { n: n + 1 })}</span>
                  <div className="flex gap-1" role="group" aria-label={t('stage')}>
                    {STAGES.map((st) => (
                      <button
                        key={st}
                        type="button"
                        aria-pressed={s.stage === st}
                        onClick={() => setStep(n, { stage: st })}
                        className={cn(
                          'rounded-full border px-2 py-0.5 text-xs',
                          s.stage === st
                            ? 'border-quake bg-quake/10'
                            : 'border-ink/15 dark:border-paper/15',
                        )}
                      >
                        {tStage(`stage.${st}`)}
                      </button>
                    ))}
                  </div>
                </div>
                <TextArea
                  aria-label={t('stepN', { n: n + 1 })}
                  placeholder={t('stepPlaceholder')}
                  maxLength={1000}
                  value={s.text}
                  onChange={(e) => setStep(n, { text: e.target.value })}
                />
                {s.text.length > 400 ? (
                  <p className="text-xs text-amber-700 dark:text-amber-400">{t('tooLongStep')}</p>
                ) : null}
                {named.length ? (
                  <div className="space-y-1">
                    <p className="text-xs text-ink/60 dark:text-paper/60">
                      {s.uses === null ? t('usesAuto') : t('uses')}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {named.map(({ i, n: row }) => (
                        <button
                          key={row}
                          type="button"
                          aria-pressed={uses.includes(row)}
                          onClick={() =>
                            setStep(n, {
                              uses: uses.includes(row)
                                ? uses.filter((x) => x !== row)
                                : [...uses, row],
                            })
                          }
                          className={cn(
                            'rounded-full border px-2 py-0.5 text-xs',
                            uses.includes(row)
                              ? 'border-quake bg-quake/10'
                              : 'border-ink/15 dark:border-paper/15',
                          )}
                        >
                          {i.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
                <div className="flex flex-wrap items-end gap-2">
                  <Field label={t('timerMin')}>
                    <Input
                      inputMode="decimal"
                      className="w-28"
                      value={s.timerMin}
                      onChange={(e) => setStep(n, { timerMin: e.target.value.replace(',', '.') })}
                    />
                  </Field>
                  {timer ? (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setStep(n, { timerMin: String(timer) })}
                    >
                      {t('addTimer', { count: timer })}
                    </Button>
                  ) : null}
                  <span className="ml-auto flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      aria-label={t('up')}
                      disabled={n === 0}
                      onClick={() => setD({ ...d, steps: move(d.steps, n, -1) })}
                    >
                      ↑
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      aria-label={t('down')}
                      disabled={n === d.steps.length - 1}
                      onClick={() => setD({ ...d, steps: move(d.steps, n, 1) })}
                    >
                      ↓
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      aria-label={t('removeStep')}
                      onClick={() => setD({ ...d, steps: d.steps.filter((_, j) => j !== n) })}
                    >
                      ✕
                    </Button>
                  </span>
                </div>
              </div>
            );
          })}
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              setD({ ...d, steps: [...d.steps, emptyStep(d.steps.at(-1)?.stage ?? 'cook')] })
            }
          >
            {t('addStep')}
          </Button>
        </section>
      ) : null}

      {at === 'check' ? (
        <section className="space-y-5">
          <p className="text-sm text-ink/70 dark:text-paper/70">{t('checkIntro')}</p>
          <Checklist checks={checks} />
          <Field label={t('tips')} hint={t('tipsHint')}>
            <TextArea
              maxLength={1000}
              value={d.tips}
              onChange={(e) => setD({ ...d, tips: e.target.value })}
            />
          </Field>
          <fieldset>
            <legend className="mb-1 text-sm font-medium">{t('tags')}</legend>
            <p className="mb-2 text-xs text-ink/60 dark:text-paper/60">{t('tagsHint')}</p>
            <div className="flex flex-wrap gap-1">
              {TAGS.map((x) => (
                <button
                  key={x}
                  type="button"
                  aria-pressed={d.tags.includes(x)}
                  onClick={() => setD({ ...d, tags: toggle(d.tags, x) })}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs',
                    d.tags.includes(x)
                      ? 'border-quake bg-quake/10'
                      : 'border-ink/15 dark:border-paper/15',
                  )}
                >
                  {tTag(x)}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-1 text-sm font-medium">{t('allergens')}</legend>
            <p className="mb-2 text-xs text-ink/60 dark:text-paper/60">{t('allergensHint')}</p>
            <div className="flex flex-wrap gap-1">
              {ALLERGENS.map((x) => (
                <button
                  key={x}
                  type="button"
                  aria-pressed={d.allergens.includes(x)}
                  onClick={() => setD({ ...d, allergens: toggle(d.allergens, x) })}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs',
                    d.allergens.includes(x)
                      ? 'border-quake bg-quake/10'
                      : 'border-ink/15 dark:border-paper/15',
                  )}
                >
                  {tAll(x)}
                </button>
              ))}
            </div>
          </fieldset>
          {!isPublic ? (
            <label className={cn('flex items-start gap-2 text-sm', !ready && 'opacity-60')}>
              <input
                type="checkbox"
                className="mt-0.5 size-4 accent-quake"
                disabled={!ready}
                checked={Boolean(d.makePublic) && ready}
                onChange={(e) => setD({ ...d, makePublic: e.target.checked })}
              />
              <span>
                <span className="font-medium">{t('makePublic')}</span>
                <span className="block text-xs text-ink/60 dark:text-paper/60">
                  {ready ? t('makePublicHint') : t('makePublicBlocked')}
                </span>
              </span>
            </label>
          ) : (
            <p className="text-xs text-ink/60 dark:text-paper/60">{t('alreadyPublic')}</p>
          )}
        </section>
      ) : null}

      <ErrorText>{error}</ErrorText>
      <div className="flex flex-wrap justify-between gap-2">
        {index > 0 ? (
          <Button type="button" variant="secondary" onClick={() => setAt(WIZARD[index - 1]!)}>
            {t('previous')}
          </Button>
        ) : (
          <span />
        )}
        {at === 'check' ? (
          <Button type="button" disabled={busy} onClick={save}>
            {busy ? t('saving') : recipeId ? t('save') : t('create')}
          </Button>
        ) : (
          <Button type="button" onClick={() => setAt(WIZARD[index + 1]!)}>
            {t('next')}
          </Button>
        )}
      </div>
    </div>
  );
}
