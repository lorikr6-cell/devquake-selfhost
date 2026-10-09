'use client';

import { useId, useState, type KeyboardEvent } from 'react';
import { cn, useT, thumbUrl } from '@devquake/ui';
import { formatQuantity } from '../lib/model';
import { matchSuggestions, type Suggestion } from '../lib/suggestions';
import { fieldClass } from './ui';
import { useFormat } from './use-format';

/**
 * Product name with suggestions from the user's earlier lists. Typing filters them; picking one
 * (click, or arrow keys + Enter) calls `onPick`, which may fill in the rest of the row.
 */
export function ProductCombobox({
  value,
  onChange,
  onPick,
  suggestions,
  currency,
}: {
  value: string;
  onChange: (name: string) => void;
  onPick: (suggestion: Suggestion) => void;
  suggestions: Suggestion[];
  currency: string;
}) {
  const t = useT('list');
  const f = useFormat();
  const listboxId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const matches = open ? matchSuggestions(suggestions, value) : [];
  const shown = matches.length > 0;

  function pick(s: Suggestion) {
    onPick(s);
    setOpen(false);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!shown) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActive((a) => (a + step + matches.length) % matches.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      pick(matches[Math.min(active, matches.length - 1)]!);
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <input
        role="combobox"
        aria-expanded={shown}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={shown ? `${listboxId}-${active}` : undefined}
        autoComplete="off"
        required
        maxLength={120}
        value={value}
        placeholder={t('itemPlaceholder')}
        className={fieldClass}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActive(0);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={onKeyDown}
      />
      {shown ? (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={t('suggestions')}
          className="absolute inset-x-0 top-full z-30 mt-1 max-h-72 overflow-y-auto rounded-md border border-ink/15 bg-white py-1 shadow-lg dark:border-paper/15 dark:bg-ink"
        >
          {matches.map((s, i) => (
            <li
              key={`${s.name}|${s.unit}`}
              id={`${listboxId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault(); // keep focus, pick before blur
                pick(s);
              }}
              onMouseEnter={() => setActive(i)}
              className={cn(
                'flex cursor-pointer items-center gap-3 px-3 py-2 text-sm',
                i === active && 'bg-quake/10',
              )}
            >
              {s.photo ? (
                // eslint-disable-next-line @next/next/no-img-element -- authenticated API image
                <img
                  src={thumbUrl(s.photo)}
                  alt=""
                  className="size-8 shrink-0 rounded object-cover"
                />
              ) : (
                <span aria-hidden className="size-8 shrink-0 rounded bg-ink/5 dark:bg-paper/10" />
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{s.name}</span>
                <span className="block truncate text-xs text-ink/60 dark:text-paper/60">
                  {[
                    formatQuantity(s.quantity, s.unit),
                    s.price === null ? null : f.money(s.price, currency),
                    s.store?.name,
                    `${s.times}×`,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
