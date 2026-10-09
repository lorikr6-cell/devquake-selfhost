'use client';

import { useState, type FormEvent } from 'react';
import { Button, LOCALES, LOCALE_NAMES, cn, useT } from '@devquake/ui';
import { FOOD_ICONS, FOOD_ICON_KEYS, type FoodIcon } from '../lib/food-icons';
import {
  ALLERGENS,
  FOOD_KINDS,
  NUTRIENTS,
  ORIGINS,
  WEIGHED_UNITS,
  type Allergen,
  type Food,
  type FoodKind,
  type Origin,
} from '../lib/food-model';
import { callApi, errorMessage } from './call-api';
import { useFeedback } from './feedback';
import { FoodIconImage } from './food-icon';
import { Field, Input, Panel, Select } from './ui';
import { useAppRouter } from './use-app-router';

const str = (v: number | undefined) => (v === undefined ? '' : String(v));

/**
 * Adds (food null) or changes a food of the catalogue (DevQuake staff): names in every language,
 * kind, thumbnail and colour with a live preview, nutrition per 100 g, weights per unit,
 * allergens, origin, and whether it is offered.
 */
export function FoodEditor({ food }: { food: Food | null }) {
  const t = useT('foodAdmin');
  const tKind = useT('foodKinds');
  const tOrigin = useT('origins');
  const tIcon = useT('foodIcons');
  const tN = useT('nutrients');
  const tUnit = useT('units');
  const tAll = useT('allergens');
  const tErr = useT('errors');
  const { toast } = useFeedback();
  const router = useAppRouter();

  const [id, setId] = useState(food?.id ?? '');
  const [names, setNames] = useState<Record<string, string>>({ ...(food?.name ?? {}) });
  const [kind, setKind] = useState<FoodKind>(food?.kind ?? 'vegetable');
  const [icon, setIcon] = useState<FoodIcon>(food?.icon ?? 'leaf');
  const [colour, setColour] = useState(food?.colour ?? '');
  const [per100, setPer100] = useState<Record<string, string>>(
    Object.fromEntries(NUTRIENTS.map((k) => [k, str(food?.per100[k])])),
  );
  const [grams, setGrams] = useState<Record<string, string>>(
    Object.fromEntries(WEIGHED_UNITS.map((u) => [u, str(food?.grams?.[u])])),
  );
  const [density, setDensity] = useState(str(food?.density));
  const [allergens, setAllergens] = useState<Allergen[]>(food?.allergens ?? []);
  const [origin, setOrigin] = useState<Origin>(food?.origin ?? 'plant');
  const [spice, setSpice] = useState(food?.spice === true);
  const [active, setActive] = useState(food?.active !== false);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const body = {
      id,
      name: names,
      kind,
      icon,
      colour: colour || null,
      per100,
      grams: Object.fromEntries(Object.entries(grams).filter(([, v]) => v.trim() !== '')),
      density: density.trim() || null,
      allergens,
      origin,
      spice,
      active,
    };
    try {
      if (food) await callApi(`/admin/foods/${food.id}`, 'PUT', body);
      else await callApi('/admin/foods', 'POST', body);
      toast(t('saved'));
      router.push('/admin/foods');
    } catch (err) {
      toast(errorMessage(err, tErr), 'error');
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <Panel className="space-y-4">
        {food ? null : (
          <Field label={t('id')} hint={t('idHint')}>
            <Input
              value={id}
              onChange={(e) => setId(e.target.value)}
              required
              maxLength={40}
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              autoCapitalize="none"
              spellCheck={false}
            />
          </Field>
        )}
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">{t('names')}</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {LOCALES.map((l) => (
              <Field key={l} label={LOCALE_NAMES[l]}>
                <Input
                  value={names[l] ?? ''}
                  onChange={(e) => setNames({ ...names, [l]: e.target.value })}
                  required
                  maxLength={80}
                  lang={l}
                />
              </Field>
            ))}
          </div>
        </fieldset>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t('kind')}>
            <Select value={kind} onChange={(e) => setKind(e.target.value as FoodKind)}>
              {FOOD_KINDS.map((k) => (
                <option key={k} value={k}>
                  {tKind(k)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t('origin')}>
            <Select value={origin} onChange={(e) => setOrigin(e.target.value as Origin)}>
              {ORIGINS.map((o) => (
                <option key={o} value={o}>
                  {tOrigin(o)}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Panel>

      <Panel className="space-y-3">
        <div className="flex items-center gap-3">
          <FoodIconImage icon={icon} colour={colour} className="size-16" />
          <div className="space-y-2">
            <span className="block text-sm font-medium">{t('colour')}</span>
            <span className="flex flex-wrap items-center gap-3 text-sm">
              <input
                type="color"
                aria-label={t('colour')}
                value={colour || FOOD_ICONS[icon]}
                onChange={(e) => setColour(e.target.value)}
                className="h-9 w-12 cursor-pointer rounded border border-ink/15 bg-transparent dark:border-paper/15"
              />
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="size-4 accent-quake"
                  checked={!colour}
                  onChange={(e) => setColour(e.target.checked ? '' : FOOD_ICONS[icon])}
                />
                {t('defaultColour')}
              </label>
            </span>
          </div>
        </div>
        <fieldset>
          <legend className="mb-2 text-sm font-medium">{t('thumbnail')}</legend>
          <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-11">
            {FOOD_ICON_KEYS.map((k) => (
              <button
                key={k}
                type="button"
                title={tIcon(k)}
                aria-label={tIcon(k)}
                aria-pressed={icon === k}
                onClick={() => setIcon(k)}
                className={cn(
                  'grid place-items-center rounded-md border p-1 hover:border-quake',
                  icon === k ? 'border-quake bg-quake/10' : 'border-ink/10 dark:border-paper/10',
                )}
              >
                <FoodIconImage icon={k} colour={colour || undefined} className="size-7" />
              </button>
            ))}
          </div>
        </fieldset>
      </Panel>

      <Panel className="space-y-4">
        <fieldset>
          <legend className="mb-2 text-sm font-medium">{t('nutrition')}</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {NUTRIENTS.map((k) => (
              <Field key={k} label={tN(k)}>
                <Input
                  inputMode="decimal"
                  value={per100[k] ?? ''}
                  onChange={(e) => setPer100({ ...per100, [k]: e.target.value })}
                  required
                />
              </Field>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="text-sm font-medium">{t('weights')}</legend>
          <p className="mb-2 text-xs text-ink/60 dark:text-paper/60">{t('weightsHint')}</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {WEIGHED_UNITS.map((u) => (
              <Field key={u} label={tUnit(u)}>
                <Input
                  inputMode="decimal"
                  value={grams[u] ?? ''}
                  onChange={(e) => setGrams({ ...grams, [u]: e.target.value })}
                />
              </Field>
            ))}
          </div>
        </fieldset>
        <Field label={t('density')} hint={t('densityHint')} className="sm:w-64">
          <Input inputMode="decimal" value={density} onChange={(e) => setDensity(e.target.value)} />
        </Field>
      </Panel>

      <Panel className="space-y-3">
        <fieldset>
          <legend className="mb-2 text-sm font-medium">{t('allergens')}</legend>
          <div className="grid gap-1.5 sm:grid-cols-3">
            {ALLERGENS.map((a) => (
              <label key={a} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="size-4 accent-quake"
                  checked={allergens.includes(a)}
                  onChange={(e) =>
                    setAllergens(
                      e.target.checked ? [...allergens, a] : allergens.filter((x) => x !== a),
                    )
                  }
                />
                {tAll(a)}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="size-4 accent-quake"
            checked={spice}
            onChange={(e) => setSpice(e.target.checked)}
          />
          {t('spice')}
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="size-4 accent-quake"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
          />
          {t('active')}
        </label>
      </Panel>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={() => router.push('/admin/foods')}>
          {t('cancel')}
        </Button>
        <Button type="submit" disabled={busy}>
          {busy ? t('saving') : t('save')}
        </Button>
      </div>
    </form>
  );
}
