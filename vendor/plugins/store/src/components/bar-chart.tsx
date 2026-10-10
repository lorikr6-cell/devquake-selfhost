'use client';

import { useId, useState } from 'react';
import { LOCALE_TAGS, cn, useLocale } from '@devquake/ui';
import { formatCents } from '../lib/pricing';

/**
 * A small single-series bar chart (one measure per chart, never two axes): thin bars with
 * rounded tops on a recessive baseline, a tooltip on hover and keyboard focus, the highest
 * value labelled, and the numbers as a table for screen readers and printing.
 */
export function BarChart({
  title,
  labels,
  values,
  currency,
  tableLabels,
}: {
  title: string;
  /** One label per bar (a day or a week). */
  labels: string[];
  values: number[];
  /** Values are cents in this currency; without it, counts. */
  currency?: string;
  tableLabels: { period: string; value: string; show: string };
}) {
  const tag = LOCALE_TAGS[useLocale()];
  const format = (v: number) => (currency ? formatCents(v, currency, tag) : v.toLocaleString(tag));
  const [active, setActive] = useState<number | null>(null);
  const id = useId();
  const max = Math.max(1, ...values);
  const top = values.indexOf(Math.max(...values));
  return (
    <figure className="space-y-2" aria-labelledby={id}>
      <figcaption id={id} className="text-sm font-medium">
        {title}
      </figcaption>
      <div className="relative">
        <div
          className="flex h-40 items-end gap-0.5 border-b border-ink/15 dark:border-paper/15"
          onMouseLeave={() => setActive(null)}
        >
          {values.map((v, i) => (
            <button
              key={labels[i]}
              type="button"
              aria-label={`${labels[i]}: ${format(v)}`}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              className="group flex h-full min-w-0 flex-1 items-end focus-visible:outline-2 focus-visible:outline-quake"
            >
              <span
                className={cn(
                  'block w-full rounded-t-[4px] bg-quake transition-opacity',
                  active !== null && active !== i && 'opacity-40',
                )}
                style={{ height: v > 0 ? `max(2px, ${(v / max) * 100}%)` : '0' }}
              />
            </button>
          ))}
        </div>
        {active !== null ? (
          <div
            role="status"
            className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full rounded-md border border-ink/15 bg-white px-2 py-1 text-xs whitespace-nowrap text-ink shadow dark:border-paper/15 dark:bg-ink dark:text-paper"
            style={{ left: `${((active + 0.5) / values.length) * 100}%` }}
          >
            <span className="block text-ink/60 dark:text-paper/60">{labels[active]}</span>
            <span className="font-semibold">{format(values[active]!)}</span>
          </div>
        ) : max > 1 && values[top]! > 0 ? (
          <span
            className="pointer-events-none absolute -top-5 -translate-x-1/2 text-xs text-ink/70 dark:text-paper/70"
            style={{ left: `${((top + 0.5) / values.length) * 100}%` }}
          >
            {format(values[top]!)}
          </span>
        ) : null}
      </div>
      <div className="flex justify-between text-xs text-ink/60 dark:text-paper/60">
        <span>{labels[0]}</span>
        <span>{labels[labels.length - 1]}</span>
      </div>
      <details className="text-xs">
        <summary className="cursor-pointer text-ink/60 dark:text-paper/60">
          {tableLabels.show}
        </summary>
        <table className="mt-2 w-full">
          <thead>
            <tr className="text-left">
              <th className="py-1 font-medium">{tableLabels.period}</th>
              <th className="py-1 text-right font-medium">{tableLabels.value}</th>
            </tr>
          </thead>
          <tbody>
            {values.map((v, i) => (
              <tr key={labels[i]} className="border-t border-ink/10 dark:border-paper/10">
                <td className="py-1">{labels[i]}</td>
                <td className="py-1 text-right tabular-nums">{format(v)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
