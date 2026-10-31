'use client';

import { useCallback, useMemo, useState } from 'react';
import { useT } from '@devquake/ui';
import { formatMinor } from '../lib/model';
import { errorText } from './client';
import { useVisibleInterval } from './floor-view';

export interface OrderableItem {
  id: number;
  name: string;
  category: string;
  priceMinor: number;
  /** Why it cannot be ordered now (off the menu, out of stock), or null. */
  why: string | null;
}

interface OrderView {
  status: 'waiting' | 'confirmed' | 'refused';
  at: string;
  by: string | null;
  lines: { name: string; qty: number }[];
}

/**
 * Guests order from the table (owner's decision: the waiter confirms each order): pick items
 * with + and −, a note per item, send; the order's state shows below (waiting, on its way,
 * refused), asked again every 10 s while waiting and the page is visible. No account.
 */
export function GuestOrder({
  code,
  items,
  currency,
  decimals,
  initial,
}: {
  code: string;
  items: OrderableItem[];
  currency: string;
  decimals: number;
  initial: OrderView | null;
}) {
  const t = useT('order');
  const [basket, setBasket] = useState<Record<number, { qty: number; note: string }>>({});
  const [order, setOrder] = useState(initial);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const money = (m: number) => `${formatMinor(m, decimals)} ${currency}`;

  const refresh = useCallback(async () => {
    if (order?.status !== 'waiting') return;
    const r = await fetch(`/api/guest-order/${code}`, { cache: 'no-store' }).catch(() => null);
    if (r?.ok) setOrder(((await r.json()) as { order: OrderView | null }).order);
  }, [code, order?.status]);
  useVisibleInterval(refresh, 10_000);

  const query = q.trim().toLowerCase();
  const shown = items.filter((i) => !query || i.name.toLowerCase().includes(query));
  const categories = useMemo(() => [...new Set(shown.map((i) => i.category))], [shown]);
  const chosen = items.filter((i) => basket[i.id]?.qty);
  const total = chosen.reduce((s, i) => s + i.priceMinor * basket[i.id]!.qty, 0);
  const change = (id: number, by: number) =>
    setBasket((b) => {
      const qty = Math.max(0, Math.min(10, (b[id]?.qty ?? 0) + by));
      return { ...b, [id]: { qty, note: b[id]?.note ?? '' } };
    });

  async function send() {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch(`/api/guest-order/${code}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          items: chosen.map((i) => ({
            itemId: i.id,
            qty: basket[i.id]!.qty,
            note: basket[i.id]!.note,
          })),
        }),
      });
      const data = (await r.json().catch(() => ({}))) as { order?: OrderView; error?: string };
      if (!r.ok || !data.order) throw new Error(data.error ?? t('failed'));
      setOrder(data.order);
      setBasket({});
    } catch (err) {
      setError(errorText(err, t('failed')));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      className="mt-6 space-y-4 rounded-xl border-2 border-sky-600/50 p-4"
      aria-labelledby="guest-order-title"
    >
      <h2 id="guest-order-title" className="font-display text-2xl font-bold">
        {t('guestTitle')}
      </h2>
      <p className="text-sm text-ink/70 dark:text-paper/70">{t('guestIntro')}</p>
      {order ? (
        <div className="rounded-lg bg-sky-50 p-3 text-sm dark:bg-sky-950/30" aria-live="polite">
          <p className="font-medium">
            {order.status === 'waiting'
              ? t('statusWaiting')
              : order.status === 'confirmed'
                ? t('statusConfirmed', { name: order.by ?? '' })
                : t('statusRefused')}
          </p>
          <p className="text-ink/70 dark:text-paper/70">
            {order.lines.map((l) => `${l.qty} × ${l.name}`).join(', ')}
          </p>
        </div>
      ) : null}
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t('search')}
        aria-label={t('search')}
        className="w-full max-w-xs rounded-md border border-ink/20 bg-white px-3 py-2 text-sm dark:border-paper/20 dark:bg-zinc-900"
      />
      {categories.map((c) => (
        <div key={c} className="space-y-1">
          <h3 className="text-sm font-semibold tracking-wide uppercase opacity-70">{c}</h3>
          <ul className="divide-y divide-ink/10 dark:divide-paper/10">
            {shown
              .filter((i) => i.category === c)
              .map((i) => (
                <li key={i.id} className="flex items-center gap-3 py-2">
                  <span className="min-w-0 flex-1">
                    <span className={i.why ? 'opacity-50' : 'font-medium'}>{i.name}</span>
                    <span className="block text-xs opacity-70">{i.why ?? money(i.priceMinor)}</span>
                  </span>
                  {i.why ? null : (
                    <span className="flex items-center gap-2">
                      <button
                        type="button"
                        aria-label={t('less', { name: i.name })}
                        disabled={!basket[i.id]?.qty}
                        onClick={() => change(i.id, -1)}
                        className="size-8 rounded-full border border-ink/20 disabled:opacity-30 dark:border-paper/20"
                      >
                        −
                      </button>
                      <span className="w-5 text-center tabular-nums">{basket[i.id]?.qty ?? 0}</span>
                      <button
                        type="button"
                        aria-label={t('more', { name: i.name })}
                        onClick={() => change(i.id, 1)}
                        className="size-8 rounded-full border border-ink/20 dark:border-paper/20"
                      >
                        +
                      </button>
                    </span>
                  )}
                </li>
              ))}
          </ul>
        </div>
      ))}
      {chosen.length ? (
        <div className="space-y-2 rounded-lg border border-ink/10 p-3 dark:border-paper/10">
          <h3 className="font-semibold">{t('basket')}</h3>
          {chosen.map((i) => (
            <div key={i.id} className="space-y-1 text-sm">
              <p>
                {basket[i.id]!.qty} × {i.name} · {money(i.priceMinor * basket[i.id]!.qty)}
              </p>
              <input
                value={basket[i.id]!.note}
                maxLength={120}
                onChange={(e) =>
                  setBasket((b) => ({ ...b, [i.id]: { qty: b[i.id]!.qty, note: e.target.value } }))
                }
                placeholder={t('notePlaceholder')}
                aria-label={t('note', { name: i.name })}
                className="w-full rounded-md border border-ink/20 bg-white px-2 py-1 dark:border-paper/20 dark:bg-zinc-900"
              />
            </div>
          ))}
          <p className="font-semibold">{t('total', { amount: money(total) })}</p>
          <button
            type="button"
            disabled={busy}
            onClick={() => void send()}
            className="rounded-md bg-ink px-4 py-2 font-medium text-paper disabled:opacity-50 dark:bg-paper dark:text-ink"
          >
            {busy ? t('sending') : t('send')}
          </button>
          <p className="text-xs opacity-70">{t('sendHint')}</p>
        </div>
      ) : null}
      {error ? <p className="text-sm text-red-700 dark:text-red-400">{error}</p> : null}
    </section>
  );
}
