'use client';

import { useState } from 'react';
import { LOCALE_TAGS, cn, useLocale } from '@devquake/ui';
import { useMoney } from './group-form';

// Statistics (one measure each, in the brand colour): bars with the value written beside them,
// and a month chart with a tooltip on hover or keyboard focus. A single series needs no legend;
// the numbers are always readable as text.

const muted = 'text-ink/60 dark:text-paper/60';

/** Labelled horizontal bars, largest first, each with its amount. */
export function BarList({
  items,
  currency,
  label,
}: {
  items: Array<{ key: string; label: string; icon?: string; amount: number }>;
  currency: string;
  label: string;
}) {
  const money = useMoney(currency);
  const max = Math.max(...items.map((i) => i.amount), 0);
  return (
    <ul aria-label={label} className="space-y-2">
      {items.map((i) => (
        <li
          key={i.key}
          className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-3 text-sm"
        >
          <span className="truncate">
            {i.icon ? <span aria-hidden>{i.icon} </span> : null}
            {i.label}
          </span>
          <span className="h-2 rounded-full bg-ink/5 dark:bg-paper/10" aria-hidden>
            <span
              className="block h-2 rounded-full bg-quake"
              style={{ width: `${max > 0 ? Math.max(2, (i.amount / max) * 100) : 0}%` }}
            />
          </span>
          <span className="tabular-nums">{money(i.amount)}</span>
        </li>
      ))}
    </ul>
  );
}

const W = 320;
const H = 120;
const BASE = H - 16;
const TOP = 8;

/** Spending per month: thin bars on a shared baseline, the value on hover or focus. */
export function MonthBars({
  months,
  currency,
  title,
  maxLabel,
}: {
  months: Array<{ month: string; amount: number }>;
  currency: string;
  title: string;
  /** "Highest: {value}" (a text, not a function: this is a client component). */
  maxLabel: string;
}) {
  const money = useMoney(currency);
  const tag = LOCALE_TAGS[useLocale()];
  const [hover, setHover] = useState<number | null>(null);
  const shown = months.slice(-12);
  const max = Math.max(...shown.map((m) => m.amount), 0);
  const col = W / Math.max(shown.length, 1);
  const barW = Math.min(14, col - 6);
  const y = (v: number) => (max > 0 ? BASE - ((BASE - TOP) * v) / max : BASE);
  const monthName = (month: string, style: 'short' | 'long') => {
    const [yy, mm] = month.split('-').map(Number);
    return new Intl.DateTimeFormat(tag, { month: style, year: 'numeric', timeZone: 'UTC' }).format(
      new Date(Date.UTC(yy!, mm! - 1, 15)),
    );
  };
  const active = hover === null ? null : shown[hover]!;
  return (
    <figure className="min-w-0">
      <figcaption className="mb-1 flex items-baseline justify-between gap-2 text-xs">
        <span className="font-medium">{title}</span>
        <span className={cn(muted, 'tabular-nums')} aria-live="polite">
          {active
            ? `${monthName(active.month, 'short')}: ${money(active.amount)}`
            : max > 0
              ? maxLabel.replace('{value}', money(max))
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
        {shown.map((m, i) => {
          const x = i * col + (col - barW) / 2;
          const top = y(m.amount);
          const h = BASE - top;
          const r = Math.min(4, h, barW / 2);
          return (
            <g
              key={m.month}
              tabIndex={0}
              role="img"
              aria-label={`${monthName(m.month, 'long')}: ${money(m.amount)}`}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              className="outline-none"
            >
              <rect x={i * col} y={0} width={col} height={H} fill="transparent" />
              {h > 0 ? (
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
                {monthName(m.month, 'short').slice(0, 3)}
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
