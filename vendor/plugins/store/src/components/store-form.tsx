'use client';

import { useState, type FormEvent } from 'react';
import { Button, trackEvent, useLocale, useT } from '@devquake/ui';
import { CURRENCIES, LIMITS, slugify } from '../lib/model';
import { callApi } from './call-api';
import { ErrorText, Field, Input, Select, TextArea } from './ui';
import { useAction } from './use-action';

/** A sensible first currency from the page language (the owner can change it). */
const LOCALE_CURRENCY: Record<string, string> = { en: 'EUR', de: 'EUR', ro: 'RON', hu: 'HUF' };
const LOCALE_VAT: Record<string, string> = { en: '0', de: '19', ro: '21', hu: '27' };

export interface StoreFormValue {
  name: string;
  slug: string;
  tagline: string | null;
  about: string | null;
  currency: string;
  vatRate: number;
  published: boolean;
}

/** A new shop (create) or its basic settings. */
export function StoreForm({
  store,
  baseUrl,
  currencyLocked = false,
}: {
  store?: StoreFormValue;
  baseUrl: string;
  currencyLocked?: boolean;
}) {
  const t = useT('storeForm');
  const tCreate = useT('create');
  const locale = useLocale();
  const { busy, error, act } = useAction();
  const [name, setName] = useState(store?.name ?? '');
  const [slug, setSlug] = useState(store?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(Boolean(store));
  const [tagline, setTagline] = useState(store?.tagline ?? '');
  const [about, setAbout] = useState(store?.about ?? '');
  const [currency, setCurrency] = useState(store?.currency ?? LOCALE_CURRENCY[locale] ?? 'EUR');
  const [vatRate, setVatRate] = useState(String(store?.vatRate ?? LOCALE_VAT[locale] ?? '0'));
  const [published, setPublished] = useState(store?.published ?? false);
  const shownSlug = slugTouched ? slug : slugify(name);
  const currencies = (CURRENCIES as readonly string[]).includes(currency)
    ? CURRENCIES
    : [currency, ...CURRENCIES];

  function submit(event: FormEvent) {
    event.preventDefault();
    const body = { name, slug: shownSlug, tagline, about, currency, vatRate, published };
    if (store) {
      act(() => callApi('/store', 'PUT', body), { success: t('saved') });
      return;
    }
    act(
      async () => {
        await callApi('/store', 'POST', body);
        trackEvent('store_created');
      },
      { success: tCreate('created') },
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t('name')}>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={LIMITS.storeName}
            placeholder={t('namePlaceholder')}
            required
          />
        </Field>
        <Field label={t('slug')} hint={t('slugHint', { url: `${baseUrl}/s/${shownSlug || '…'}` })}>
          <Input
            value={shownSlug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value.toLowerCase());
            }}
            maxLength={LIMITS.slug}
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            required
          />
        </Field>
      </div>
      <Field label={t('tagline')}>
        <Input
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          maxLength={LIMITS.tagline}
          placeholder={t('taglinePlaceholder')}
        />
      </Field>
      <Field label={t('about')} hint={t('aboutHint')}>
        <TextArea
          value={about}
          onChange={(e) => setAbout(e.target.value)}
          maxLength={LIMITS.about}
          rows={4}
        />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t('currency')} hint={currencyLocked ? t('currencyLocked') : undefined}>
          <Select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            disabled={currencyLocked}
          >
            {currencies.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t('vatRate')} hint={t('vatHint')}>
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            max={50}
            step="0.01"
            value={vatRate}
            onChange={(e) => setVatRate(e.target.value)}
            required
          />
        </Field>
      </div>
      {store ? (
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            className="mt-1 accent-quake"
          />
          <span>
            <span className="font-medium">{t('published')}</span>
            <span className="block text-xs text-ink/60 dark:text-paper/60">
              {t('publishedHint')}
            </span>
          </span>
        </label>
      ) : null}
      <ErrorText>{error}</ErrorText>
      <Button type="submit" disabled={busy}>
        {store ? t('save') : tCreate('submit')}
      </Button>
    </form>
  );
}

export interface LegalValue {
  companyName: string | null;
  companyNumber: string | null;
  vatNumber: string | null;
  address: string | null;
  email: string | null;
  phone: string | null;
  terms: string | null;
  returnsPolicy: string | null;
  showAnpc: boolean;
}

/** Seller details, terms of sale and returns (EU consumer law). */
export function LegalForm({ value }: { value: LegalValue }) {
  const t = useT('settings');
  const { busy, error, act } = useAction();
  const [v, setV] = useState({
    companyName: value.companyName ?? '',
    companyNumber: value.companyNumber ?? '',
    vatNumber: value.vatNumber ?? '',
    address: value.address ?? '',
    email: value.email ?? '',
    phone: value.phone ?? '',
    terms: value.terms ?? '',
    returnsPolicy: value.returnsPolicy ?? '',
  });
  const [showAnpc, setShowAnpc] = useState(value.showAnpc);
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) =>
    setV((x) => ({ ...x, [k]: e.target.value }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        act(() => callApi('/store/legal', 'PUT', { ...v, showAnpc }), { success: t('saved') });
      }}
      className="space-y-3"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t('companyName')}>
          <Input value={v.companyName} onChange={set('companyName')} maxLength={120} />
        </Field>
        <Field label={t('address')}>
          <Input
            value={v.address}
            onChange={set('address')}
            maxLength={255}
            autoComplete="street-address"
          />
        </Field>
        <Field label={t('companyNumber')}>
          <Input value={v.companyNumber} onChange={set('companyNumber')} maxLength={60} />
        </Field>
        <Field label={t('vatNumber')}>
          <Input value={v.vatNumber} onChange={set('vatNumber')} maxLength={40} />
        </Field>
        <Field label={t('email')}>
          <Input type="email" value={v.email} onChange={set('email')} maxLength={LIMITS.email} />
        </Field>
        <Field label={t('phone')}>
          <Input type="tel" value={v.phone} onChange={set('phone')} maxLength={LIMITS.phone} />
        </Field>
      </div>
      <Field label={t('terms')} hint={t('termsHint')}>
        <TextArea value={v.terms} onChange={set('terms')} maxLength={LIMITS.legalText} rows={6} />
      </Field>
      <Field label={t('returns')} hint={t('returnsHint')}>
        <TextArea
          value={v.returnsPolicy}
          onChange={set('returnsPolicy')}
          maxLength={LIMITS.legalText}
          rows={4}
        />
      </Field>
      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={showAnpc}
          onChange={(e) => setShowAnpc(e.target.checked)}
          className="mt-1 accent-quake"
        />
        <span>
          <span className="font-medium">{t('anpc')}</span>
          <span className="block text-xs text-ink/60 dark:text-paper/60">{t('anpcHint')}</span>
        </span>
      </label>
      <ErrorText>{error}</ErrorText>
      <Button type="submit" disabled={busy}>
        {t('save')}
      </Button>
    </form>
  );
}
