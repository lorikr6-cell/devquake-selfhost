'use client';

import { useState, type FormEvent } from 'react';
import { Button, LOCALE_TAGS, cn, useLocale, useT } from '@devquake/ui';
import { DELIVERY_MEAL, dishLines, formatTime, type MealTime } from '../lib/meals';
import type { Menu } from '../lib/meals-data';
import { DIETS, type Diet } from '../lib/model';
import { callApi } from './call-api';
import { ErrorText, Field, Input, Panel, TextArea } from './ui';
import { useAction } from './use-action';

/** "Mon 20" in the page language. */
function dayLabel(day: string, tag: string) {
  return new Date(`${day}T12:00:00Z`).toLocaleDateString(tag, {
    weekday: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

interface Meal {
  id: number;
  name: string;
}

/**
 * The week's menus: one row per meal (the delivered meal, then the residents' meal times), one
 * column per day. Planners click a cell to write its dishes and diet variants.
 */
export function WeekMenus({
  orgId,
  days,
  mealTimes,
  menus,
  canEdit,
}: {
  orgId: number;
  days: string[];
  mealTimes: MealTime[];
  menus: Menu[];
  canEdit: boolean;
}) {
  const t = useT();
  const tag = LOCALE_TAGS[useLocale()];
  const [open, setOpen] = useState<{ day: string; meal: number } | null>(null);
  const meals: Meal[] = [
    { id: DELIVERY_MEAL, name: t('meals.delivered') },
    ...mealTimes.map((m) => ({
      id: m.id,
      name: `${m.name} ${formatTime(m.startsMin)}–${formatTime(m.endsMin)}`,
    })),
  ];
  const menuOf = (day: string, meal: number) => menus.find((m) => m.day === day && m.meal === meal);
  const selected = open ? menuOf(open.day, open.meal) : undefined;

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-ink/10 dark:border-paper/10">
        <table className="w-full min-w-[56rem] table-fixed text-sm">
          <thead>
            <tr className="bg-ink/5 text-left dark:bg-paper/5">
              <th className="w-36 px-3 py-2 font-medium" />
              {days.map((d) => (
                <th key={d} className="px-3 py-2 font-medium capitalize">
                  {dayLabel(d, tag)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10 dark:divide-paper/10">
            {meals.map((meal) => (
              <tr key={meal.id} className="align-top">
                <th scope="row" className="px-3 py-2 text-left text-xs font-medium">
                  {meal.name}
                </th>
                {days.map((day) => {
                  const menu = menuOf(day, meal.id);
                  const active = open?.day === day && open.meal === meal.id;
                  const variants = menu ? Object.keys(menu.variants).length : 0;
                  const body = (
                    <>
                      {menu ? (
                        <ul className="space-y-0.5">
                          {dishLines(menu.dishes).map((line, i) => (
                            <li key={i}>{line}</li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-ink/40 dark:text-paper/40">—</span>
                      )}
                      {variants ? (
                        <span className="mt-1 block text-[11px] text-ink/60 dark:text-paper/60">
                          {t('meals.variantsCount', { count: variants })}
                        </span>
                      ) : null}
                    </>
                  );
                  return (
                    <td key={day} className="p-1">
                      {canEdit ? (
                        <button
                          type="button"
                          onClick={() => setOpen({ day, meal: meal.id })}
                          aria-label={`${meal.name}, ${dayLabel(day, tag)}`}
                          className={cn(
                            'block min-h-16 w-full rounded-md p-2 text-left hover:bg-quake/10',
                            active && 'bg-quake/15 ring-2 ring-quake',
                          )}
                        >
                          {body}
                        </button>
                      ) : (
                        <div className="p-2">{body}</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {open && canEdit ? (
        <MenuEditor
          key={`${open.day}-${open.meal}`}
          orgId={orgId}
          day={open.day}
          meal={open.meal}
          title={`${meals.find((m) => m.id === open.meal)?.name ?? ''} · ${dayLabel(open.day, tag)}`}
          menu={selected}
          onClose={() => setOpen(null)}
        />
      ) : null}
    </>
  );
}

function MenuEditor({
  orgId,
  day,
  meal,
  title,
  menu,
  onClose,
}: {
  orgId: number;
  day: string;
  meal: number;
  title: string;
  menu: Menu | undefined;
  onClose: () => void;
}) {
  const t = useT();
  const [dishes, setDishes] = useState(menu?.dishes ?? '');
  const [variants, setVariants] = useState<Partial<Record<Diet, string>>>(menu?.variants ?? {});
  const { busy, error, act } = useAction();

  async function save(e: FormEvent) {
    e.preventDefault();
    await act(() => callApi(`/orgs/${orgId}/menus`, 'PUT', { day, meal, dishes, variants }), {
      success: t('meals.saved'),
    });
  }

  return (
    <Panel className="mt-4">
      <form onSubmit={save} className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold capitalize">{title}</h2>
          <Button type="button" variant="ghost" onClick={onClose}>
            {t('feedback.close')}
          </Button>
        </div>
        <Field label={t('fields.dishes')} hint={t('meals.dishesHint')}>
          <TextArea value={dishes} onChange={(e) => setDishes(e.target.value)} rows={4} />
        </Field>
        <details>
          <summary className="cursor-pointer text-sm font-medium">{t('meals.variants')}</summary>
          <p className="mt-1 text-xs text-ink/60 dark:text-paper/60">{t('meals.variantsHint')}</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {DIETS.filter((d) => d !== 'normal').map((diet) => (
              <Field key={diet} label={t(`diets.${diet}`)}>
                <TextArea
                  value={variants[diet] ?? ''}
                  onChange={(e) => setVariants({ ...variants, [diet]: e.target.value })}
                  rows={3}
                />
              </Field>
            ))}
          </div>
        </details>
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={busy}>
            {t('person.save')}
          </Button>
          <ErrorText>{error}</ErrorText>
        </div>
      </form>
    </Panel>
  );
}

/** Copies the previous week's menus into this week. */
export function CopyLastWeek({ orgId, from, to }: { orgId: number; from: string; to: string }) {
  const t = useT('meals');
  const { busy, act, confirm } = useAction();
  async function copy() {
    const ok = await confirm({
      title: t('copyTitle'),
      body: t('copyBody'),
      confirmLabel: t('copy'),
    });
    if (ok) {
      await act(() => callApi(`/orgs/${orgId}/menus/copy`, 'POST', { from, to }), {
        success: t('copied'),
      });
    }
  }
  return (
    <Button type="button" variant="secondary" disabled={busy} onClick={copy}>
      {t('copy')}
    </Button>
  );
}

/** The residents' meal times with their windows: add, change, remove. */
export function MealTimes({ orgId, mealTimes }: { orgId: number; mealTimes: MealTime[] }) {
  const t = useT();
  const { busy, error, act, confirm } = useAction();
  const [form, setForm] = useState({ id: 0, name: '', starts: '08:00', ends: '08:30' });

  async function save(e: FormEvent) {
    e.preventDefault();
    const body = { name: form.name, starts: form.starts, ends: form.ends };
    const ok = await act(
      () =>
        form.id
          ? callApi(`/orgs/${orgId}/meal-times/${form.id}`, 'PATCH', body)
          : callApi(`/orgs/${orgId}/meal-times`, 'POST', body),
      { success: t('meals.timeSaved') },
    );
    if (ok) setForm({ id: 0, name: '', starts: '08:00', ends: '08:30' });
  }

  async function remove(m: MealTime) {
    const ok = await confirm({
      title: t('meals.removeTimeTitle', { name: m.name }),
      body: t('meals.removeTimeBody'),
      confirmLabel: t('staff.remove'),
      danger: true,
    });
    if (ok) {
      await act(() => callApi(`/orgs/${orgId}/meal-times/${m.id}`, 'DELETE'), {
        success: t('meals.timeRemoved'),
      });
    }
  }

  return (
    <Panel>
      <h2 className="font-semibold">{t('meals.timesTitle')}</h2>
      <p className="mt-1 text-xs text-ink/60 dark:text-paper/60">{t('meals.timesIntro')}</p>
      {mealTimes.length ? (
        <ul className="mt-3 space-y-1 text-sm">
          {mealTimes.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{m.name}</span>
              <span className="tabular-nums">
                {formatTime(m.startsMin)}–{formatTime(m.endsMin)}
              </span>
              <Button
                type="button"
                variant="ghost"
                onClick={() =>
                  setForm({
                    id: m.id,
                    name: m.name,
                    starts: formatTime(m.startsMin),
                    ends: formatTime(m.endsMin),
                  })
                }
              >
                {t('person.edit')}
              </Button>
              <Button type="button" variant="ghost" disabled={busy} onClick={() => remove(m)}>
                {t('staff.remove')}
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-ink/70 dark:text-paper/70">{t('meals.noTimes')}</p>
      )}
      <form onSubmit={save} className="mt-4 flex flex-wrap items-end gap-3">
        <Field label={t('fields.mealName')}>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            maxLength={40}
            required
          />
        </Field>
        <Field label={t('meals.from')}>
          <Input
            type="time"
            value={form.starts}
            onChange={(e) => setForm({ ...form, starts: e.target.value })}
            required
          />
        </Field>
        <Field label={t('meals.to')}>
          <Input
            type="time"
            value={form.ends}
            onChange={(e) => setForm({ ...form, ends: e.target.value })}
            required
          />
        </Field>
        <Button type="submit" disabled={busy}>
          {form.id ? t('person.save') : t('incidents.add')}
        </Button>
        {form.id ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() => setForm({ id: 0, name: '', starts: '08:00', ends: '08:30' })}
          >
            {t('feedback.cancel')}
          </Button>
        ) : null}
      </form>
      <ErrorText>{error}</ErrorText>
    </Panel>
  );
}

/** Opens the browser's print dialog (the kitchen sheet and its labels). */
export function PrintButton() {
  const t = useT('kitchen');
  return (
    <Button type="button" variant="secondary" onClick={() => window.print()}>
      {t('print')}
    </Button>
  );
}
