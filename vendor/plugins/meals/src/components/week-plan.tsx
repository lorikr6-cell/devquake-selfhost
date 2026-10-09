'use client';

import { useEffect, useId, useRef, useState } from 'react';
import {
  Button,
  LOCALE_TAGS,
  Sheet,
  buttonClass,
  cn,
  useDaySelection,
  useLocale,
  useT,
} from '@devquake/ui';
import type { Meal, MealSet } from '../lib/data';
import { formatDayLong, formatDayShort } from '../lib/dates';
import { SLOTS, dayTotals, mealNutrition, slotIcon, type Slot } from '../lib/plan';
import { callApi, errorMessage } from './call-api';
import { useFeedback } from './feedback';
import { ErrorText, Field, Input, Select } from './ui';
import { useAppRouter } from './use-app-router';

interface RecipeHit {
  ref: string;
  title: string;
  minutes: number;
  kcal: number | null;
}

export interface ShoppingList {
  id: number;
  name: string;
}

type PartTab = 'recipe' | 'item' | 'saved';

/** Choosing a part: a cookbook recipe (searched), an item with a quantity, or a saved meal. */
function PartPicker({
  householdId,
  cookbook,
  allowSaved,
  onPick,
}: {
  householdId: number;
  cookbook: boolean;
  /** Offer saved meals (only when planning a new meal). */
  allowSaved: boolean;
  onPick: (pick: {
    recipe?: RecipeHit;
    item?: { name: string; qty: string; unit: string };
    set?: MealSet;
  }) => void;
}) {
  const t = useT('week');
  const [tab, setTab] = useState<PartTab>(cookbook ? 'recipe' : 'item');
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<RecipeHit[]>([]);
  const [sets, setSets] = useState<{ mine: MealSet[]; community: MealSet[] } | null>(null);
  const [item, setItem] = useState({ name: '', qty: '', unit: '' });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (tab !== 'recipe' || !cookbook) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const res = await callApi<{ recipes: RecipeHit[] }>(
        `/recipes?household=${householdId}&q=${encodeURIComponent(query)}`,
      ).catch(() => null);
      setHits(res?.recipes ?? []);
    }, 250);
  }, [query, tab, cookbook, householdId]);

  useEffect(() => {
    if (tab !== 'saved' || sets) return;
    callApi<{ mine: MealSet[]; community: MealSet[] }>('/sets')
      .then((res) => setSets(res ?? { mine: [], community: [] }))
      .catch(() => setSets({ mine: [], community: [] }));
  }, [tab, sets]);

  const tabs: PartTab[] = [
    ...(cookbook ? (['recipe'] as const) : []),
    'item',
    ...(allowSaved ? (['saved'] as const) : []),
  ];
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1" role="tablist">
        {tabs.map((x) => (
          <button
            key={x}
            type="button"
            role="tab"
            aria-selected={tab === x}
            onClick={() => setTab(x)}
            className={cn(
              'rounded-full border px-3 py-1 text-sm',
              tab === x ? 'border-quake bg-quake/10' : 'border-ink/15 dark:border-paper/15',
            )}
          >
            {t(`tab.${x}`)}
          </button>
        ))}
      </div>
      {tab === 'recipe' ? (
        <div className="space-y-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            aria-label={t('searchRecipe')}
          />
          <ul className="max-h-56 space-y-1 overflow-y-auto">
            {hits.map((h) => (
              <li key={h.ref}>
                <button
                  type="button"
                  className="w-full rounded-md border border-ink/10 px-3 py-2 text-left text-sm hover:border-quake dark:border-paper/10"
                  onClick={() => onPick({ recipe: h })}
                >
                  <span className="font-medium">{h.title}</span>{' '}
                  <span className="text-xs text-ink/60 dark:text-paper/60">
                    {[
                      h.minutes ? t('minutes', { count: h.minutes }) : null,
                      h.kcal ? t('kcal', { kcal: h.kcal }) : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : tab === 'item' ? (
        <div className="grid gap-2 sm:grid-cols-[1fr_6rem_6rem_auto] sm:items-end">
          <Field label={t('itemName')}>
            <Input
              maxLength={100}
              value={item.name}
              placeholder={t('itemPlaceholder')}
              onChange={(e) => setItem({ ...item, name: e.target.value })}
            />
          </Field>
          <Field label={t('qty')}>
            <Input
              inputMode="decimal"
              value={item.qty}
              onChange={(e) => setItem({ ...item, qty: e.target.value })}
            />
          </Field>
          <Field label={t('unit')}>
            <Input
              maxLength={16}
              value={item.unit}
              placeholder={t('unitPlaceholder')}
              onChange={(e) => setItem({ ...item, unit: e.target.value })}
            />
          </Field>
          <Button
            type="button"
            variant="secondary"
            disabled={!item.name.trim()}
            onClick={() => onPick({ item })}
          >
            {t('choose')}
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {!sets ? (
            <p className="text-sm text-ink/60 dark:text-paper/60">…</p>
          ) : sets.mine.length + sets.community.length === 0 ? (
            <p className="text-sm text-ink/60 dark:text-paper/60">{t('noSaved')}</p>
          ) : (
            <ul className="max-h-64 space-y-1 overflow-y-auto">
              {[...sets.mine, ...sets.community].map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    className="w-full rounded-md border border-ink/10 px-3 py-2 text-left text-sm hover:border-quake dark:border-paper/10"
                    onClick={() => onPick({ set: s })}
                  >
                    <span className="font-medium">{s.title}</span>{' '}
                    <span className="text-xs text-ink/60 dark:text-paper/60">
                      {s.items.map((i) => i.name).join(', ')}
                      {s.isPublic ? ` · 👍 ${s.recommendations} · ${s.ownerName}` : ''}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

/** Planning a meal for a day: its slot and its first part (or a saved meal), servings, reminder. */
function AddMeal({
  householdId,
  day,
  defaultServings,
  cookbook,
  onClose,
}: {
  householdId: number;
  day: string;
  defaultServings: number;
  cookbook: boolean;
  onClose: () => void;
}) {
  const t = useT('week');
  const tSlot = useT('slots');
  const tErr = useT('errors');
  const tag = LOCALE_TAGS[useLocale()];
  const router = useAppRouter();
  const { toast } = useFeedback();
  const titleId = useId();
  const [slot, setSlot] = useState<Slot>('dinner');
  const [servings, setServings] = useState(String(defaultServings));
  const [leftovers, setLeftovers] = useState(false);
  const [remind, setRemind] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function plan(pick: {
    recipe?: RecipeHit;
    item?: { name: string; qty: string; unit: string };
    set?: MealSet;
  }) {
    setBusy(true);
    setError('');
    try {
      await callApi(`/households/${householdId}/meals`, 'POST', {
        day,
        slot,
        servings,
        leftovers,
        remind,
        setId: pick.set?.id,
        items: pick.recipe ? [{ recipeRef: pick.recipe.ref }] : pick.item ? [pick.item] : undefined,
      });
      toast(t('added'));
      onClose();
      router.refresh();
    } catch (err) {
      setError(errorMessage(err, tErr));
      setBusy(false);
    }
  }

  return (
    <Sheet open onClose={onClose} labelledBy={titleId}>
      <div className="space-y-4">
        <h2 id={titleId} className="font-display text-xl font-bold">
          {t('addTitle', { day: formatDayLong(day, tag) })}
        </h2>
        <div className="flex flex-wrap gap-1" role="group" aria-label={t('slot')}>
          {SLOTS.map((s) => (
            <button
              key={s.code}
              type="button"
              aria-pressed={slot === s.code}
              onClick={() => setSlot(s.code)}
              className={cn(
                'rounded-full border px-3 py-1 text-sm',
                slot === s.code ? 'border-quake bg-quake/10' : 'border-ink/15 dark:border-paper/15',
              )}
            >
              {s.icon} {tSlot(s.code)}
            </button>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t('servings')} hint={t('servingsHint')}>
            <Input
              inputMode="numeric"
              value={servings}
              onChange={(e) => setServings(e.target.value.replace(/\D/g, ''))}
            />
          </Field>
          <label className="flex items-center gap-2 self-end pb-2 text-sm">
            <input
              type="checkbox"
              className="size-4 accent-quake"
              checked={leftovers}
              onChange={(e) => setLeftovers(e.target.checked)}
            />
            {t('leftovers')}
          </label>
        </div>
        <Field label={t('remind')} hint={t('remindHint')}>
          <Input
            maxLength={160}
            value={remind}
            onChange={(e) => setRemind(e.target.value)}
            placeholder={t('remindPlaceholder')}
          />
        </Field>
        <p className="text-sm font-medium">{t('firstPart')}</p>
        <PartPicker
          householdId={householdId}
          cookbook={cookbook}
          allowSaved
          onPick={(p) => !busy && plan(p)}
        />
        <ErrorText>{error}</ErrorText>
        <div className="flex justify-end">
          <Button type="button" variant="secondary" onClick={onClose} disabled={busy}>
            {t('cancel')}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}

/** Adding a part (a recipe "as part of the meal", or an item) to a planned meal. */
function AddPart({
  householdId,
  meal,
  cookbook,
  onClose,
}: {
  householdId: number;
  meal: Meal;
  cookbook: boolean;
  onClose: () => void;
}) {
  const t = useT('week');
  const tErr = useT('errors');
  const router = useAppRouter();
  const { toast } = useFeedback();
  const titleId = useId();
  const [error, setError] = useState('');
  return (
    <Sheet open onClose={onClose} labelledBy={titleId}>
      <div className="space-y-4">
        <h2 id={titleId} className="font-display text-xl font-bold">
          {t('addPartTitle', { title: meal.title })}
        </h2>
        <PartPicker
          householdId={householdId}
          cookbook={cookbook}
          allowSaved={false}
          onPick={async (pick) => {
            setError('');
            try {
              await callApi(`/households/${householdId}/meals/${meal.id}/items`, 'POST', {
                items: pick.recipe ? [{ recipeRef: pick.recipe.ref }] : [pick.item],
              });
              toast(t('partAdded'));
              onClose();
              router.refresh();
            } catch (err) {
              setError(errorMessage(err, tErr));
            }
          }}
        />
        <ErrorText>{error}</ErrorText>
        <div className="flex justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t('cancel')}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}

function MealRow({
  meal,
  householdId,
  recipeUrls,
  cookbook,
}: {
  meal: Meal;
  householdId: number;
  /** Deep links into the cookbook by part index. */
  recipeUrls: Record<number, string>;
  cookbook: boolean;
}) {
  const t = useT('week');
  const tErr = useT('errors');
  const router = useAppRouter();
  const { confirm, toast } = useFeedback();
  const [cooked, setCooked] = useState(meal.cooked);
  const [adding, setAdding] = useState(false);
  const n = mealNutrition(meal.items);

  async function run(action: () => Promise<unknown>, done?: string) {
    try {
      await action();
      if (done) toast(done);
      router.refresh();
    } catch (err) {
      toast(errorMessage(err, tErr), 'error');
    }
  }

  return (
    <li className="py-1.5 text-sm">
      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          className="mt-0.5 size-4 accent-quake"
          aria-label={t('cookedLabel', { title: meal.title })}
          checked={cooked}
          onChange={(e) => {
            setCooked(e.target.checked);
            void run(
              () =>
                callApi(`/households/${householdId}/meals/${meal.id}`, 'PATCH', {
                  cooked: e.target.checked,
                }),
              e.target.checked ? t('cookedToast') : undefined,
            );
          }}
        />
        <span className="min-w-0 flex-1">
          <span aria-hidden>{slotIcon(meal.slot)} </span>
          <span className={cn('font-medium', cooked && 'line-through opacity-60')}>
            {meal.title}
          </span>
          <span className="block text-xs text-ink/60 dark:text-paper/60">
            {[
              meal.leftovers ? t('leftoversTag') : t('servingsCount', { count: meal.servings }),
              n.kcal !== null ? t('kcal', { kcal: Math.round(n.kcal) }) : null,
              meal.remind ? `⏰ ${meal.remind}` : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </span>
          {meal.items.length > 1 ||
          (meal.items[0] && meal.items[0].name !== meal.title) ||
          meal.items.some((i) => !i.recipeRef) ? (
            <ul className="mt-1 space-y-0.5 text-xs">
              {meal.items.map((i, index) => (
                <li key={index} className="flex items-center gap-1">
                  <span aria-hidden>{i.recipeRef ? '📖' : '•'}</span>
                  {recipeUrls[index] ? (
                    <a href={recipeUrls[index]} className="underline-offset-2 hover:underline">
                      {i.name}
                    </a>
                  ) : (
                    <span>
                      {i.name}
                      {i.qty !== null ? ` · ${i.qty}${i.unit ? ` ${i.unit}` : ''}` : ''}
                    </span>
                  )}
                  <button
                    type="button"
                    className="ml-1 text-ink/40 hover:text-red-700 dark:text-paper/40"
                    aria-label={t('removePart', { name: i.name })}
                    onClick={() =>
                      run(
                        () =>
                          callApi(
                            `/households/${householdId}/meals/${meal.id}/items/${index}`,
                            'DELETE',
                          ),
                        t('partRemoved'),
                      )
                    }
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          ) : recipeUrls[0] ? (
            <a href={recipeUrls[0]} className="block text-xs underline-offset-2 hover:underline">
              📖 {t('openRecipe')}
            </a>
          ) : null}
          <span className="mt-1 flex flex-wrap gap-2 text-xs">
            <button type="button" className="underline" onClick={() => setAdding(true)}>
              {t('addPart')}
            </button>
            {meal.items.length ? (
              <button
                type="button"
                className="underline"
                onClick={() =>
                  run(() => callApi('/sets', 'POST', { householdId, mealId: meal.id }), t('saved'))
                }
              >
                {t('saveMeal')}
              </button>
            ) : null}
          </span>
        </span>
        <Button
          type="button"
          variant="ghost"
          aria-label={t('removeLabel', { title: meal.title })}
          onClick={async () => {
            const ok = await confirm({
              title: t('removeTitle', { title: meal.title }),
              body: t('removeBody'),
              confirmLabel: t('remove'),
              danger: true,
            });
            if (ok)
              await run(
                () => callApi(`/households/${householdId}/meals/${meal.id}`, 'DELETE'),
                t('removed'),
              );
          }}
        >
          ✕
        </Button>
      </div>
      {adding ? (
        <AddPart
          householdId={householdId}
          meal={meal}
          cookbook={cookbook}
          onClose={() => setAdding(false)}
        />
      ) : null}
    </li>
  );
}

/** The week: a card per day with its meals, "Add a meal", and a person's nutrition for the day. */
export function WeekPlan({
  householdId,
  days,
  today,
  meals,
  recipeUrls,
  defaultServings,
  cookbook,
  targets,
}: {
  householdId: number;
  days: string[];
  today: string;
  meals: Meal[];
  /** Deep links into the cookbook: "mealId:partIndex" → URL. */
  recipeUrls: Record<string, string>;
  defaultServings: number;
  cookbook: boolean;
  targets: { kcal: number; protein: number };
}) {
  const t = useT('week');
  const tag = LOCALE_TAGS[useLocale()];
  const [adding, setAdding] = useState<string | null>(null);
  // A clicked day shows only that day; clicking it again (or another week) shows the whole week.
  const { selected, toggle, clear } = useDaySelection(days[0] ?? '');
  const shown = selected && days.includes(selected) ? [selected] : days;
  return (
    <div className="space-y-3">
      <nav aria-label={t('pickDay')} className="overflow-x-auto">
        <ol className="flex min-w-max gap-1">
          {days.map((d) => {
            const count = meals.filter((m) => m.day === d).length;
            return (
              <li key={d}>
                <button
                  type="button"
                  onClick={() => toggle(d)}
                  aria-pressed={selected === d}
                  className={cn(
                    'flex w-14 flex-col items-center rounded-md border px-1 py-1 text-xs',
                    selected === d
                      ? 'border-quake bg-quake text-white'
                      : 'border-ink/10 hover:border-quake dark:border-paper/15',
                    d === today && selected !== d && 'ring-1 ring-quake',
                  )}
                >
                  <span>{formatDayShort(d, tag).split(/[ ,.]+/)[0]}</span>
                  <span className="text-sm font-semibold">{Number(d.slice(8))}</span>
                  <span className="text-[10px] opacity-80">{count || '·'}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>
      {selected ? (
        <button type="button" onClick={clear} className="text-sm text-quake underline">
          {t('showWeek')}
        </button>
      ) : null}
      <div className={cn('grid gap-3', shown.length > 1 && 'sm:grid-cols-2 lg:grid-cols-3')}>
        {shown.map((d) => {
          const list = meals.filter((m) => m.day === d);
          const totals = dayTotals(list.map((m) => mealNutrition(m.items)));
          return (
            <section
              key={d}
              className={cn(
                'flex flex-col rounded-xl border bg-white/70 p-3 dark:bg-paper/5',
                d === today ? 'border-quake' : 'border-ink/10 dark:border-paper/10',
              )}
            >
              <h3 className="text-sm font-semibold">
                {formatDayShort(d, tag)}
                {d === today ? <span className="ml-2 text-xs text-quake">{t('today')}</span> : null}
              </h3>
              {list.length ? (
                <ul className="divide-y divide-ink/5 dark:divide-paper/5">
                  {list.map((m) => (
                    <MealRow
                      key={m.id}
                      meal={m}
                      householdId={householdId}
                      cookbook={cookbook}
                      recipeUrls={Object.fromEntries(
                        m.items.flatMap((_, i) =>
                          recipeUrls[`${m.id}:${i}`] ? [[i, recipeUrls[`${m.id}:${i}`]!]] : [],
                        ),
                      )}
                    />
                  ))}
                </ul>
              ) : (
                <p className="py-2 text-xs text-ink/50 dark:text-paper/50">{t('nothing')}</p>
              )}
              {list.length ? (
                <p className="mt-1 text-[11px] text-ink/60 dark:text-paper/60">
                  {totals.known
                    ? t('dayTotals', {
                        kcal: totals.kcal,
                        kcalTarget: targets.kcal,
                        protein: totals.protein,
                        proteinTarget: targets.protein,
                      })
                    : t('dayPartial')}
                </p>
              ) : null}
              <div className="mt-auto pt-2">
                <Button type="button" variant="ghost" onClick={() => setAdding(d)}>
                  {t('addMeal')}
                </Button>
              </div>
            </section>
          );
        })}
        {adding ? (
          <AddMeal
            key={adding}
            householdId={householdId}
            day={adding}
            defaultServings={defaultServings}
            cookbook={cookbook}
            onClose={() => setAdding(null)}
          />
        ) : null}
      </div>
    </div>
  );
}

/** "Suggest the week" (planners) and "Week to a shopping list", or a suggestion to connect. */
export function WeekActions({
  householdId,
  monday,
  isPlanner,
  cookbook,
  lists,
  shoppingConnect,
}: {
  householdId: number;
  monday: string;
  isPlanner: boolean;
  cookbook: boolean;
  lists: ShoppingList[] | null;
  /** How to get the shopping lists when they are not connected. */
  shoppingConnect: { url: string; label: 'connect' | 'getIt' } | null;
}) {
  const t = useT('week');
  const tSlot = useT('slots');
  const tErr = useT('errors');
  const router = useAppRouter();
  const { toast } = useFeedback();
  const [slots, setSlots] = useState<Slot[]>(['dinner']);
  const [listId, setListId] = useState(lists?.[0] ? String(lists[0].id) : '');
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<string>) {
    setBusy(true);
    try {
      toast(await action());
      router.refresh();
    } catch (err) {
      toast(errorMessage(err, tErr), 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {isPlanner && cookbook ? (
        <div className="space-y-2 rounded-xl border border-ink/10 p-4 text-sm dark:border-paper/10">
          <p className="font-medium">{t('suggestTitle')}</p>
          <p className="text-xs text-ink/60 dark:text-paper/60">{t('suggestIntro')}</p>
          <div className="flex flex-wrap gap-3">
            {(['breakfast', 'lunch', 'dinner'] as const).map((s) => (
              <label key={s} className="flex items-center gap-1">
                <input
                  type="checkbox"
                  className="size-4 accent-quake"
                  checked={slots.includes(s)}
                  onChange={(e) =>
                    setSlots(e.target.checked ? [...slots, s] : slots.filter((x) => x !== s))
                  }
                />
                {tSlot(s)}
              </label>
            ))}
          </div>
          <Button
            type="button"
            disabled={busy || slots.length === 0}
            onClick={() =>
              run(async () => {
                const res = await callApi<{ added: number }>(
                  `/households/${householdId}/suggest`,
                  'POST',
                  { week: monday, slots },
                );
                return t('suggested', { count: res?.added ?? 0 });
              })
            }
          >
            {t('suggest')}
          </Button>
        </div>
      ) : null}
      {lists ? (
        <div className="space-y-2 rounded-xl border border-ink/10 p-4 text-sm dark:border-paper/10">
          <p className="font-medium">{t('shoppingTitle')}</p>
          <p className="text-xs text-ink/60 dark:text-paper/60">{t('shoppingIntro')}</p>
          {lists.length ? (
            <div className="flex flex-wrap items-end gap-2">
              <Select
                aria-label={t('list')}
                className="w-auto"
                value={listId}
                onChange={(e) => setListId(e.target.value)}
              >
                {lists.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </Select>
              <Button
                type="button"
                disabled={busy || !listId}
                onClick={() =>
                  run(async () => {
                    const res = await callApi<{ added: number }>(
                      `/households/${householdId}/shopping`,
                      'POST',
                      { week: monday, listId: Number(listId) },
                    );
                    const list = lists.find((l) => String(l.id) === listId);
                    return t('shopped', { count: res?.added ?? 0, list: list?.name ?? '' });
                  })
                }
              >
                {t('shop')}
              </Button>
            </div>
          ) : (
            <p className="text-ink/60 dark:text-paper/60">{t('noLists')}</p>
          )}
        </div>
      ) : shoppingConnect ? (
        <div className="space-y-2 rounded-xl border border-ink/10 p-4 text-sm dark:border-paper/10">
          <p className="font-medium">{t('shoppingTitle')}</p>
          <p className="text-xs text-ink/60 dark:text-paper/60">{t('shoppingConnectIntro')}</p>
          <a href={shoppingConnect.url} className={buttonClass('secondary')}>
            {shoppingConnect.label === 'connect' ? t('connectShopping') : t('getShopping')}
          </a>
        </div>
      ) : null}
    </div>
  );
}
