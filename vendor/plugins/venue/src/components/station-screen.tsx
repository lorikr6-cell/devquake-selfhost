'use client';

import { useCallback, useEffect, useState } from 'react';
import { useT } from '@devquake/ui';
import type { StationTicket } from '../lib/station';
import { call, errorText, fieldClass } from './client';
import { useVisibleInterval } from './floor-view';
import { Status } from './status';

const minutesSince = (iso: string, now: number) =>
  Math.max(0, Math.floor((now - Date.parse(iso)) / 60_000));

/**
 * A station's screen (kitchen, bar or coffee): one ticket per table, oldest first, each line with
 * its note and how long it has waited; tap a line or the whole ticket when it is made. Refreshes
 * every 8 seconds while the screen is visible; a search bar finds a table or a dish.
 */
export function StationScreen({
  station,
  initial,
}: {
  station: 'kitchen' | 'bar' | 'coffee';
  initial: StationTicket[];
}) {
  const t = useT('station');
  const [tickets, setTickets] = useState(initial);
  const [now, setNow] = useState(() => Date.now());
  const [q, setQ] = useState('');
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const url = `/api/floor/station/${station}`;

  const refresh = useCallback(async () => {
    setNow(Date.now());
    const res = await fetch(url, { cache: 'no-store' }).catch(() => null);
    if (res?.ok) setTickets(((await res.json()) as { tickets: StationTicket[] }).tickets);
  }, [url]);
  useVisibleInterval(refresh, 8_000);
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  async function made(body: { lineId: number } | { billId: number }) {
    setMessage(null);
    try {
      const r = await call<{ tickets: StationTicket[] }>(url, 'POST', body, t('failed'));
      setTickets(r.tickets);
    } catch (err) {
      setMessage({ text: errorText(err, t('failed')), ok: false });
    }
  }

  const query = q.trim().toLowerCase();
  const shown = tickets.filter(
    (x) =>
      !query ||
      (x.tableName ?? '').toLowerCase().includes(query) ||
      x.lines.some((l) => l.name.toLowerCase().includes(query)),
  );

  return (
    <div className="space-y-4">
      {tickets.length > 4 ? (
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('search')}
          aria-label={t('search')}
          className={`${fieldClass} mt-0 max-w-xs`}
        />
      ) : null}
      <Status message={message} />
      {shown.length ? (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((x) => {
            const age = minutesSince(x.since, now);
            const late = age >= 15;
            return (
              <li
                key={x.billId}
                className={`rounded-xl border-2 p-4 ${late ? 'border-red-600 bg-red-50 dark:bg-red-950/30' : age >= 8 ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30' : 'border-ink/15 dark:border-paper/20'}`}
              >
                <div className="mb-2 flex items-baseline justify-between gap-3">
                  <span className="text-xl font-bold">{x.tableName ?? t('counter')}</span>
                  <span
                    className={`tabular-nums ${late ? 'font-bold text-red-700 dark:text-red-400' : ''}`}
                  >
                    {t('minutes', { count: age })}
                  </span>
                </div>
                <ul className="space-y-2">
                  {x.lines.map((l) => (
                    <li key={l.id}>
                      <button
                        type="button"
                        onClick={() => void made({ lineId: l.id })}
                        className="flex w-full items-baseline gap-2 rounded-md p-2 text-left hover:bg-ink/5 dark:hover:bg-paper/10"
                      >
                        <span className="text-lg font-semibold">
                          {l.qty - l.ready}× {l.name}
                        </span>
                        {l.note ? <span className="text-sm italic">“{l.note}”</span> : null}
                        <span className="ml-auto text-xs opacity-60">{l.addedBy}</span>
                      </button>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => void made({ billId: x.billId })}
                  className="mt-3 w-full rounded-md bg-quake px-4 py-2 font-medium text-white"
                >
                  ✓ {t('allReady')}
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="py-12 text-center text-lg text-ink/60 dark:text-paper/60">{t('nothing')}</p>
      )}
    </div>
  );
}
