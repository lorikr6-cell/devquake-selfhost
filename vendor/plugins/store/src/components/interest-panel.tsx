'use client';

import { useState } from 'react';
import { Button, Link, useT } from '@devquake/ui';
import { callApi } from './call-api';
import { Field, Input, Panel } from './ui';
import { useAction } from './use-action';

/**
 * The owner's interest vote for one product (ADR 0060): show a vote instead of the price, and the
 * cost estimates the Statistics page needs for profit and return.
 */
export function InterestPanel({
  productId,
  on,
  unitCost,
  setupCost,
  currency,
}: {
  productId: number;
  on: boolean;
  unitCost: string;
  setupCost: string;
  currency: string;
}) {
  const t = useT('interestAdmin');
  const { busy, error, act } = useAction();
  const [value, setValue] = useState({ on, unitCost, setupCost });
  return (
    <Panel className="space-y-3">
      <h2 className="font-display text-lg font-semibold">{t('title')}</h2>
      <p className="text-sm text-ink/60 dark:text-paper/60">{t('intro')}</p>
      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={value.on}
          onChange={(e) => setValue((v) => ({ ...v, on: e.target.checked }))}
          className="mt-1 accent-quake"
        />
        <span className="font-medium">{t('toggle')}</span>
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t('unitCost', { currency })} hint={t('unitCostHint')}>
          <Input
            inputMode="decimal"
            value={value.unitCost}
            onChange={(e) => setValue((v) => ({ ...v, unitCost: e.target.value }))}
          />
        </Field>
        <Field label={t('setupCost', { currency })} hint={t('setupCostHint')}>
          <Input
            inputMode="decimal"
            value={value.setupCost}
            onChange={(e) => setValue((v) => ({ ...v, setupCost: e.target.value }))}
          />
        </Field>
      </div>
      {error ? (
        <p role="alert" className="text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          disabled={busy}
          onClick={() =>
            act(() => callApi(`/products/${productId}/interest`, 'PUT', value), {
              success: t('saved'),
            })
          }
        >
          {t('save')}
        </Button>
        <Link href="/stats#interest" className="text-sm underline hover:text-quake">
          {t('results')}
        </Link>
      </div>
    </Panel>
  );
}
