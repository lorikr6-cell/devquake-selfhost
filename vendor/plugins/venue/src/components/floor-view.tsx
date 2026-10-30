'use client';

import { useCallback, useEffect, useState } from 'react';
import { Link, useT } from '@devquake/ui';
import { formatMinor } from '../lib/model';
import { call, errorText, fieldClass, primaryButton } from './client';
import { Status } from './status';

interface FloorTable {
  id: number;
  name: string;
  seats: number;
  code: string;
  bill: { id: number; code: string; openedBy: string; pending: number; gross: number } | null;
}

/** Refreshes while the page is visible (no timers in the background; hosting cost). */
export function useVisibleInterval(fn: () => void, ms: number) {
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === 'visible') fn();
    };
    const id = window.setInterval(tick, ms);
    document.addEventListener('visibilitychange', tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [fn, ms]);
}

/** On a tablet: who switches in, with their PIN (ADR 0080). */
export function StaffPicker({
  staff,
  onDone,
}: {
  staff: { id: number; name: string }[];
  onDone: () => void;
}) {
  const t = useT('floor');
  const [picked, setPicked] = useState<number | null>(null);
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [q, setQ] = useState('');
  const shown = staff.filter((s) => s.name.toLowerCase().includes(q.trim().toLowerCase()));

  async function enter() {
    setBusy(true);
    setMessage(null);
    try {
      await call('/api/floor/session', 'POST', { staffId: picked, pin }, t('failed'));
      setPin('');
      onDone();
    } catch (err) {
      setMessage({ text: errorText(err, t('failed')), ok: false });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-4">
      <h2 className="text-xl font-semibold">{t('whoIsOn')}</h2>
      {staff.length > 6 ? (
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('searchStaff')}
          aria-label={t('searchStaff')}
          className={fieldClass}
        />
      ) : null}
      <div className="grid grid-cols-2 gap-2">
        {shown.map((s) => (
          <button
            key={s.id}
            type="button"
            aria-pressed={picked === s.id}
            onClick={() => setPicked(s.id)}
            className={`rounded-lg border p-3 text-left font-medium ${
              picked === s.id
                ? 'border-quake ring-2 ring-quake'
                : 'border-ink/15 dark:border-paper/20'
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>
      {picked !== null ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void enter();
          }}
          className="flex flex-wrap items-end gap-3"
        >
          <label className="text-sm font-medium">
            {t('pin')}
            <input
              type="password"
              inputMode="numeric"
              autoComplete="off"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              autoFocus
              className={`${fieldClass} text-2xl tracking-[0.4em]`}
            />
          </label>
          <button type="submit" disabled={busy || pin.length < 4} className={primaryButton}>
            {t('enter')}
          </button>
        </form>
      ) : null}
      <Status message={message} />
    </div>
  );
}

/**
 * The floor: every table, free or with its open bill (who opened it, what is still to bring, the
 * amount so far), refreshed every 10 seconds; a search bar finds a table by name.
 */
export function FloorView({
  initial,
  currency,
  decimals,
  actorName,
  onTablet,
}: {
  initial: FloorTable[];
  currency: string;
  decimals: number;
  actorName: string;
  onTablet: boolean;
}) {
  const t = useT('floor');
  const [tables, setTables] = useState(initial);
  const [q, setQ] = useState('');
  const refresh = useCallback(async () => {
    const res = await fetch('/api/floor/tables', { cache: 'no-store' }).catch(() => null);
    if (!res?.ok) return;
    const data = (await res.json()) as { tables: FloorTable[] };
    setTables(data.tables);
  }, []);
  useVisibleInterval(refresh, 10_000);
  const query = q.trim().toLowerCase();
  const shown = tables.filter((x) => !query || x.name.toLowerCase().includes(query));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('searchTables')}
          aria-label={t('searchTables')}
          className={`${fieldClass} mt-0 max-w-xs`}
        />
        <span className="text-sm text-ink/60 dark:text-paper/60">
          {t('on', { name: actorName })}
        </span>
        {onTablet ? (
          <button
            type="button"
            className="text-sm underline"
            onClick={async () => {
              await call('/api/floor/session', 'DELETE', undefined, t('failed')).catch(() => null);
              window.location.reload();
            }}
          >
            {t('switch')}
          </button>
        ) : null}
      </div>
      {tables.length ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {shown.map((x) => (
            <li key={x.id}>
              <Link
                href={`/t/${x.code}`}
                className={`block rounded-xl border-2 p-4 ${
                  x.bill
                    ? x.bill.pending
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30'
                      : 'border-quake bg-quake/5'
                    : 'border-ink/10 dark:border-paper/15'
                }`}
              >
                <span className="block text-lg font-semibold">{x.name}</span>
                <span className="block text-sm text-ink/70 dark:text-paper/70">
                  {x.bill
                    ? `${formatMinor(x.bill.gross, decimals)} ${currency}`
                    : t('free', { seats: x.seats })}
                </span>
                {x.bill ? (
                  <span className="mt-1 block text-xs">
                    {x.bill.pending ? t('toBring', { count: x.bill.pending }) : t('allBrought')}
                    {' · '}
                    {x.bill.openedBy}
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-ink/70 dark:text-paper/70">{t('noTables')}</p>
      )}
    </div>
  );
}
