'use client';

import { useState } from 'react';
import { LOCALE_TAGS, buttonClass, formatDateTime, useLocale, useT } from '@devquake/ui';
import type { CallTotals, LogInfo } from '../lib/call-log';
import { CLEANUP_DAYS, compactCount } from '../lib/call-rules';
import { callApi } from './call-api';
import { Panel } from './panel';
import { ErrorText, Field } from './ui';
import { useAction } from './use-action';

const selectClass =
  'min-h-11 w-full rounded-lg border border-ink/20 bg-white px-3 py-2 text-sm dark:border-paper/20 dark:bg-ink';

/**
 * The API call log for DevQuake admins (Pulse 0.3.0): all-time totals in short form (the exact
 * number on hover), the log's size, the automatic clean-up interval, and cleaning by hand.
 * Cleaning never changes the totals. Counts only: no member's services are listed.
 */
export function CallLogAdmin({
  totals,
  log,
  timeZone,
}: {
  totals: CallTotals;
  log: LogInfo;
  timeZone: string;
}) {
  const t = useT('admin');
  const locale = useLocale();
  const tag = LOCALE_TAGS[locale];
  const number = new Intl.NumberFormat(tag);
  const { busy, error, act } = useAction();
  const [days, setDays] = useState<number>(log.cleanupDays);
  const [saved, setSaved] = useState(false);
  const [target, setTarget] = useState<number>(30);
  const [confirming, setConfirming] = useState(false);
  const [removed, setRemoved] = useState<number | null>(null);
  const date = (iso: string) => formatDateTime(iso, timeZone, 'datetime', locale);
  const dayLabel = (n: number) => t('days', { count: n });

  return (
    <Panel title={t('title')}>
      <p className="mb-4 text-sm text-ink/70 dark:text-paper/70">{t('intro')}</p>
      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
        <p className="font-display text-3xl font-bold" title={number.format(totals.calls)}>
          {t('total', { count: totals.calls, n: compactCount(totals.calls, tag) })}
        </p>
        <p className="text-sm" title={number.format(totals.refused)}>
          {t('refused', { count: totals.refused, n: compactCount(totals.refused, tag) })}
        </p>
        {totals.firstAt ? (
          <p className="text-sm text-ink/60 dark:text-paper/60">
            {t('since', { date: date(totals.firstAt) })}
          </p>
        ) : null}
      </div>
      <p className="mt-2 text-sm">
        <span title={number.format(log.entries)}>
          {t('entries', { count: log.entries, n: compactCount(log.entries, tag) })}
        </span>
        {log.oldest ? ` · ${t('oldest', { date: date(log.oldest) })}` : null}
      </p>
      {log.lastCleanup ? (
        <p className="mt-1 text-xs text-ink/60 dark:text-paper/60">
          {t('lastCleanup', {
            date: date(log.lastCleanup.at),
            removed: t('removed', { count: log.lastCleanup.removed }),
            how: log.lastCleanup.auto ? t('auto') : t('manual'),
          })}
        </p>
      ) : null}

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            setSaved(false);
            void act(() => callApi('/admin/calls', 'PUT', { cleanupDays: days })).then(
              (ok) => ok && setSaved(true),
            );
          }}
        >
          <h3 className="font-semibold">{t('autoTitle')}</h3>
          <Field label={t('autoLabel')}>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className={selectClass}
            >
              {CLEANUP_DAYS.map((d) => (
                <option key={d} value={d}>
                  {d === 0 ? t('off') : dayLabel(d)}
                </option>
              ))}
            </select>
          </Field>
          <div className="flex items-center gap-3">
            <button type="submit" disabled={busy} className={buttonClass('secondary', 'min-h-11')}>
              {t('save')}
            </button>
            {saved ? (
              <span role="status" className="text-sm text-emerald-700 dark:text-emerald-300">
                {t('saved')}
              </span>
            ) : null}
          </div>
        </form>

        <div className="space-y-2">
          <h3 className="font-semibold">{t('cleanTitle')}</h3>
          <Field label={t('cleanLabel')}>
            <select
              value={target}
              onChange={(e) => {
                setTarget(Number(e.target.value));
                setConfirming(false);
              }}
              className={selectClass}
            >
              <option value={0}>{t('all')}</option>
              {CLEANUP_DAYS.filter((d) => d > 0).map((d) => (
                <option key={d} value={d}>
                  {t('olderThan', { count: d })}
                </option>
              ))}
            </select>
          </Field>
          {confirming ? (
            <div
              role="alertdialog"
              className="rounded-lg border border-red-600/40 bg-red-500/10 p-3 text-sm"
            >
              <p>{t('confirm')}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void act(async () => {
                      const result = await callApi<{ removed: number }>('/admin/calls', 'POST', {
                        olderThanDays: target,
                      });
                      setRemoved(result?.removed ?? 0);
                      setConfirming(false);
                    })
                  }
                  className="min-h-11 rounded-md bg-red-700 px-4 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-50"
                >
                  {t('confirmButton')}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  className={buttonClass('secondary', 'min-h-11')}
                >
                  {t('cancel')}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setRemoved(null);
                setConfirming(true);
              }}
              className={buttonClass('secondary', 'min-h-11')}
            >
              {t('cleanButton')}
            </button>
          )}
          {removed !== null ? (
            <p role="status" className="text-sm text-emerald-700 dark:text-emerald-300">
              {t('removed', { count: removed })}
            </p>
          ) : null}
        </div>
      </div>
      <ErrorText>{error}</ErrorText>
    </Panel>
  );
}
