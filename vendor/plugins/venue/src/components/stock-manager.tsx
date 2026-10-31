'use client';

import { useMemo, useState } from 'react';
import { formatDateTime, useLocale, useT } from '@devquake/ui';
import { UNITS, toBuy, type Ingredient, type Unit } from '../lib/stock';
import { call, dangerLink, errorText, fieldClass, primaryButton } from './client';
import { Status } from './status';

type Message = { text: string; ok: boolean } | null;
const fmt = (n: number) => String(Math.round(n * 1000) / 1000);

/**
 * The stock: every ingredient and drink with what is on hand and the daily and weekly levels
 * (below the daily level it shows red); deliveries, waste, a daily or weekly count, and "what to
 * buy" up to a level, sent to the purchasing list in Shopping. A search bar finds an ingredient.
 */
export function StockManager({
  initial,
  timeZone,
  hasList,
}: {
  initial: Ingredient[];
  timeZone: string;
  /** A purchasing list in Shopping is chosen (Settings). */
  hasList: boolean;
}) {
  const t = useT('stock');
  const locale = useLocale();
  const [list, setList] = useState(initial);
  const [q, setQ] = useState('');
  const [message, setMessage] = useState<Message>(null);
  const [busy, setBusy] = useState(false);
  const [counting, setCounting] = useState<'daily' | 'weekly' | null>(null);
  const [counts, setCounts] = useState<Record<number, string>>({});
  const [level, setLevel] = useState<'daily' | 'weekly'>('daily');
  const [form, setForm] = useState({
    name: '',
    unit: 'pcs' as Unit,
    dailyTarget: '',
    weeklyTarget: '',
  });

  async function run(url: string, method: 'POST' | 'PUT' | 'DELETE', body: unknown, ok: string) {
    setBusy(true);
    setMessage(null);
    try {
      const r = await call<{ ingredients?: Ingredient[]; added?: number; list?: string }>(
        url,
        method,
        body,
        t('failed'),
      );
      if (r.ingredients) setList(r.ingredients);
      setMessage({
        text: r.added !== undefined ? t('sent', { count: r.added, list: r.list ?? '' }) : ok,
        ok: true,
      });
      return true;
    } catch (err) {
      setMessage({ text: errorText(err, t('failed')), ok: false });
      return false;
    } finally {
      setBusy(false);
    }
  }

  const query = q.trim().toLowerCase();
  const shown = list.filter((i) => !query || i.name.toLowerCase().includes(query));
  const buy = useMemo(() => toBuy(list, level), [list, level]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('search')}
          aria-label={t('search')}
          className={`${fieldClass} mt-0 max-w-xs`}
        />
        {counting ? null : (
          <>
            <button
              type="button"
              className={primaryButton}
              onClick={() => {
                setCounting('daily');
                setCounts({});
              }}
            >
              {t('countDaily')}
            </button>
            <button
              type="button"
              className="rounded-md border border-ink/20 px-4 py-2 dark:border-paper/20"
              onClick={() => {
                setCounting('weekly');
                setCounts({});
              }}
            >
              {t('countWeekly')}
            </button>
          </>
        )}
      </div>
      <Status message={message} />

      {list.length ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-ink/60 dark:text-paper/60">
                <th className="py-1">{t('name')}</th>
                <th className="text-right">{t('onHand')}</th>
                <th className="text-right">{t('daily')}</th>
                <th className="text-right">{t('weekly')}</th>
                <th className="px-2">
                  {counting ? t(counting === 'daily' ? 'countDaily' : 'countWeekly') : t('change')}
                </th>
              </tr>
            </thead>
            <tbody>
              {shown.map((i) => {
                const low = i.stock < i.dailyTarget;
                return (
                  <tr key={i.id} className="border-t border-ink/10 align-top dark:border-paper/10">
                    <td className="py-2">
                      <span className="font-medium">{i.name}</span>
                      <span className="block text-xs opacity-60">
                        {i.countedAt
                          ? t('counted', {
                              date: formatDateTime(i.countedAt, timeZone, 'datetime', locale),
                            })
                          : t('neverCounted')}
                      </span>
                    </td>
                    <td
                      className={`text-right tabular-nums ${low ? 'font-bold text-red-700 dark:text-red-400' : ''}`}
                    >
                      {fmt(i.stock)} {t(`units.${i.unit}`)}
                    </td>
                    <td className="text-right tabular-nums">{fmt(i.dailyTarget)}</td>
                    <td className="text-right tabular-nums">{fmt(i.weeklyTarget)}</td>
                    <td className="px-2">
                      {counting ? (
                        <input
                          inputMode="decimal"
                          value={counts[i.id] ?? ''}
                          placeholder={fmt(i.stock)}
                          onChange={(e) => setCounts((c) => ({ ...c, [i.id]: e.target.value }))}
                          aria-label={t('countOf', { name: i.name })}
                          className="w-24 rounded-md border border-ink/20 bg-white px-2 py-1 dark:border-paper/20 dark:bg-zinc-900"
                        />
                      ) : (
                        <span className="flex flex-wrap gap-2">
                          {(['delivery', 'waste'] as const).map((k) => (
                            <button
                              key={k}
                              type="button"
                              disabled={busy}
                              className="underline"
                              onClick={() => {
                                const qty = window.prompt(
                                  t(`${k}Prompt`, { name: i.name, unit: t(`units.${i.unit}`) }),
                                );
                                if (qty)
                                  void run(
                                    `/api/stock/${i.id}`,
                                    'PUT',
                                    { change: k, qty },
                                    t('saved'),
                                  );
                              }}
                            >
                              {t(k)}
                            </button>
                          ))}
                          <button
                            type="button"
                            disabled={busy}
                            className={dangerLink}
                            onClick={() => {
                              if (window.confirm(t('removeConfirm', { name: i.name })))
                                void run(`/api/stock/${i.id}`, 'DELETE', undefined, t('removed'));
                            }}
                          >
                            {t('remove')}
                          </button>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-ink/70 dark:text-paper/70">{t('empty')}</p>
      )}

      {counting ? (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={busy}
            className={primaryButton}
            onClick={async () => {
              const entries = Object.entries(counts).filter(([, v]) => v.trim() !== '');
              if (
                await run(
                  '/api/stock',
                  'POST',
                  {
                    count: counting,
                    counts: entries.map(([id, qty]) => ({ id: Number(id), qty })),
                  },
                  t('countSaved', { count: entries.length }),
                )
              )
                setCounting(null);
            }}
          >
            {t('saveCount')}
          </button>
          <button type="button" className="underline" onClick={() => setCounting(null)}>
            {t('cancel')}
          </button>
        </div>
      ) : null}

      <section className="space-y-2 rounded-lg border border-ink/10 p-4 dark:border-paper/10">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-semibold">{t('toBuy')}</h2>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value === 'weekly' ? 'weekly' : 'daily')}
            className="rounded-md border border-ink/20 bg-white px-2 py-1 text-sm dark:border-paper/20 dark:bg-zinc-900"
          >
            <option value="daily">{t('toDaily')}</option>
            <option value="weekly">{t('toWeekly')}</option>
          </select>
        </div>
        {buy.length ? (
          <>
            <ul className="space-y-0.5 text-sm">
              {buy.map((b) => (
                <li key={b.ingredient.id} className="flex justify-between gap-3">
                  <span>{b.ingredient.name}</span>
                  <span className="tabular-nums">
                    {b.qty} {t(`units.${b.ingredient.unit}`)}
                  </span>
                </li>
              ))}
            </ul>
            {hasList ? (
              <button
                type="button"
                disabled={busy}
                className={primaryButton}
                onClick={() => void run('/api/stock/buy', 'POST', { level }, t('saved'))}
              >
                🛒 {t('sendToList')}
              </button>
            ) : (
              <p className="text-xs text-ink/60 dark:text-paper/60">{t('chooseList')}</p>
            )}
          </>
        ) : (
          <p className="text-sm text-ink/70 dark:text-paper/70">{t('nothingToBuy')}</p>
        )}
      </section>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (await run('/api/stock', 'POST', form, t('added')))
            setForm({ name: '', unit: form.unit, dailyTarget: '', weeklyTarget: '' });
        }}
        className="grid gap-3 rounded-lg border border-ink/10 p-4 sm:grid-cols-5 dark:border-paper/10"
      >
        <h2 className="font-semibold sm:col-span-5">{t('new')}</h2>
        <label className="text-sm font-medium sm:col-span-2">
          {t('name')}
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            maxLength={80}
            placeholder={t('namePlaceholder')}
            className={fieldClass}
          />
        </label>
        <label className="text-sm font-medium">
          {t('unit')}
          <select
            value={form.unit}
            onChange={(e) => setForm({ ...form, unit: e.target.value as Unit })}
            className={fieldClass}
          >
            {UNITS.map((u) => (
              <option key={u} value={u}>
                {t(`units.${u}`)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium">
          {t('daily')}
          <input
            inputMode="decimal"
            value={form.dailyTarget}
            onChange={(e) => setForm({ ...form, dailyTarget: e.target.value })}
            className={fieldClass}
          />
        </label>
        <label className="text-sm font-medium">
          {t('weekly')}
          <input
            inputMode="decimal"
            value={form.weeklyTarget}
            onChange={(e) => setForm({ ...form, weeklyTarget: e.target.value })}
            className={fieldClass}
          />
        </label>
        <div className="sm:col-span-5">
          <button type="submit" disabled={busy} className={primaryButton}>
            {t('add')}
          </button>
        </div>
      </form>
    </div>
  );
}
