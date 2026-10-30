'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useT } from '@devquake/ui';
import { PRESETS } from '../lib/model';
import { call, errorText, fieldClass, primaryButton } from './client';
import { Status } from './status';

export interface VenueFormValues {
  name: string;
  country: string;
  currency: string;
  vatRates: number[];
  decimals: number;
  menuPublic: boolean;
}

const percent = (rates: number[]) => rates.map((r) => r / 100).join(', ');

/**
 * The venue's settings: a new venue (no `venue`) or changes to it. Hungary and Romania fill the
 * currency, VAT rates and decimals from their preset; any other country is set up by hand.
 */
export function VenueForm({ venue }: { venue?: VenueFormValues }) {
  const t = useT('venueForm');
  const router = useRouter();
  const [name, setName] = useState(venue?.name ?? '');
  const [country, setCountry] = useState(venue?.country ?? 'HU');
  const [currency, setCurrency] = useState(venue?.currency ?? PRESETS.HU.currency);
  const [vatRates, setVatRates] = useState(percent(venue?.vatRates ?? PRESETS.HU.vatRates));
  const [decimals, setDecimals] = useState(venue?.decimals ?? PRESETS.HU.decimals);
  const [menuPublic, setMenuPublic] = useState(venue?.menuPublic ?? true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  function pickCountry(code: string) {
    setCountry(code);
    const preset = PRESETS[code as 'HU' | 'RO'];
    if (!preset) return;
    setCurrency(preset.currency);
    setVatRates(percent(preset.vatRates));
    setDecimals(preset.decimals);
  }

  async function save() {
    setBusy(true);
    setMessage(null);
    try {
      const body = { name, country, currency, vatRates, decimals, menuPublic };
      await call('/api/venue', venue ? 'PUT' : 'POST', body, t('failed'));
      setMessage({ text: t('saved'), ok: true });
      router.refresh();
    } catch (err) {
      setMessage({ text: errorText(err, t('failed')), ok: false });
    } finally {
      setBusy(false);
    }
  }

  const preset = country === 'HU' || country === 'RO';
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
      className="grid gap-3 sm:grid-cols-2"
    >
      <label className="text-sm font-medium sm:col-span-2">
        {t('name')}
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={80}
          placeholder={t('namePlaceholder')}
          className={fieldClass}
        />
      </label>
      <label className="text-sm font-medium">
        {t('country')}
        <select
          value={preset ? country : 'other'}
          onChange={(e) => pickCountry(e.target.value === 'other' ? '' : e.target.value)}
          className={fieldClass}
        >
          <option value="HU">{t('countryHU')}</option>
          <option value="RO">{t('countryRO')}</option>
          <option value="other">{t('countryOther')}</option>
        </select>
      </label>
      {preset ? (
        <span className="self-end text-sm text-ink/70 dark:text-paper/70">{t('presetNote')}</span>
      ) : (
        <label className="text-sm font-medium">
          {t('countryCode')}
          <input
            value={country}
            onChange={(e) => setCountry(e.target.value.toUpperCase())}
            required
            maxLength={2}
            placeholder="AT"
            className={fieldClass}
          />
        </label>
      )}
      <label className="text-sm font-medium">
        {t('currency')}
        <input
          value={currency}
          onChange={(e) => setCurrency(e.target.value.toUpperCase())}
          required
          maxLength={3}
          placeholder="EUR"
          className={fieldClass}
        />
      </label>
      <label className="text-sm font-medium">
        {t('decimals')}
        <select
          value={decimals}
          onChange={(e) => setDecimals(Number(e.target.value))}
          className={fieldClass}
        >
          <option value={2}>{t('decimals2')}</option>
          <option value={0}>{t('decimals0')}</option>
        </select>
      </label>
      <label className="text-sm font-medium sm:col-span-2">
        {t('vatRates')}
        <input
          value={vatRates}
          onChange={(e) => setVatRates(e.target.value)}
          required
          placeholder="27, 18, 5"
          className={fieldClass}
        />
        <span className="mt-1 block font-normal text-ink/60 dark:text-paper/60">
          {t('vatRatesHint')}
        </span>
      </label>
      {venue ? (
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input
            type="checkbox"
            checked={menuPublic}
            onChange={(e) => setMenuPublic(e.target.checked)}
          />
          {t('menuPublic')}
        </label>
      ) : null}
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button type="submit" disabled={busy} className={primaryButton}>
          {venue ? t('save') : t('create')}
        </button>
        <Status message={message} />
      </div>
    </form>
  );
}
