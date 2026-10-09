'use client';

import { useMemo, useState } from 'react';
import { cn, useT } from '@devquake/ui';
import { category } from '../lib/model';
import {
  categoryStats,
  moneyTotals,
  yearsWithBills,
  type OverviewBill,
  type SeriesPoint,
} from '../lib/overview';
import { Panel, Select } from './ui';
import { useFormat } from './use-format';

const muted = 'text-ink/60 dark:text-paper/60';

/**
 * Statistics: per category, the user's consumption, share and the unit price month by month
 * (three small charts, one measure each: never two scales on one chart), with a table view.
 */
export function StatsView({ bills, thisYear }: { bills: OverviewBill[]; thisYear: number }) {
  const t = useT('stats');
  const tCat = useT('categories');
  const f = useFormat();
  const years = useMemo(() => yearsWithBills(bills, thisYear), [bills, thisYear]);
  const [year, setYear] = useState(thisYear);
  const series = useMemo(() => categoryStats(bills, year), [bills, year]);
  const money = useMemo(
    () => moneyTotals(bills.filter((b) => b.period.startsWith(`${year}-`))),
    [bills, year],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold">{t('title', { year })}</h2>
        <label className="flex items-center gap-2 text-sm">
          {t('year')}
          <Select value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-auto">
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </Select>
        </label>
      </div>

      {series.length === 0 ? (
        <Panel>
          <p className={`text-sm ${muted}`}>{t('empty')}</p>
        </Panel>
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {money.map((m) => (
              <div key={m.currency} className="contents">
                <Figure label={t('myShare')} value={f.money(m.share, m.currency)} />
                <Figure label={t('paid')} value={f.money(m.paid, m.currency)} />
                <Figure label={t('billed')} value={f.money(m.billed, m.currency)} />
              </div>
            ))}
          </dl>

          {series.map((s) => (
            <Panel key={s.key} className="space-y-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-display text-lg font-semibold">
                  <span aria-hidden>{category(s.category).icon} </span>
                  {tCat(s.category)}
                </h3>
                <span className={`text-xs ${muted}`}>
                  {t('billsCount', { count: s.totals.bills })} · {s.currency}
                  {s.unit ? ` · ${s.unit}` : ''}
                </span>
              </div>
              <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Figure
                  label={t('myConsumption')}
                  value={
                    s.totals.consumption === null ? '—' : f.amount(s.totals.consumption, s.unit)
                  }
                />
                <Figure label={t('myShare')} value={f.money(s.totals.share, s.currency)} />
                <Figure label={t('paid')} value={f.money(s.totals.paid, s.currency)} />
                <Figure
                  label={t('avgUnitPrice')}
                  value={
                    s.totals.unitPrice === null
                      ? '—'
                      : f.unitPrice(s.totals.unitPrice, s.currency, s.unit)
                  }
                />
              </dl>
              <div className="grid gap-4 md:grid-cols-3">
                {s.totals.consumption !== null ? (
                  <BarChart
                    title={s.unit ? t('consumptionIn', { unit: s.unit }) : t('consumption')}
                    points={s.points}
                    value={(p) => p.consumption}
                    format={(v) => f.amount(v, s.unit)}
                  />
                ) : null}
                <BarChart
                  title={t('shareIn', { currency: s.currency })}
                  points={s.points}
                  value={(p) => p.share}
                  format={(v) => f.money(v, s.currency)}
                />
                {s.totals.unitPrice !== null || s.points.some((p) => p.unitPrice !== null) ? (
                  <BarChart
                    title={t('unitPrice')}
                    points={s.points}
                    value={(p) => p.unitPrice}
                    format={(v) => f.unitPrice(v, s.currency, s.unit)}
                  />
                ) : null}
              </div>
              <details className="text-sm">
                <summary className="cursor-pointer text-ink/70 hover:text-quake dark:text-paper/70">
                  {t('table')}
                </summary>
                <div className="mt-2 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className={`text-left text-xs ${muted}`}>
                      <tr>
                        <th className="px-2 py-1 font-medium">{t('month')}</th>
                        <th className="px-2 py-1 text-right font-medium">{t('myConsumption')}</th>
                        <th className="px-2 py-1 text-right font-medium">{t('myShare')}</th>
                        <th className="px-2 py-1 text-right font-medium">{t('paid')}</th>
                        <th className="px-2 py-1 text-right font-medium">{t('unitPrice')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink/10 tabular-nums dark:divide-paper/10">
                      {s.points
                        .filter((p) => p.share !== null)
                        .map((p) => (
                          <tr key={p.month}>
                            <td className="px-2 py-1 capitalize">{f.month(p.month)}</td>
                            <td className="px-2 py-1 text-right">
                              {p.consumption === null ? '—' : f.amount(p.consumption, s.unit)}
                            </td>
                            <td className="px-2 py-1 text-right">
                              {f.money(p.share!, s.currency)}
                            </td>
                            <td className="px-2 py-1 text-right">
                              {f.money(p.paid ?? 0, s.currency)}
                            </td>
                            <td className="px-2 py-1 text-right">
                              {p.unitPrice === null
                                ? '—'
                                : f.unitPrice(p.unitPrice, s.currency, s.unit)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </Panel>
          ))}
        </>
      )}
    </div>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-ink/10 bg-white/70 p-3 dark:border-paper/10 dark:bg-paper/5">
      <dt className={`text-xs ${muted}`}>{label}</dt>
      <dd className="font-display text-xl font-bold tabular-nums">{value}</dd>
    </div>
  );
}

const W = 240;
const H = 120;
const BASE = H - 16; // room for month initials under the baseline
const TOP = 8;

/**
 * One measure, twelve months: thin bars with rounded tops on a shared baseline, a recessive
 * max gridline, and a tooltip on hover or keyboard focus (hit target = the whole month column).
 */
function BarChart({
  title,
  points,
  value,
  format,
}: {
  title: string;
  points: SeriesPoint[];
  value: (p: SeriesPoint) => number | null;
  format: (v: number) => string;
}) {
  const f = useFormat();
  const t = useT('stats');
  const [hover, setHover] = useState<number | null>(null);
  const values = points.map(value);
  const max = Math.max(...values.map((v) => v ?? 0), 0);
  const col = W / points.length;
  const barW = Math.min(12, col - 6);
  const y = (v: number) => (max > 0 ? BASE - ((BASE - TOP) * v) / max : BASE);
  const active = hover === null ? null : { point: points[hover]!, value: values[hover] ?? null };

  return (
    <figure className="min-w-0">
      <figcaption className="mb-1 flex items-baseline justify-between gap-2 text-xs">
        <span className="font-medium">{title}</span>
        <span className={cn(muted, 'tabular-nums')} aria-live="polite">
          {active
            ? `${f.monthShort(active.point.month)}: ${active.value === null ? t('noBill') : format(active.value)}`
            : max > 0
              ? t('max', { value: format(max) })
              : null}
        </span>
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={title}>
        <line
          x1={0}
          x2={W}
          y1={TOP}
          y2={TOP}
          className="stroke-ink/10 dark:stroke-paper/10"
          strokeDasharray="2 3"
        />
        <line x1={0} x2={W} y1={BASE} y2={BASE} className="stroke-ink/25 dark:stroke-paper/25" />
        {points.map((p, i) => {
          const v = values[i] ?? null;
          const x = i * col + (col - barW) / 2;
          const top = v === null ? BASE : y(v);
          const h = BASE - top;
          const r = Math.min(4, h, barW / 2);
          return (
            <g
              key={p.month}
              tabIndex={0}
              role="img"
              aria-label={`${f.month(p.month)}: ${v === null ? t('noBill') : format(v)}`}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              className="outline-none"
            >
              <rect x={i * col} y={0} width={col} height={H} fill="transparent" />
              {v !== null && h > 0 ? (
                <path
                  d={`M${x},${BASE} V${top + r} Q${x},${top} ${x + r},${top} H${x + barW - r} Q${x + barW},${top} ${x + barW},${top + r} V${BASE} Z`}
                  className={cn('fill-quake', hover !== null && hover !== i && 'opacity-40')}
                />
              ) : null}
              {hover === i ? (
                <rect
                  x={i * col + 1}
                  y={1}
                  width={col - 2}
                  height={H - 2}
                  rx={3}
                  className="fill-none stroke-quake/50"
                />
              ) : null}
              <text
                x={i * col + col / 2}
                y={H - 3}
                textAnchor="middle"
                className="fill-ink/50 text-[9px] dark:fill-paper/50"
              >
                {f.monthShort(p.month).slice(0, 1).toUpperCase()}
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
