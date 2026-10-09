'use client';

import { useId, useMemo, useState } from 'react';
import { Button, Sheet, trackEvent, useLocale, useT, LOCALE_TAGS } from '@devquake/ui';
import { countries } from '../lib/address';
import { category as categoryOf } from '../lib/model';
import { regionNames, type ServiceSuggestion } from '../lib/provider-catalog';
import { callApi, errorMessage } from './call-api';
import { useAction } from './use-action';

type Step = 'ask' | 'detecting' | 'place' | 'searching' | 'results' | 'adding';

/**
 * "Search for available utility services" (three steps):
 * 1. The person shares their location once (or uses their profile address).
 * 2. The detected country and county / state are filled in, to check or change.
 * 3. The services usual there are listed with the likely provider, the usual ones ticked; the
 *    chosen ones become utilities. Nothing about the location is stored.
 */
export function UtilitySuggestions() {
  const t = useT('suggest');
  const tCat = useT('categories');
  const tErr = useT('errors');
  const locale = useLocale();
  const { toast, router } = useAction();
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('ask');
  const [source, setSource] = useState<'location' | 'profile'>('profile');
  const [country, setCountry] = useState('');
  const [region, setRegion] = useState('');
  const [currency, setCurrency] = useState<string | null>(null);
  const [services, setServices] = useState<ServiceSuggestion[]>([]);
  const [chosen, setChosen] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const countryList = useMemo(() => countries(LOCALE_TAGS[locale]), [locale]);
  const regionsId = `${titleId}-regions`;

  function start() {
    setStep('ask');
    setServices([]);
    setError('');
    setOpen(true);
  }

  /** Step 1 → 2: the place from the position (or the profile address), to confirm. */
  async function detect(position: { lat: number; lon: number } | null) {
    setStep('detecting');
    try {
      const res = await callApi<{
        source: 'location' | 'profile';
        countryCode: string;
        region: string;
      }>('/utility-place', 'POST', position ?? {});
      if (!res) throw new Error();
      setSource(res.source);
      setCountry(res.countryCode);
      setRegion(res.region);
      setStep('place');
    } catch (err) {
      setError(errorMessage(err, tErr));
      setStep('ask');
    }
  }

  function locate() {
    setError('');
    if (!('geolocation' in navigator)) {
      void detect(null);
      return;
    }
    setStep('detecting');
    navigator.geolocation.getCurrentPosition(
      (pos) => void detect({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      // Not allowed or not found: the profile address still gives the country and county.
      () => void detect(null),
      { enableHighAccuracy: false, timeout: 15_000, maximumAge: 300_000 },
    );
  }

  /** Step 2 → 3: the services for the confirmed place. */
  async function search() {
    setError('');
    setStep('searching');
    try {
      const res = await callApi<{ currency: string | null; services: ServiceSuggestion[] }>(
        '/utility-suggestions',
        'POST',
        { countryCode: country, region },
      );
      const found = res?.services ?? [];
      setCurrency(res?.currency ?? null);
      setServices(found);
      setChosen(
        Object.fromEntries(
          found.filter((s) => s.usual).map((s) => [s.category, s.providers[0] ?? '']),
        ),
      );
      setStep('results');
      trackEvent('utility_suggestions_searched', { source, found: found.length });
    } catch (err) {
      setError(errorMessage(err, tErr));
      setStep('place');
    }
  }

  async function add() {
    const picked = services.filter((s) => chosen[s.category] !== undefined);
    if (picked.length === 0) return;
    setStep('adding');
    try {
      for (const s of picked) {
        const cat = categoryOf(s.category);
        await callApi('/utilities', 'POST', {
          name: tCat(s.category),
          category: s.category,
          provider: chosen[s.category] || null,
          unit: cat.unit ?? '',
          currency: currency ?? undefined,
          meterRequired: cat.metered,
        });
      }
      toast(t('added', { count: picked.length }));
      trackEvent('utility_suggestions_added', { count: picked.length });
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast(errorMessage(err, tErr), 'error');
      setStep('results');
    }
  }

  const place = () => {
    const name = countryList.find((c) => c.code === country)?.name ?? country;
    return region ? `${region}, ${name}` : name;
  };
  const field =
    'w-full rounded-md border border-ink/20 bg-white px-3 py-2 text-sm dark:border-paper/20 dark:bg-paper/5';

  return (
    <>
      <Button type="button" variant="secondary" onClick={start}>
        <span aria-hidden>📍 </span>
        {t('button')}
      </Button>
      <Sheet open={open} onClose={() => step !== 'adding' && setOpen(false)} labelledBy={titleId}>
        <div className="space-y-4">
          <h2 id={titleId} className="font-display text-xl font-bold">
            {t('title')}
          </h2>
          {error ? (
            <p role="alert" className="text-sm text-red-700 dark:text-red-400">
              {error}
            </p>
          ) : null}

          {step === 'ask' || step === 'detecting' ? (
            <>
              <p className="text-sm text-ink/70 dark:text-paper/70">{t('explain')}</p>
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  disabled={step !== 'ask'}
                  onClick={() => void detect(null)}
                >
                  {t('useProfile')}
                </Button>
                <Button type="button" onClick={locate} disabled={step !== 'ask'}>
                  {step === 'detecting' ? t('locating') : t('allow')}
                </Button>
              </div>
            </>
          ) : step === 'place' || step === 'searching' ? (
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                void search();
              }}
            >
              <p className="text-sm text-ink/70 dark:text-paper/70">
                {source === 'location' ? t('detectedLocation') : t('detectedProfile')}
              </p>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">{t('country')}</span>
                <select
                  className={field}
                  value={country}
                  onChange={(e) => {
                    setCountry(e.target.value);
                    setRegion('');
                  }}
                  required
                >
                  {countryList.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">{t('region')}</span>
                <input
                  className={field}
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  list={regionsId}
                  maxLength={100}
                  autoComplete="address-level1"
                />
                <datalist id={regionsId}>
                  {regionNames(country).map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </label>
              <div className="flex flex-wrap justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setStep('ask')}>
                  {t('back')}
                </Button>
                <Button type="submit" disabled={step === 'searching' || !country}>
                  {step === 'searching' ? t('searching') : t('search')}
                </Button>
              </div>
            </form>
          ) : services.length === 0 ? (
            <>
              <p className="text-sm text-ink/70 dark:text-paper/70">
                {t('for', { place: place() })}
              </p>
              <p className="text-sm text-ink/70 dark:text-paper/70">{t('none')}</p>
              <div className="flex flex-wrap justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setStep('place')}>
                  {t('back')}
                </Button>
                <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                  {t('close')}
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-ink/70 dark:text-paper/70">
                {t('for', { place: place() })}
              </p>
              <ul className="max-h-[50vh] divide-y divide-ink/10 overflow-y-auto rounded-lg border border-ink/10 dark:divide-paper/10 dark:border-paper/10">
                {services.map((s) => {
                  const on = chosen[s.category] !== undefined;
                  const id = `${titleId}-${s.category}`;
                  return (
                    <li key={s.category} className="flex flex-wrap items-center gap-3 px-3 py-2">
                      <label
                        htmlFor={id}
                        className="flex min-w-0 flex-1 cursor-pointer items-center gap-3"
                      >
                        <input
                          id={id}
                          type="checkbox"
                          className="size-4 accent-quake"
                          checked={on}
                          onChange={(e) =>
                            setChosen((c) => {
                              const next = { ...c };
                              if (e.target.checked) next[s.category] = s.providers[0] ?? '';
                              else delete next[s.category];
                              return next;
                            })
                          }
                        />
                        <span className="font-medium">
                          <span aria-hidden>{categoryOf(s.category).icon} </span>
                          {tCat(s.category)}
                        </span>
                      </label>
                      <select
                        aria-label={t('providerFor', { category: tCat(s.category) })}
                        disabled={!on}
                        value={chosen[s.category] ?? s.providers[0]}
                        onChange={(e) => setChosen((c) => ({ ...c, [s.category]: e.target.value }))}
                        className="min-w-0 rounded-md border border-ink/20 bg-white px-2 py-1 text-sm disabled:opacity-50 dark:border-paper/20 dark:bg-paper/5"
                      >
                        {s.providers.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                        <option value="">{t('otherProvider')}</option>
                      </select>
                    </li>
                  );
                })}
              </ul>
              <p className="text-xs text-ink/50 dark:text-paper/50">{t('note')}</p>
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  disabled={step === 'adding'}
                  onClick={() => setStep('place')}
                >
                  {t('back')}
                </Button>
                <Button
                  type="button"
                  disabled={step === 'adding' || Object.keys(chosen).length === 0}
                  onClick={add}
                >
                  {step === 'adding'
                    ? t('adding')
                    : t('add', { count: Object.keys(chosen).length })}
                </Button>
              </div>
            </>
          )}
        </div>
      </Sheet>
    </>
  );
}
