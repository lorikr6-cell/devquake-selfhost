'use client';

import { useState, type FormEvent } from 'react';
import { Button, trackEvent, useT } from '@devquake/ui';
import { CATEGORIES, CURRENCIES, UNITS, category as categoryOf } from '../lib/model';
import { callApi } from './call-api';
import { ErrorText, Field, Input, Select } from './ui';
import { useAction } from './use-action';

export interface UtilityValues {
  name: string;
  category: string;
  provider: string | null;
  unit: string | null;
  currency: string;
  meterRequired: boolean;
}

/** Create a utility (no `utilityId`) or edit one (owner). */
export function UtilityForm({
  utilityId,
  initial,
}: {
  utilityId?: number;
  initial?: UtilityValues;
}) {
  const t = useT('utilityForm');
  const tCat = useT('categories');
  const { busy, error, act, router } = useAction();
  const [cat, setCat] = useState(initial?.category ?? 'electricity');
  const [unit, setUnit] = useState(initial?.unit ?? categoryOf(cat).unit ?? '');
  const [meter, setMeter] = useState(initial?.meterRequired ?? categoryOf(cat).metered);

  function pickCategory(code: string) {
    setCat(code);
    if (!initial) {
      // New utilities: suggest the category's usual unit and meter setting.
      setUnit(categoryOf(code).unit ?? '');
      setMeter(categoryOf(code).metered);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const body = {
      name: data.get('name'),
      category: cat,
      provider: data.get('provider'),
      unit,
      currency: data.get('currency'),
      meterRequired: meter,
    };
    if (utilityId) {
      act(() => callApi(`/utilities/${utilityId}`, 'PATCH', body));
    } else {
      act(
        async () => {
          const res = await callApi<{ id: number }>('/utilities', 'POST', body);
          trackEvent('utility_created', { category: cat });
          router.push(`/utilities/${res!.id}`);
        },
        () => undefined,
      );
    }
  }

  return (
    <form onSubmit={submit} className="mt-3 space-y-4">
      <Field label={t('category')}>
        <Select name="category" value={cat} onChange={(e) => pickCategory(e.target.value)}>
          {CATEGORIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.icon} {tCat(c.code)}
            </option>
          ))}
        </Select>
      </Field>
      <Field label={t('name')}>
        <Input
          name="name"
          required
          maxLength={80}
          defaultValue={initial?.name ?? ''}
          placeholder={t('namePlaceholder')}
        />
      </Field>
      <Field label={t('provider')}>
        <Input
          name="provider"
          maxLength={80}
          defaultValue={initial?.provider ?? ''}
          placeholder={t('providerPlaceholder')}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t('unit')} hint={t('unitHint')}>
          <Input
            name="unit"
            list="bills-units"
            maxLength={12}
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
          />
          <datalist id="bills-units">
            {UNITS.map((u) => (
              <option key={u} value={u} />
            ))}
          </datalist>
        </Field>
        <Field label={t('currency')}>
          <Select name="currency" defaultValue={initial?.currency ?? 'RON'}>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          name="meterRequired"
          checked={meter}
          onChange={(e) => setMeter(e.target.checked)}
          className="mt-1 size-4 accent-quake"
        />
        <span>
          <span className="block font-medium">{t('meterRequired')}</span>
          <span className="block text-xs text-ink/60 dark:text-paper/60">{t('meterHint')}</span>
        </span>
      </label>
      <ErrorText>{error}</ErrorText>
      <Button type="submit" disabled={busy}>
        {busy ? t('saving') : utilityId ? t('save') : t('create')}
      </Button>
    </form>
  );
}

/** Owner: deletes the utility for everyone. */
export function DeleteUtilityButton({ utilityId, name }: { utilityId: number; name: string }) {
  const t = useT('utilityForm');
  const { busy, error, act, router, confirm } = useAction();
  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="secondary"
        disabled={busy}
        className="text-red-700 dark:text-red-400"
        onClick={async () => {
          const ok = await confirm({
            title: t('deleteConfirm', { name }),
            confirmLabel: t('delete'),
            danger: true,
          });
          if (!ok) return;
          act(
            () => callApi(`/utilities/${utilityId}`, 'DELETE'),
            () => router.push('/'),
          );
        }}
      >
        {t('delete')}
      </Button>
      <ErrorText>{error}</ErrorText>
    </div>
  );
}
