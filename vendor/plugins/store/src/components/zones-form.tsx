'use client';

import { useMemo, useState } from 'react';
import { Button, LOCALE_TAGS, useLocale, useT } from '@devquake/ui';
import { COUNTRIES, LIMITS } from '../lib/model';
import { centsToText, type Zone } from '../lib/pricing';
import { callApi } from './call-api';
import { ErrorText, Field, Input, Panel } from './ui';
import { useAction } from './use-action';

interface Row {
  key: number;
  name: string;
  countries: string[];
  rate: string;
  freeFrom: string;
}

/** The shipping zones: a name, its countries (or everywhere else), a flat rate, free from. */
export function ZonesForm({ zones, currency }: { zones: Zone[]; currency: string }) {
  const t = useT('shipping');
  const locale = useLocale();
  const { busy, error, act } = useAction();
  const names = useMemo(() => {
    const dn = new Intl.DisplayNames([LOCALE_TAGS[locale]], { type: 'region' });
    return (code: string) => dn.of(code) ?? code;
  }, [locale]);
  const sorted = useMemo(
    () => [...COUNTRIES].sort((a, b) => names(a).localeCompare(names(b), locale)),
    [names, locale],
  );
  const [nextKey, setNextKey] = useState(zones.length + 1);
  const [rows, setRows] = useState<Row[]>(
    zones.map((z, i) => ({
      key: i,
      name: z.name,
      countries: z.countries,
      rate: centsToText(z.rateCents),
      freeFrom: z.freeFromCents === null ? '' : centsToText(z.freeFromCents),
    })),
  );
  const update = (key: number, change: Partial<Row>) =>
    setRows((list) => list.map((r) => (r.key === key ? { ...r, ...change } : r)));
  const takenElsewhere = (key: number) =>
    new Set(rows.filter((r) => r.key !== key).flatMap((r) => r.countries));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        act(
          () =>
            callApi('/store/shipping', 'PUT', {
              zones: rows.map(({ name, countries, rate, freeFrom }) => ({
                name,
                countries,
                rate,
                freeFrom: freeFrom || null,
              })),
            }),
          { success: t('saved') },
        );
      }}
      className="space-y-4"
    >
      {rows.length === 0 ? <p className="text-sm text-quake">{t('empty')}</p> : null}
      {rows.map((r, index) => {
        const taken = takenElsewhere(r.key);
        return (
          <Panel key={r.key} className="space-y-3">
            <div className="flex flex-wrap items-end gap-3">
              <Field label={`${t('zone')} ${index + 1}: ${t('name')}`} className="min-w-48 flex-1">
                <Input
                  value={r.name}
                  onChange={(e) => update(r.key, { name: e.target.value })}
                  maxLength={80}
                  placeholder={t('namePlaceholder')}
                  required
                />
              </Field>
              <Field label={`${t('rate')} (${currency})`} className="w-36">
                <Input
                  inputMode="decimal"
                  value={r.rate}
                  onChange={(e) => update(r.key, { rate: e.target.value })}
                  pattern="\d+([.,]\d{1,2})?"
                  required
                />
              </Field>
              <Field
                label={`${t('freeFrom')} (${currency})`}
                hint={t('freeFromHint')}
                className="w-40"
              >
                <Input
                  inputMode="decimal"
                  value={r.freeFrom}
                  onChange={(e) => update(r.key, { freeFrom: e.target.value })}
                  pattern="\d+([.,]\d{1,2})?"
                />
              </Field>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setRows((list) => list.filter((x) => x.key !== r.key))}
              >
                {t('remove')}
              </Button>
            </div>
            <fieldset>
              <legend className="mb-1 text-sm font-medium">{t('countries')}</legend>
              <div className="flex max-h-56 flex-wrap gap-1.5 overflow-y-auto">
                {['*', ...sorted].map((code) => {
                  const on = r.countries.includes(code);
                  const disabled = !on && taken.has(code);
                  return (
                    <button
                      key={code}
                      type="button"
                      aria-pressed={on}
                      disabled={disabled}
                      onClick={() =>
                        update(r.key, {
                          countries: on
                            ? r.countries.filter((c) => c !== code)
                            : [...r.countries, code],
                        })
                      }
                      className={
                        on
                          ? 'rounded-full border border-quake bg-quake/10 px-2.5 py-1 text-xs font-semibold'
                          : 'rounded-full border border-ink/15 px-2.5 py-1 text-xs hover:border-quake disabled:opacity-30 dark:border-paper/15'
                      }
                    >
                      {code === '*' ? t('everywhere') : names(code)}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </Panel>
        );
      })}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={rows.length >= LIMITS.zonesPerStore}
          onClick={() => {
            setRows((list) => [
              ...list,
              { key: nextKey, name: '', countries: [], rate: '0', freeFrom: '' },
            ]);
            setNextKey((k) => k + 1);
          }}
        >
          {t('add')}
        </Button>
        <Button type="submit" disabled={busy}>
          {t('save')}
        </Button>
      </div>
      <ErrorText>{error}</ErrorText>
    </form>
  );
}
