'use client';

import { useEffect, useRef, useState } from 'react';
import { useT } from '@devquake/ui';
import type { GuestOrder } from '../lib/guest-orders';
import { formatMinor } from '../lib/model';
import { ding } from './calls-panel';
import { call as api, errorText } from './client';

/**
 * Guests' orders waiting for a waiter (owner's decision: the waiter confirms each): what was
 * asked for, Confirm (onto the bill and to the kitchen and bar) or Refuse. Rings for new ones.
 */
export function OrdersPanel({
  orders,
  onChange,
  currency,
  decimals,
}: {
  orders: GuestOrder[];
  onChange: (orders: GuestOrder[]) => void;
  currency: string;
  decimals: number;
}) {
  const t = useT('order');
  const seen = useRef<Set<number> | null>(null);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  useEffect(() => {
    if (seen.current && orders.some((o) => !seen.current!.has(o.id))) ding();
    seen.current = new Set(orders.map((o) => o.id));
  }, [orders]);

  if (!orders.length && !message) return null;
  async function answer(id: number, confirm: boolean) {
    setBusy(id);
    setMessage(null);
    try {
      const r = await api<{ orders: GuestOrder[]; skipped: string[] }>(
        `/api/floor/orders/${id}`,
        'PUT',
        { confirm },
        t('failed'),
      );
      onChange(r.orders);
      setMessage({
        text: r.skipped.length
          ? t('skipped', { names: r.skipped.join(', ') })
          : confirm
            ? t('confirmed')
            : t('refused'),
        ok: r.skipped.length === 0,
      });
    } catch (err) {
      setMessage({ text: errorText(err, t('failed')), ok: false });
    } finally {
      setBusy(null);
    }
  }
  return (
    <section
      className="rounded-xl border-2 border-sky-600 bg-sky-50 p-3 dark:bg-sky-950/30"
      aria-live="polite"
    >
      {orders.length ? (
        <h2 className="mb-2 font-semibold">🧾 {t('waiting', { count: orders.length })}</h2>
      ) : null}
      <ul className="space-y-3">
        {orders.map((o) => (
          <li key={o.id} className="space-y-1">
            <p className="text-lg font-bold">{o.tableName}</p>
            <ul className="text-sm">
              {o.lines.map((l) => (
                <li key={l.itemId}>
                  {l.qty} × {l.name}{' '}
                  <span className="opacity-60">
                    {formatMinor(l.priceMinor * l.qty, decimals)} {currency}
                  </span>
                  {l.note ? <span className="block text-xs italic">“{l.note}”</span> : null}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                disabled={busy === o.id}
                onClick={() => void answer(o.id, true)}
                className="rounded-md bg-ink px-3 py-1.5 text-sm font-medium text-paper disabled:opacity-50 dark:bg-paper dark:text-ink"
              >
                {t('confirm')}
              </button>
              <button
                type="button"
                disabled={busy === o.id}
                onClick={() => void answer(o.id, false)}
                className="rounded-md border border-ink/20 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-paper/20"
              >
                {t('refuse')}
              </button>
            </div>
          </li>
        ))}
      </ul>
      {message ? (
        <p className={`mt-2 text-sm ${message.ok ? '' : 'text-red-700 dark:text-red-400'}`}>
          {message.text}
        </p>
      ) : null}
    </section>
  );
}
