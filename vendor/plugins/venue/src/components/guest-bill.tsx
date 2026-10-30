'use client';

import { useCallback, useState } from 'react';
import { useT } from '@devquake/ui';
import type { BillView } from '../lib/bill-view';
import { formatMinor, type TipSettings } from '../lib/model';
import { useVisibleInterval } from './floor-view';

/**
 * The guests' bill (no account needed): everything ordered, what was brought and what is still
 * coming, the VAT, a tip as the venue set it up, and the total; refreshed while it is open.
 */
export function GuestBill({
  initial,
  venueName,
  currency,
  decimals,
  tips,
  joinUrl,
}: {
  initial: BillView;
  venueName: string;
  currency: string;
  decimals: number;
  tips: TipSettings;
  joinUrl: string;
}) {
  const t = useT('guest');
  const [bill, setBill] = useState(initial);
  const [error, setError] = useState('');
  const money = (m: number) => `${formatMinor(m, decimals)} ${currency}`;
  const open = bill.status === 'open';

  const reload = useCallback(async () => {
    if (!open) return;
    const res = await fetch(`/api/guest/${bill.code}`, { cache: 'no-store' }).catch(() => null);
    if (res?.ok) setBill(((await res.json()) as { bill: BillView }).bill);
  }, [bill.code, open]);
  useVisibleInterval(reload, 15_000);

  async function chooseTip(percent: number | null, fixed: boolean) {
    setError('');
    const res = await fetch(`/api/guest/${bill.code}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ percent, fixed }),
    }).catch(() => null);
    const data = (await res?.json().catch(() => null)) as {
      bill?: BillView;
      error?: string;
    } | null;
    if (res?.ok && data?.bill) setBill(data.bill);
    else setError(data?.error || t('failed'));
  }

  const tot = bill.totals;
  return (
    <article className="mx-auto max-w-lg space-y-5">
      <header>
        <h1 className="font-display text-3xl font-bold">{venueName}</h1>
        <p className="text-ink/70 dark:text-paper/70">
          {bill.tableName ? t('table', { name: bill.tableName }) : null}
        </p>
        {open ? null : (
          <p className="mt-2 rounded-lg bg-green-50 p-3 font-medium dark:bg-green-950/30">
            ✓ {t('paid')}
          </p>
        )}
      </header>
      <ul className="divide-y divide-ink/10 dark:divide-paper/10">
        {bill.lines.map((l) => (
          <li key={l.id} className="flex items-baseline gap-3 py-2">
            <span className="font-medium">
              {l.qty}× {l.name}
            </span>
            {open ? (
              <span
                className={`text-xs ${l.delivered >= l.qty ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400'}`}
              >
                {l.delivered >= l.qty
                  ? `✓ ${t('brought')}`
                  : t('coming', { count: l.qty - l.delivered })}
              </span>
            ) : null}
            <span className="ml-auto tabular-nums">{money(l.priceMinor * l.qty)}</span>
          </li>
        ))}
      </ul>
      <section className="space-y-1 text-sm">
        <p className="flex justify-between">
          <span>{t('subtotal')}</span>
          <span className="tabular-nums">{money(tot.gross)}</span>
        </p>
        {tot.vat.map((v) => (
          <p key={v.rate} className="flex justify-between text-ink/70 dark:text-paper/70">
            <span>{t('vatIncluded', { rate: v.rate / 100 })}</span>
            <span className="tabular-nums">{money(v.vat)}</span>
          </p>
        ))}
        {open && tips.tipMode === 'percent' ? (
          <div className="pt-2">
            <p className="font-medium">{t('tipQuestion')}</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {[null, ...tips.tipPercents].map((p) => (
                <button
                  key={p ?? 'none'}
                  type="button"
                  aria-pressed={bill.tip.percent === p}
                  onClick={() => void chooseTip(p, false)}
                  className={`rounded-full border px-3 py-1 ${bill.tip.percent === p ? 'border-quake bg-quake/10 font-medium' : 'border-ink/20 dark:border-paper/20'}`}
                >
                  {p === null ? t('noTip') : `${p / 100} %`}
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-ink/60 dark:text-paper/60">{t('tipNote')}</p>
          </div>
        ) : null}
        {open && tips.tipMode === 'fixed' ? (
          <label className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              checked={bill.tip.fixed}
              onChange={(e) => void chooseTip(null, e.target.checked)}
            />
            {t('fixedTip', { amount: money(tips.tipFixedMinor) })}
          </label>
        ) : null}
        {tot.tip ? (
          <p className="flex justify-between">
            <span>{t('tip')}</span>
            <span className="tabular-nums">{money(tot.tip)}</span>
          </p>
        ) : null}
        <p className="flex justify-between border-t border-ink/10 pt-2 text-xl font-bold dark:border-paper/10">
          <span>{t('total')}</span>
          <span className="tabular-nums">{money(tot.total)}</span>
        </p>
        {error ? (
          <p role="alert" className="text-red-700 dark:text-red-400">
            {error}
          </p>
        ) : null}
      </section>
      <p className="text-xs text-ink/60 dark:text-paper/60">{t('notFiscal')}</p>
      <aside className="rounded-lg border border-quake/30 bg-quake/5 p-4 text-sm">
        <p className="font-medium">{t('joinTitle')}</p>
        <p className="mt-1">{t('joinBody')}</p>
        <a href={joinUrl} className="mt-2 inline-block font-medium text-quake underline">
          {t('joinLink')}
        </a>
      </aside>
    </article>
  );
}
