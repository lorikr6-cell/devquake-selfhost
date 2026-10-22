'use client';

import { useState, type FormEvent } from 'react';
import { Button, LOCALE_TAGS, cn, formatDateTime, useLocale, useT } from '@devquake/ui';
import { formatTime } from '../lib/meals';
import { fitsAtEnd, move } from '../lib/routes';
import type { DayPlan, Driver, StopPerson } from '../lib/routes-data';
import { callApi } from './call-api';
import { ErrorText, Field, Input, Panel } from './ui';
import { useFeedback } from './feedback';
import { useAction } from './use-action';

/** Short weekday names in the page language (19 October 2026 is a Monday). */
function useWeekday() {
  const tag = LOCALE_TAGS[useLocale()];
  return (d: number) =>
    new Date(Date.UTC(2026, 9, 18 + d)).toLocaleDateString(tag, {
      weekday: 'short',
      timeZone: 'UTC',
    });
}

const windowText = (p: StopPerson) =>
  p.window.fromMin !== null && p.window.toMin !== null
    ? `${formatTime(p.window.fromMin)}–${formatTime(p.window.toMin)}`
    : '';

const EMPTY_DRIVER = {
  id: 0,
  name: '',
  phone: '',
  userId: '',
  weekdays: [1, 2, 3, 4, 5],
  shiftFrom: '11:00',
  shiftTo: '14:00',
  active: true,
};

/** The organisation's drivers, their days and shifts, and the minutes a stop takes. */
export function Drivers({
  orgId,
  drivers,
  minutesPerStop,
  accounts,
  kitchen,
}: {
  orgId: number;
  drivers: Driver[];
  minutesPerStop: number;
  /** Where the routes start, for computing the order from the map. */
  kitchen: string | null;
  /** Staff with the driver role, to link a driver to their phone. */
  accounts: { userId: number; name: string }[];
}) {
  const t = useT();
  const weekday = useWeekday();
  const [form, setForm] = useState(EMPTY_DRIVER);
  const [perStop, setPerStop] = useState(String(minutesPerStop));
  const [kitchenAddress, setKitchenAddress] = useState(kitchen ?? '');
  const { busy, error, act, confirm } = useAction();

  async function save(e: FormEvent) {
    e.preventDefault();
    const body = {
      name: form.name,
      phone: form.phone,
      userId: form.userId ? Number(form.userId) : null,
      weekdays: form.weekdays,
      shiftFrom: form.shiftFrom,
      shiftTo: form.shiftTo,
      active: form.active,
    };
    const ok = await act(
      () =>
        form.id
          ? callApi(`/orgs/${orgId}/drivers/${form.id}`, 'PATCH', body)
          : callApi(`/orgs/${orgId}/drivers`, 'POST', body),
      { success: t('routes.driverSaved') },
    );
    if (ok) setForm(EMPTY_DRIVER);
  }

  async function remove(d: Driver) {
    const ok = await confirm({
      title: t('routes.removeDriverTitle', { name: d.name }),
      body: t('routes.removeDriverBody'),
      confirmLabel: t('staff.remove'),
      danger: true,
    });
    if (ok) {
      await act(() => callApi(`/orgs/${orgId}/drivers/${d.id}`, 'DELETE'), {
        success: t('routes.driverRemoved'),
      });
    }
  }

  return (
    <Panel>
      <h2 className="font-semibold">{t('routes.driversTitle')}</h2>
      <p className="mt-1 text-xs text-ink/60 dark:text-paper/60">{t('routes.driversIntro')}</p>
      {drivers.length ? (
        <ul className="mt-3 space-y-1 text-sm">
          {drivers.map((d) => (
            <li
              key={d.id}
              className={cn('flex flex-wrap items-center gap-2', !d.active && 'opacity-60')}
            >
              <span className="font-medium">{d.name}</span>
              <span className="text-xs text-ink/60 dark:text-paper/60">
                {d.weekdays.map(weekday).join(' ')} · {formatTime(d.shiftFromMin)}–
                {formatTime(d.shiftToMin)}
                {d.active ? '' : ` · ${t('routes.inactive')}`}
              </span>
              <Button
                type="button"
                variant="ghost"
                onClick={() =>
                  setForm({
                    id: d.id,
                    name: d.name,
                    phone: d.phone ?? '',
                    userId: d.userId === null ? '' : String(d.userId),
                    weekdays: d.weekdays,
                    shiftFrom: formatTime(d.shiftFromMin),
                    shiftTo: formatTime(d.shiftToMin),
                    active: d.active,
                  })
                }
              >
                {t('person.edit')}
              </Button>
              <Button type="button" variant="ghost" disabled={busy} onClick={() => remove(d)}>
                {t('staff.remove')}
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-ink/70 dark:text-paper/70">{t('routes.noDrivers')}</p>
      )}
      <form onSubmit={save} className="mt-4 grid gap-3 sm:grid-cols-2">
        <Field label={t('fields.driverName')}>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            maxLength={80}
            required
          />
        </Field>
        <Field label={t('fields.phone')}>
          <Input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            maxLength={40}
          />
        </Field>
        <Field label={t('routes.account')} hint={t('routes.accountHint')} className="sm:col-span-2">
          <select
            value={form.userId}
            onChange={(e) => setForm({ ...form, userId: e.target.value })}
            className="w-full rounded-md border border-ink/15 bg-white px-3 py-2 text-sm dark:border-paper/15 dark:bg-ink"
          >
            <option value="">{t('routes.noAccount')}</option>
            {accounts.map((a) => (
              <option key={a.userId} value={a.userId}>
                {a.name}
              </option>
            ))}
          </select>
        </Field>
        <fieldset className="sm:col-span-2">
          <legend className="mb-1 text-sm font-medium">{t('routes.days')}</legend>
          <div className="flex flex-wrap gap-3">
            {[1, 2, 3, 4, 5, 6, 7].map((d) => (
              <label key={d} className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="size-4 accent-[var(--dq-quake)]"
                  checked={form.weekdays.includes(d)}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      weekdays: e.target.checked
                        ? [...form.weekdays, d].sort((a, b) => a - b)
                        : form.weekdays.filter((x) => x !== d),
                    })
                  }
                />
                {weekday(d)}
              </label>
            ))}
          </div>
        </fieldset>
        <Field label={t('routes.shiftFrom')}>
          <Input
            type="time"
            value={form.shiftFrom}
            onChange={(e) => setForm({ ...form, shiftFrom: e.target.value })}
            required
          />
        </Field>
        <Field label={t('routes.shiftTo')}>
          <Input
            type="time"
            value={form.shiftTo}
            onChange={(e) => setForm({ ...form, shiftTo: e.target.value })}
            required
          />
        </Field>
        <label className="inline-flex items-center gap-2 text-sm sm:col-span-2">
          <input
            type="checkbox"
            className="size-4 accent-[var(--dq-quake)]"
            checked={form.active}
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
          />
          {t('routes.active')}
        </label>
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          <Button type="submit" disabled={busy}>
            {form.id ? t('person.save') : t('routes.addDriver')}
          </Button>
          {form.id ? (
            <Button type="button" variant="ghost" onClick={() => setForm(EMPTY_DRIVER)}>
              {t('feedback.cancel')}
            </Button>
          ) : null}
          <ErrorText>{error}</ErrorText>
        </div>
      </form>
      <form
        className="mt-6 flex flex-wrap items-end gap-3 border-t border-ink/10 pt-4 dark:border-paper/10"
        onSubmit={(e) => {
          e.preventDefault();
          void act(
            () =>
              callApi(`/orgs/${orgId}/route-settings`, 'PUT', {
                minutesPerStop: Number(perStop),
                kitchenAddress,
              }),
            { success: t('routes.perStopSaved') },
          );
        }}
      >
        <Field label={t('routes.minutesPerStop')} hint={t('routes.minutesPerStopHint')}>
          <Input
            type="number"
            min={2}
            max={60}
            value={perStop}
            onChange={(e) => setPerStop(e.target.value)}
            className="w-24"
          />
        </Field>
        <Field
          label={t('routes.kitchen')}
          hint={t('routes.kitchenHint')}
          className="min-w-64 flex-1"
        >
          <Input
            value={kitchenAddress}
            onChange={(e) => setKitchenAddress(e.target.value)}
            maxLength={255}
          />
        </Field>
        <Button type="submit" variant="secondary" disabled={busy}>
          {t('person.save')}
        </Button>
      </form>
    </Panel>
  );
}

/**
 * One day's routes: the people still to place, each driver's route in order with estimated
 * arrivals, and for every person the routes where they still fit (green) or not (grey).
 */
export function DayPlanner({
  orgId,
  plan,
  canOptimise,
  timeZone,
}: {
  orgId: number;
  plan: DayPlan;
  timeZone: string;
  /** The map service is set up (CANTEEN_ORS_KEY): routes can get their order from it. */
  canOptimise: boolean;
}) {
  const t = useT();
  const { busy, act, confirm } = useAction();
  const { toast } = useFeedback();
  const locale = useLocale();
  const path = `/orgs/${orgId}/routes/${plan.day}`;

  const save = (driverId: number, personIds: number[]) =>
    act(() => callApi(path, 'PUT', { driverId, personIds }), { success: t('routes.saved') });

  const fits = (driverId: number, person: StopPerson) => {
    const route = plan.routes.find((r) => r.driver.id === driverId)!;
    return fitsAtEnd(
      route.stops.map((s) => ({ personId: s.id, window: s.window })),
      { personId: person.id, window: person.window },
      { fromMin: route.driver.shiftFromMin, toMin: route.driver.shiftToMin },
      plan.minutesPerStop,
    );
  };

  async function computeOrder(driverId: number) {
    let unassigned = 0;
    const ok = await act(async () => {
      const answer = await callApi<{ unassigned: number }>(`${path}/optimise`, 'POST', {
        driverId,
      });
      unassigned = answer?.unassigned ?? 0;
    });
    if (ok) {
      toast(
        unassigned ? t('routes.orderedLate', { count: unassigned }) : t('routes.ordered'),
        unassigned ? 'error' : 'success',
      );
    }
  }

  async function copy() {
    const ok = await confirm({
      title: t('routes.copyTitle'),
      body: t('routes.copyBody'),
      confirmLabel: t('routes.copy'),
    });
    if (ok) await act(() => callApi(`${path}/copy`, 'POST'), { success: t('routes.copied') });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" disabled={busy} onClick={copy}>
          {t('routes.copy')}
        </Button>
      </div>

      {plan.routes.length === 0 ? (
        <p className="text-sm text-ink/70 dark:text-paper/70">{t('routes.noDriversToday')}</p>
      ) : null}

      <Panel>
        <h2 className="font-semibold">
          {t('routes.unassigned', { count: plan.unassigned.length })}
        </h2>
        {plan.unassigned.length === 0 ? (
          <p className="mt-2 text-sm text-ink/70 dark:text-paper/70">{t('routes.allPlaced')}</p>
        ) : (
          <ul className="mt-3 divide-y divide-ink/10 dark:divide-paper/10">
            {plan.unassigned.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-2 py-2 text-sm">
                <span className="min-w-0 flex-1">
                  <span className="font-medium">{p.name}</span>
                  <span className="block text-xs text-ink/60 dark:text-paper/60">
                    {p.address}
                    {windowText(p) ? ` · ${windowText(p)}` : ''}
                  </span>
                </span>
                {plan.routes.map((r) => {
                  const ok = fits(r.driver.id, p);
                  return (
                    <Button
                      key={r.driver.id}
                      type="button"
                      variant="ghost"
                      disabled={busy}
                      title={ok ? t('routes.fits') : t('routes.doesNotFit')}
                      className={cn(
                        'border',
                        ok
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-950 dark:bg-emerald-950 dark:text-emerald-100'
                          : 'border-ink/15 text-ink/50 dark:border-paper/15 dark:text-paper/50',
                      )}
                      onClick={() => save(r.driver.id, [...r.stops.map((s) => s.id), p.id])}
                    >
                      + {r.driver.name}
                    </Button>
                  );
                })}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        {plan.routes.map((r) => {
          const ids = r.stops.map((s) => s.id);
          return (
            <Panel key={r.driver.id}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-semibold">{r.driver.name}</h2>
                <span className="text-xs text-ink/60 dark:text-paper/60">
                  {formatTime(r.driver.shiftFromMin)}–{formatTime(r.driver.shiftToMin)} ·{' '}
                  {t('routes.stops', { count: r.stops.length })}
                </span>
              </div>
              <div className="mt-1 text-xs font-medium">
                {t('myRoute.progress', {
                  done: r.stops.filter((s) => s.deliveredAt).length,
                  total: r.stops.length,
                })}
              </div>
              {canOptimise && r.stops.length > 1 ? (
                <Button
                  type="button"
                  variant="secondary"
                  className="mt-2"
                  disabled={busy}
                  onClick={() => computeOrder(r.driver.id)}
                >
                  {t('routes.computeOrder')}
                </Button>
              ) : null}
              {!r.ok ? (
                <p className="mt-2 rounded-md bg-amber-100 px-2 py-1 text-xs text-amber-950 dark:bg-amber-900/60 dark:text-amber-100">
                  {t('routes.late')}
                </p>
              ) : null}
              <ol className="mt-3 space-y-2">
                {r.stops.map((s, i) => (
                  <li key={s.id} className="flex items-start gap-2 text-sm">
                    <span
                      className={cn(
                        'w-12 shrink-0 font-mono tabular-nums',
                        (!s.inWindow || !s.inShift) &&
                          'font-semibold text-red-700 dark:text-red-400',
                      )}
                    >
                      {formatTime(s.etaMin)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="font-medium">
                        {i + 1}. {s.name}
                        {s.deliveredAt ? (
                          <span className="ml-1 text-emerald-700 dark:text-emerald-400">
                            ✓{' '}
                            {t('routes.deliveredAt', {
                              time: formatDateTime(s.deliveredAt, timeZone, 'time', locale),
                            })}
                          </span>
                        ) : null}
                        {s.deliveryNote ? (
                          <span className="block text-xs font-normal italic">
                            “{s.deliveryNote}”
                          </span>
                        ) : null}
                      </span>
                      <span className="block text-xs text-ink/60 dark:text-paper/60">
                        {s.address}
                        {windowText(s) ? ` · ${windowText(s)}` : ''}
                      </span>
                    </span>
                    <span className="flex shrink-0 gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={busy || i === 0}
                        aria-label={t('routes.up')}
                        onClick={() => save(r.driver.id, move(ids, i, i - 1))}
                      >
                        ↑
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={busy || i === ids.length - 1}
                        aria-label={t('routes.down')}
                        onClick={() => save(r.driver.id, move(ids, i, i + 1))}
                      >
                        ↓
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={busy}
                        aria-label={t('routes.takeOff')}
                        onClick={() =>
                          act(() => callApi(`${path}/stops/${s.id}`, 'DELETE'), {
                            success: t('routes.saved'),
                          })
                        }
                      >
                        ×
                      </Button>
                    </span>
                  </li>
                ))}
              </ol>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
