'use client';

import { useCallback, useMemo, useState } from 'react';
import { Link, useT } from '@devquake/ui';
import { plainQrSvg } from '@devquake/ui/qr';
import type { BillView } from '../lib/bill-view';
import { formatMinor, type TipSettings } from '../lib/model';
import { call, errorText, fieldClass, primaryButton } from './client';
import { useVisibleInterval } from './floor-view';
import { Status } from './status';

interface MenuItem {
  id: number;
  name: string;
  category: string;
  priceMinor: number;
  available: boolean;
}

/**
 * A table on the floor: its open bill (what was brought and what is still to bring), adding
 * items from the menu with a search bar, the guests' bill QR to show or print, and finalising.
 */
export function TableView({
  table,
  initial,
  menu,
  currency,
  decimals,
  tips,
  baseUrl,
}: {
  table: { id: number; name: string };
  initial: BillView | null;
  menu: MenuItem[];
  currency: string;
  decimals: number;
  tips: TipSettings;
  baseUrl: string;
}) {
  const t = useT('table');
  const [bill, setBill] = useState<BillView | null>(initial);
  const [q, setQ] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [paying, setPaying] = useState(false);
  const money = (m: number) => `${formatMinor(m, decimals)} ${currency}`;

  const reload = useCallback(async () => {
    if (!bill || bill.status !== 'open') return;
    const res = await fetch(`/api/floor/bills/${bill.id}`, { cache: 'no-store' }).catch(() => null);
    if (res?.ok) setBill(((await res.json()) as { bill: BillView }).bill);
  }, [bill]);
  useVisibleInterval(reload, 10_000);

  async function run(
    fn: () => Promise<{ bill?: BillView } | null | undefined | void>,
    ok?: string,
  ) {
    setBusy(true);
    setMessage(null);
    try {
      const data = await fn();
      if (data && 'bill' in data && data.bill) setBill(data.bill);
      else await reload();
      if (ok) setMessage({ text: ok, ok: true });
    } catch (err) {
      setMessage({ text: errorText(err, t('failed')), ok: false });
    } finally {
      setBusy(false);
    }
  }

  const query = q.trim().toLowerCase();
  const found = useMemo(
    () =>
      query
        ? menu
            .filter(
              (m) =>
                m.available &&
                (m.name.toLowerCase().includes(query) || m.category.toLowerCase().includes(query)),
            )
            .slice(0, 12)
        : [],
    [menu, query],
  );
  const billUrl = bill ? `${baseUrl}/b/${bill.code}` : '';
  const qr = useMemo(
    () => (billUrl ? plainQrSvg(billUrl, { title: t('guestQr') }) : ''),
    [billUrl],
  );

  if (!bill || bill.status === 'final')
    return (
      <div className="space-y-4">
        {bill?.status === 'final' ? (
          <p className="rounded-lg bg-green-50 p-3 dark:bg-green-950/30">
            ✓ {t('finalized', { total: money(bill.totals.total) })}
          </p>
        ) : null}
        <p>{t('free')}</p>
        <button
          type="button"
          disabled={busy}
          className={primaryButton}
          onClick={() =>
            void run(() =>
              call<{ bill: BillView }>(
                `/api/floor/tables/${table.id}/bill`,
                'POST',
                {},
                t('failed'),
              ),
            )
          }
        >
          {t('open')}
        </button>
        <p className="text-sm">
          <Link href="/floor" className="underline">
            ← {t('backToFloor')}
          </Link>
        </p>
        <Status message={message} />
      </div>
    );

  const tot = bill.totals;
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
      <div className="space-y-5">
        <section className="space-y-2">
          <label className="block text-sm font-medium">
            {t('add')}
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t('searchMenu')}
              className={fieldClass}
              autoFocus
            />
          </label>
          {found.length ? (
            <>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={120}
                placeholder={t('notePlaceholder')}
                aria-label={t('note')}
                className={`${fieldClass} mt-0`}
              />
              <ul className="grid gap-2 sm:grid-cols-2">
                {found.map((m) => (
                  <li key={m.id}>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        void run(async () => {
                          const r = await call<{ bill: BillView }>(
                            `/api/floor/bills/${bill.id}/lines`,
                            'POST',
                            { itemId: m.id, qty: 1, note },
                            t('failed'),
                          );
                          setNote('');
                          return r;
                        })
                      }
                      className="flex w-full items-baseline justify-between gap-2 rounded-lg border border-ink/15 p-3 text-left hover:border-quake dark:border-paper/20"
                    >
                      <span className="font-medium">+ {m.name}</span>
                      <span className="text-sm tabular-nums">{money(m.priceMinor)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </section>

        <section>
          <h2 className="mb-2 font-semibold">{t('order')}</h2>
          {bill.lines.length ? (
            <ul className="divide-y divide-ink/10 rounded-lg border border-ink/10 dark:divide-paper/10 dark:border-paper/10">
              {bill.lines.map((l) => {
                const done = l.delivered >= l.qty;
                return (
                  <li key={l.id} className="flex flex-wrap items-center gap-3 p-3">
                    <span className={done ? 'opacity-60' : 'font-medium'}>
                      {l.qty}× {l.name}
                    </span>
                    {l.note ? <span className="text-sm italic">“{l.note}”</span> : null}
                    <span className="ml-auto text-sm tabular-nums">
                      {money(l.priceMinor * l.qty)}
                    </span>
                    <span className="flex w-full items-center gap-2 text-sm sm:w-auto">
                      <span
                        className={
                          done
                            ? 'text-green-700 dark:text-green-400'
                            : 'text-amber-700 dark:text-amber-400'
                        }
                      >
                        {done
                          ? `✓ ${t('brought')}`
                          : t('broughtOf', { n: l.delivered, qty: l.qty })}
                      </span>
                      {!done ? (
                        <button
                          type="button"
                          disabled={busy}
                          className="rounded-md bg-quake px-2 py-0.5 text-white"
                          onClick={() =>
                            void run(() =>
                              call(
                                `/api/floor/lines/${l.id}`,
                                'PUT',
                                { delivered: l.qty },
                                t('failed'),
                              ),
                            )
                          }
                        >
                          {t('markBrought')}
                        </button>
                      ) : null}
                      {l.delivered === 0 ? (
                        <button
                          type="button"
                          disabled={busy}
                          className="text-red-700 underline dark:text-red-400"
                          onClick={() =>
                            void run(() =>
                              call(`/api/floor/lines/${l.id}`, 'DELETE', undefined, t('failed')),
                            )
                          }
                        >
                          {t('remove')}
                        </button>
                      ) : null}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-ink/70 dark:text-paper/70">{t('empty')}</p>
          )}
        </section>

        <section className="space-y-1 text-sm">
          {tot.vat.map((v) => (
            <p key={v.rate} className="flex justify-between">
              <span>{t('vatLine', { rate: v.rate / 100 })}</span>
              <span className="tabular-nums">{money(v.vat)}</span>
            </p>
          ))}
          {tot.tip ? (
            <p className="flex justify-between">
              <span>{t('tip')}</span>
              <span className="tabular-nums">{money(tot.tip)}</span>
            </p>
          ) : null}
          <p className="flex justify-between text-lg font-semibold">
            <span>{t('total')}</span>
            <span className="tabular-nums">{money(tot.total)}</span>
          </p>
        </section>

        {paying ? (
          <section className="space-y-3 rounded-lg border border-ink/10 p-4 dark:border-paper/10">
            <h2 className="font-semibold">{t('finalize')}</h2>
            {tips.tipMode === 'percent' ? (
              <div className="flex flex-wrap gap-2 text-sm">
                {[null, ...tips.tipPercents].map((p) => (
                  <button
                    key={p ?? 'none'}
                    type="button"
                    aria-pressed={bill.tip.percent === p}
                    className={`rounded-full border px-3 py-1 ${bill.tip.percent === p ? 'border-quake bg-quake/10' : 'border-ink/20'}`}
                    onClick={() => setBill({ ...bill, tip: { percent: p, fixed: false } })}
                  >
                    {p === null ? t('noTip') : `${p / 100} %`}
                  </button>
                ))}
              </div>
            ) : null}
            <div className="flex flex-wrap gap-2">
              {(['cash', 'card', 'other'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  disabled={busy}
                  className={primaryButton}
                  onClick={() =>
                    void run(
                      () =>
                        call<{ bill: BillView }>(
                          `/api/floor/bills/${bill.id}/finalize`,
                          'POST',
                          { payment: p, tipPercent: bill.tip.percent, tipFixed: bill.tip.fixed },
                          t('failed'),
                        ),
                      t('done'),
                    )
                  }
                >
                  {t(`pay.${p}`)}
                </button>
              ))}
              <button type="button" className="text-sm underline" onClick={() => setPaying(false)}>
                {t('cancel')}
              </button>
            </div>
            {tot.pending ? (
              <p className="text-sm text-amber-700">{t('stillToBring', { count: tot.pending })}</p>
            ) : null}
          </section>
        ) : (
          <button type="button" className={primaryButton} onClick={() => setPaying(true)}>
            {t('finalize')}
          </button>
        )}
        <Status message={message} />
        <p className="text-sm">
          <Link href="/floor" className="underline">
            ← {t('backToFloor')}
          </Link>
        </p>
      </div>

      <aside className="space-y-2 text-center print:block">
        <p className="font-semibold">{t('guestQr')}</p>
        <div
          className="mx-auto w-56 rounded-lg bg-white p-2"
          // The QR is our own SVG from the bill's address (no user content).
          dangerouslySetInnerHTML={{ __html: qr }}
        />
        <p className="text-xs break-all">{billUrl}</p>
        <p className="text-xs text-ink/60 dark:text-paper/60">{t('guestQrHint')}</p>
        <button type="button" className="text-sm underline" onClick={() => window.print()}>
          {t('print')}
        </button>
      </aside>
    </div>
  );
}
