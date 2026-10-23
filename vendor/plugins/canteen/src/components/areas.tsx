'use client';

import { useMemo, useState } from 'react';
import { Button, Link, buttonClass, useT } from '@devquake/ui';
import type { AreaPlan } from '../lib/areas-data';
import { addDays } from '../lib/dates';
import { callApi } from './call-api';
import { ErrorText, Field, Input, Panel, Select } from './ui';
import { useAction } from './use-action';

type Areas = Record<number, number | null>;

/**
 * Who delivers to whom: a proposal from the addresses (areas that do not overlap), changed by
 * moving a person to another driver, saved; then each day's routes of a span built from it, and
 * the route sheets of a day, a week or a month printed.
 */
export function AreasEditor({
  orgId,
  plan,
  today,
}: {
  orgId: number;
  plan: AreaPlan;
  today: string;
}) {
  const t = useT();
  const saved = useMemo<Areas>(
    () => Object.fromEntries(plan.people.map((p) => [p.id, p.areaDriverId])),
    [plan.people],
  );
  const [areas, setAreas] = useState<Areas>(saved);
  const [proposed, setProposed] = useState(false);
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(addDays(today, 6));
  const [printDriver, setPrintDriver] = useState('');
  const { busy, error, act, confirm } = useAction();
  const changed = plan.people.filter((p) => (areas[p.id] ?? null) !== (saved[p.id] ?? null));
  const missing = plan.people.filter((p) => p.address && !p.located).length;
  const groups = [
    ...plan.drivers.map((d) => ({ id: d.id as number | null, name: d.name })),
    { id: null, name: t('areas.noArea') },
  ];

  async function propose() {
    await act(
      async () => {
        const res = await callApi<{ areas: Record<string, number> }>(
          `/orgs/${orgId}/areas/propose`,
          'POST',
          {},
        );
        // Keep people the proposal could not place (no map position) where they were.
        setAreas((now) => ({ ...now, ...(res?.areas ?? {}) }));
        setProposed(true);
      },
      { success: t('areas.proposed'), after: () => undefined },
    );
  }

  async function save() {
    await act(
      () =>
        callApi(`/orgs/${orgId}/areas`, 'PUT', {
          areas: Object.fromEntries(changed.map((p) => [p.id, areas[p.id] ?? null])),
        }),
      { success: t('areas.saved', { count: changed.length }) },
    );
    setProposed(false);
  }

  async function build() {
    const ok = await confirm({
      title: t('areas.buildTitle'),
      body: t('areas.buildBody'),
      confirmLabel: t('areas.build'),
    });
    if (!ok) return;
    await act(
      async () => {
        const res = await callApi<{ days: number; toPlace: number }>(
          `/orgs/${orgId}/areas/build`,
          'POST',
          { from, to },
        );
        if (res?.toPlace) throw new Error(t('areas.builtToPlace', { count: res.toPlace }));
      },
      { success: t('areas.built') },
    );
  }

  const printUrl = (span: number) =>
    `/orgs/${orgId}/routes/print?from=${from}&to=${addDays(from, span - 1)}${printDriver ? `&driver=${printDriver}` : ''}`;

  return (
    <div className="space-y-6">
      <Panel>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" onClick={propose} disabled={busy || plan.drivers.length === 0}>
            {t('areas.propose')}
          </Button>
          {plan.mapReady && missing > 0 ? (
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={() =>
                act(() => callApi(`/orgs/${orgId}/areas/locate`, 'POST', {}), {
                  success: t('areas.located'),
                })
              }
            >
              {t('areas.locate', { count: missing })}
            </Button>
          ) : null}
          <Button
            type="button"
            variant="secondary"
            disabled={busy || changed.length === 0}
            onClick={save}
          >
            {t('areas.save', { count: changed.length })}
          </Button>
          {changed.length ? (
            <Button type="button" variant="ghost" onClick={() => setAreas(saved)}>
              {t('areas.undo')}
            </Button>
          ) : null}
        </div>
        <p className="mt-2 text-xs text-ink/60 dark:text-paper/60">
          {proposed ? t('areas.previewHint') : t('areas.proposeHint')}
          {missing > 0 && !plan.mapReady ? ` ${t('areas.noMap', { count: missing })}` : ''}
        </p>
        <ErrorText>{error}</ErrorText>
      </Panel>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {groups.map((g) => {
          const members = plan.people.filter((p) => (areas[p.id] ?? null) === g.id);
          return (
            <Panel key={g.id ?? 'none'}>
              <h2 className="font-semibold">
                {g.name}{' '}
                <span className="font-normal text-ink/60 dark:text-paper/60">
                  ({members.length})
                </span>
              </h2>
              {members.length === 0 ? (
                <p className="mt-2 text-sm text-ink/60 dark:text-paper/60">{t('staff.nobody')}</p>
              ) : (
                <ul className="mt-2 divide-y divide-ink/10 text-sm dark:divide-paper/10">
                  {members.map((p) => {
                    const moved = (areas[p.id] ?? null) !== (saved[p.id] ?? null);
                    return (
                      <li key={p.id} className="flex flex-wrap items-center gap-2 py-1.5">
                        <span className="min-w-0 flex-1">
                          <span className={moved ? 'font-semibold text-quake' : 'font-medium'}>
                            {p.name}
                          </span>
                          <span className="block text-xs text-ink/60 dark:text-paper/60">
                            {p.address ?? t('areas.noAddress')}
                            {p.address && !p.located ? ` · ${t('areas.notOnMap')}` : ''}
                          </span>
                        </span>
                        <Select
                          value={areas[p.id] ?? ''}
                          aria-label={t('areas.moveTo', { name: p.name })}
                          onChange={(e) =>
                            setAreas({
                              ...areas,
                              [p.id]: e.target.value === '' ? null : Number(e.target.value),
                            })
                          }
                          className="w-auto text-xs"
                        >
                          <option value="">{t('areas.noArea')}</option>
                          {plan.drivers.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name}
                            </option>
                          ))}
                        </Select>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Panel>
          );
        })}
      </div>

      <Panel>
        <h2 className="font-semibold">{t('areas.routesTitle')}</h2>
        <p className="mt-1 text-sm text-ink/70 dark:text-paper/70">{t('areas.routesIntro')}</p>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <Field label={t('areas.from')}>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} required />
          </Field>
          <Field label={t('areas.to')}>
            <Input
              type="date"
              value={to}
              min={from}
              max={addDays(from, 30)}
              onChange={(e) => setTo(e.target.value)}
              required
            />
          </Field>
          <Button type="button" onClick={build} disabled={busy || changed.length > 0}>
            {t('areas.build')}
          </Button>
        </div>
        {changed.length > 0 ? (
          <p className="mt-2 text-xs text-amber-800 dark:text-amber-300">{t('areas.saveFirst')}</p>
        ) : null}
        <div className="mt-5 flex flex-wrap items-end gap-3 border-t border-ink/10 pt-4 dark:border-paper/10">
          <Field label={t('areas.printFor')}>
            <Select value={printDriver} onChange={(e) => setPrintDriver(e.target.value)}>
              <option value="">{t('areas.allDrivers')}</option>
              {plan.drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </Field>
          <Link href={printUrl(1)} className={buttonClass('secondary')}>
            {t('areas.printDay')}
          </Link>
          <Link href={printUrl(7)} className={buttonClass('secondary')}>
            {t('areas.printWeek')}
          </Link>
          <Link href={printUrl(31)} className={buttonClass('secondary')}>
            {t('areas.printMonth')}
          </Link>
        </div>
      </Panel>
    </div>
  );
}
