'use client';

import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from 'react';
import { Button, LOCALE_TAGS, useLocale, useT } from '@devquake/ui';
import { DEFAULT_COUNTRY, countries, type AddressParts, type SuggestField } from '../lib/address';
import { callApi } from './call-api';
import { ErrorText, Field, Input, Select } from './ui';
import { useAction } from './use-action';

type Parts = Omit<AddressParts, 'apartment'> & { apartment: string };

/**
 * A text field with address suggestions from OpenStreetMap (through the app's API): typing two
 * or more letters shows matching states, cities or streets in the chosen country. Anything can
 * still be typed; suggestions only help.
 */
function SuggestInput({
  field,
  value,
  onChange,
  context,
  ...props
}: {
  field: SuggestField;
  value: string;
  onChange: (value: string) => void;
  context: { country: string; state?: string; city?: string };
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  const listId = useId();
  const [options, setOptions] = useState<string[]>([]);
  const typed = useRef(false);

  useEffect(() => {
    if (!typed.current || !context.country || value.trim().length < 2) {
      setOptions([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      const params = new URLSearchParams({ field, q: value.trim(), country: context.country });
      if (context.state) params.set('state', context.state);
      if (context.city) params.set('city', context.city);
      try {
        const res = await fetch(`/api/address-suggest?${params}`, { signal: controller.signal });
        if (!res.ok) return;
        const data = (await res.json()) as { suggestions?: string[] };
        // A name that was just picked needs no list of itself.
        const list = data.suggestions ?? [];
        setOptions(list.length === 1 && list[0] === value.trim() ? [] : list);
      } catch {
        // Aborted or offline: no suggestions.
      }
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [field, value, context.country, context.state, context.city]);

  return (
    <>
      <Input
        {...props}
        value={value}
        list={listId}
        onChange={(e) => {
          typed.current = true;
          onChange(e.target.value);
        }}
      />
      <datalist id={listId}>
        {options.map((o) => (
          <option key={o} value={o} />
        ))}
      </datalist>
    </>
  );
}

/** Full name and address in parts (asked once, editable later on /profile). */
export function ProfileForm({
  initial,
  next,
}: {
  initial: { fullName: string; address: string; parts: AddressParts | null } | null;
  /** Where to go after saving (an app path), or null to stay. */
  next: string | null;
}) {
  const t = useT('profile');
  const locale = useLocale();
  const tag = LOCALE_TAGS[locale];
  const { busy, error, act, router } = useAction();
  const [saved, setSaved] = useState(false);
  const countryList = useMemo(() => countries(tag), [tag]);
  const [fullName, setFullName] = useState(initial?.fullName ?? '');
  const [parts, setParts] = useState<Parts>({
    countryCode: initial?.parts?.countryCode ?? DEFAULT_COUNTRY[locale] ?? '',
    state: initial?.parts?.state ?? '',
    city: initial?.parts?.city ?? '',
    street: initial?.parts?.street ?? '',
    houseNumber: initial?.parts?.houseNumber ?? '',
    apartment: initial?.parts?.apartment ?? '',
  });
  const set = (key: keyof Parts) => (value: string) => {
    setSaved(false);
    setParts((p) => ({ ...p, [key]: value }));
  };

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    act(
      () => callApi('/profile', 'PUT', { fullName, ...parts }),
      () => {
        if (next) router.push(next);
        else {
          setSaved(true);
          router.refresh();
        }
      },
    );
  }

  const context = { country: parts.countryCode, state: parts.state, city: parts.city };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label={t('fullName')}>
        <Input
          required
          maxLength={120}
          autoComplete="name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
      </Field>

      <fieldset className="space-y-4">
        <legend className="mb-1 text-sm font-semibold">{t('address')}</legend>
        {initial && !initial.parts && initial.address ? (
          <p className="rounded-md bg-quake/10 px-3 py-2 text-sm">
            {t('completeAddress', { address: initial.address })}
          </p>
        ) : null}
        <Field label={t('country')}>
          <Select
            required
            autoComplete="country"
            value={parts.countryCode}
            onChange={(e) => set('countryCode')(e.target.value)}
          >
            <option value="" disabled>
              {t('chooseCountry')}
            </option>
            {countryList.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('state')} hint={t('stateHint')}>
            <SuggestInput
              field="state"
              required
              maxLength={100}
              autoComplete="address-level1"
              value={parts.state}
              onChange={set('state')}
              context={context}
            />
          </Field>
          <Field label={t('city')}>
            <SuggestInput
              field="city"
              required
              maxLength={100}
              autoComplete="address-level2"
              value={parts.city}
              onChange={set('city')}
              context={context}
            />
          </Field>
        </div>
        <Field label={t('street')}>
          <SuggestInput
            field="street"
            required
            maxLength={150}
            autoComplete="address-line1"
            value={parts.street}
            onChange={set('street')}
            context={context}
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t('houseNumber')}>
            <Input
              required
              maxLength={20}
              value={parts.houseNumber}
              onChange={(e) => set('houseNumber')(e.target.value)}
            />
          </Field>
          <Field label={t('apartment')}>
            <Input
              maxLength={40}
              autoComplete="address-line2"
              value={parts.apartment}
              onChange={(e) => set('apartment')(e.target.value)}
            />
          </Field>
        </div>
        <p className="text-xs text-ink/60 dark:text-paper/60">
          {t('suggestionsSource')}{' '}
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noopener"
            className="underline"
          >
            © OpenStreetMap
          </a>
        </p>
      </fieldset>

      <ErrorText>{error}</ErrorText>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={busy}>
          {busy ? t('saving') : initial?.parts ? t('save') : t('continue')}
        </Button>
        {saved ? (
          <span role="status" className="text-sm text-emerald-700 dark:text-emerald-400">
            {t('saved')}
          </span>
        ) : null}
      </div>
    </form>
  );
}
