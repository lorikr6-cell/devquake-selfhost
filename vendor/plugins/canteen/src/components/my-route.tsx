'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { Button, cn, useT } from '@devquake/ui';
import { dishLines, formatTime } from '../lib/meals';
import type { Diet } from '../lib/model';
import type { DayRoute } from '../lib/routes-data';
import { callApi } from './call-api';
import { TextArea } from './ui';
import { useAction } from './use-action';

// Leaflet needs the browser; the map is loaded only when it is opened.
const RouteMap = dynamic(() => import('./route-map').then((m) => m.RouteMap), { ssr: false });

interface Packages {
  menu: string | null;
  variants: Partial<Record<Diet, string>>;
}

/**
 * The driver's stops for the day, large enough to use on a phone: what is in each package, a
 * tick when it is handed over and a comment for the organisers. Their planner refreshes by
 * itself within seconds (ADR 0041).
 */
export function MyRoute({
  orgId,
  day,
  route,
  packages,
}: {
  orgId: number;
  day: string;
  route: DayRoute;
  packages: Packages;
}) {
  const t = useT();
  const [view, setView] = useState<'list' | 'map'>('list');
  const done = route.stops.filter((s) => s.deliveredAt).length;
  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">
          {t('myRoute.progress', { done, total: route.stops.length })}
        </p>
        <div role="group" aria-label={t('myRoute.view')} className="flex gap-1">
          {(['list', 'map'] as const).map((v) => (
            <Button
              key={v}
              type="button"
              variant={view === v ? 'primary' : 'ghost'}
              aria-pressed={view === v}
              onClick={() => setView(v)}
            >
              {t(`myRoute.${v}`)}
            </Button>
          ))}
        </div>
      </div>
      {view === 'map' ? <RouteMap orgId={orgId} day={day} route={route} /> : null}
      <ol className={view === 'map' ? 'hidden' : 'space-y-3'}>
        {route.stops.map((s, i) => (
          <Stop
            key={s.id}
            orgId={orgId}
            day={day}
            index={i}
            stop={s}
            contents={packages.variants[s.diet] ?? packages.menu}
          />
        ))}
      </ol>
    </>
  );
}

function Stop({
  orgId,
  day,
  index,
  stop: s,
  contents,
}: {
  orgId: number;
  day: string;
  index: number;
  stop: DayRoute['stops'][number];
  contents: string | null;
}) {
  const t = useT();
  const [note, setNote] = useState(s.deliveryNote ?? '');
  const { busy, act } = useAction();
  const path = `/orgs/${orgId}/routes/${day}/stops/${s.id}`;

  const tick = (delivered: boolean) =>
    act(() => callApi(path, 'PUT', { delivered }), {
      success: delivered ? t('myRoute.ticked') : t('myRoute.unticked'),
    });
  const saveNote = () =>
    act(() => callApi(path, 'PUT', { note }), { success: t('myRoute.commentSaved') });

  return (
    <li
      className={cn(
        'rounded-xl border p-4',
        s.deliveredAt
          ? 'border-emerald-400 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/40'
          : 'border-ink/10 bg-white/70 dark:border-paper/10 dark:bg-paper/5',
      )}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-lg font-semibold">
          {index + 1}. {s.name}
        </span>
        <span className="font-mono text-sm tabular-nums">{formatTime(s.etaMin)}</span>
      </div>
      <p className="mt-1">{s.address}</p>
      {s.phone ? (
        <a href={`tel:${s.phone.replace(/\s/g, '')}`} className="mt-1 inline-block underline">
          {s.phone}
        </a>
      ) : null}
      {s.observation ? (
        <p className="mt-2 rounded-md bg-quake/10 px-2 py-1 text-sm whitespace-pre-line">
          {s.observation}
        </p>
      ) : null}
      <div className="mt-2 rounded-md border border-ink/10 px-2 py-1 text-sm dark:border-paper/10">
        <span className="font-medium">{t('myRoute.package')}: </span>
        {t(`diets.${s.diet}`)}
        {contents ? ` · ${dishLines(contents).join(' · ')}` : ` · ${t('myRoute.noMenu')}`}
        {s.allergies ? (
          <span className="block font-medium text-red-700 dark:text-red-400">⚠ {s.allergies}</span>
        ) : null}
      </div>
      <Button
        type="button"
        className="mt-3 w-full py-3 text-base"
        variant={s.deliveredAt ? 'secondary' : 'primary'}
        disabled={busy}
        onClick={() => tick(!s.deliveredAt)}
      >
        {s.deliveredAt
          ? `✓ ${t('myRoute.delivered')} · ${t('myRoute.undo')}`
          : t('myRoute.markDelivered')}
      </Button>
      <label className="mt-3 block text-sm">
        <span className="mb-1 block font-medium">{t('fields.deliveryNote')}</span>
        <TextArea value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} rows={2} />
      </label>
      {note !== (s.deliveryNote ?? '') ? (
        <Button
          type="button"
          variant="secondary"
          className="mt-2"
          disabled={busy}
          onClick={saveNote}
        >
          {t('myRoute.saveComment')}
        </Button>
      ) : null}
    </li>
  );
}
