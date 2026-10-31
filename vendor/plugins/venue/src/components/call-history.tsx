'use client';

import { useState } from 'react';
import { formatDateTime, useLocale, useT } from '@devquake/ui';
import type { Call } from '../lib/calls';
import { fieldClass } from './client';

/** The venue's calls, newest first (the notification history), with a search bar. */
export function CallHistory({ calls, timeZone }: { calls: Call[]; timeZone: string }) {
  const t = useT('call');
  const locale = useLocale();
  const [q, setQ] = useState('');
  const query = q.trim().toLowerCase();
  const shown = calls.filter(
    (c) =>
      !query ||
      c.tableName.toLowerCase().includes(query) ||
      (c.answeredBy ?? '').toLowerCase().includes(query),
  );
  return (
    <div className="space-y-3">
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t('searchHistory')}
        aria-label={t('searchHistory')}
        className={`${fieldClass} mt-0 max-w-xs`}
      />
      {shown.length ? (
        <ul className="divide-y divide-ink/10 rounded-lg border border-ink/10 dark:divide-paper/10 dark:border-paper/10">
          {shown.map((c) => {
            const waited =
              c.answeredAt !== null
                ? Math.max(
                    0,
                    Math.round((Date.parse(c.answeredAt) - Date.parse(c.createdAt)) / 60_000),
                  )
                : null;
            return (
              <li key={c.id} className="flex flex-wrap items-baseline gap-3 p-3 text-sm">
                <span className="font-semibold">{c.tableName}</span>
                <span className="opacity-70">
                  {formatDateTime(c.createdAt, timeZone, 'datetime', locale)}
                </span>
                <span className="ml-auto">
                  {c.status === 'open'
                    ? `🙋 ${t('waiting')}`
                    : c.status === 'coming'
                      ? t('onTheWay', { name: c.answeredBy ?? '' })
                      : t('answered', { name: c.answeredBy ?? '—', minutes: waited ?? 0 })}
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-ink/70 dark:text-paper/70">{t('noHistory')}</p>
      )}
    </div>
  );
}
