'use client';

import { useId, useState } from 'react';
import { Button, Sheet, trackEvent, useLocale, useT, LOCALE_TAGS } from '@devquake/ui';
import type { NearbyStore } from '../lib/nearby-rules';
import { callApi, errorMessage } from './call-api';
import { useFeedback } from './feedback';

type Step = 'ask' | 'locating' | 'searching' | 'results' | 'adding';

/**
 * "Search for nearby stores": after the person agrees, the browser asks for their location
 * once; shops around it (OpenStreetMap) are listed, all ticked, and the chosen ones are added
 * to the list's stores. The position is sent once, rounded, and never stored.
 */
export function NearbyStores({
  listId,
  onAdded,
}: {
  listId: number;
  /** Reload the list after stores were added. */
  onAdded: () => Promise<unknown>;
}) {
  const t = useT('nearby');
  const tTypes = useT('storeTypes');
  const tErr = useT('errors');
  const locale = useLocale();
  const { toast } = useFeedback();
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('ask');
  const [stores, setStores] = useState<NearbyStore[]>([]);
  const [chosen, setChosen] = useState<Set<number>>(new Set());
  const [error, setError] = useState('');
  const [place, setPlace] = useState('');
  const [radiusM, setRadiusM] = useState(2000);
  const distance = new Intl.NumberFormat(LOCALE_TAGS[locale], { maximumFractionDigits: 1 });

  function start() {
    setStep('ask');
    setStores([]);
    setError('');
    setOpen(true);
  }

  function locate() {
    if (!('geolocation' in navigator)) {
      setError(t('noLocation'));
      return;
    }
    setError('');
    setStep('locating');
    navigator.geolocation.getCurrentPosition(
      (pos) => void search({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      (err) => {
        setError(err.code === err.PERMISSION_DENIED ? t('denied') : t('noLocation'));
        setStep('ask');
      },
      { enableHighAccuracy: false, timeout: 15_000, maximumAge: 300_000 },
    );
  }

  /** Searches around the shared location or a place the person typed. */
  async function search(body: { lat: number; lon: number } | { place: string }) {
    setError('');
    setStep('searching');
    try {
      const res = await callApi<{ stores: NearbyStore[]; radiusM: number }>(
        `/lists/${listId}/nearby-stores`,
        'POST',
        body,
      );
      const found = res?.stores ?? [];
      setStores(found);
      setRadiusM(res?.radiusM ?? 2000);
      setChosen(new Set(found.map((_, i) => i)));
      setStep('results');
      trackEvent('nearby_stores_searched', { found: found.length, typed: 'place' in body ? 1 : 0 });
    } catch (err) {
      setError(errorMessage(err, tErr));
      setStep('ask');
    }
  }

  async function add() {
    const picked = stores.filter((_, i) => chosen.has(i));
    if (picked.length === 0) return;
    setStep('adding');
    try {
      // The server returns the existing store for a name and address already on the list.
      for (const s of picked) {
        await callApi(`/lists/${listId}/stores`, 'POST', {
          name: s.name,
          type: s.type,
          location: s.location ?? '',
          brand: s.brand,
          wikidata: s.wikidata,
          website: s.website,
        });
      }
      await onAdded();
      toast(t('added', { count: picked.length }));
      trackEvent('nearby_stores_added', { count: picked.length });
      setOpen(false);
    } catch (err) {
      toast(errorMessage(err, tErr), 'error');
      setStep('results');
    }
  }

  const km = (m: number) =>
    m < 1000
      ? t('metres', { distance: Math.round(m / 10) * 10 })
      : t('km', { distance: distance.format(m / 1000) });

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
          {step === 'ask' || step === 'locating' || step === 'searching' ? (
            <>
              <p className="text-sm text-ink/70 dark:text-paper/70">{t('explain')}</p>
              {error ? (
                <p role="alert" className="text-sm text-red-700 dark:text-red-400">
                  {error}
                </p>
              ) : null}
              <div className="flex flex-wrap justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                  {t('cancel')}
                </Button>
                <Button type="button" onClick={locate} disabled={step !== 'ask'}>
                  {step === 'locating'
                    ? t('locating')
                    : step === 'searching'
                      ? t('searching')
                      : t('allow')}
                </Button>
              </div>
              <form
                className="space-y-2 border-t border-ink/10 pt-4 dark:border-paper/10"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (place.trim().length >= 2) void search({ place: place.trim() });
                }}
              >
                <label htmlFor={`${titleId}-place`} className="block text-sm font-medium">
                  {t('placeLabel')}
                </label>
                <div className="flex gap-2">
                  <input
                    id={`${titleId}-place`}
                    value={place}
                    onChange={(e) => setPlace(e.target.value)}
                    maxLength={120}
                    placeholder={t('placePlaceholder')}
                    autoComplete="address-level2"
                    className="min-w-0 flex-1 rounded-md border border-ink/15 bg-white px-3 py-2 text-sm focus:border-quake focus:ring-2 focus:ring-quake/30 focus:outline-none dark:border-paper/15 dark:bg-ink"
                  />
                  <Button
                    type="submit"
                    variant="secondary"
                    disabled={step !== 'ask' || place.trim().length < 2}
                  >
                    {t('placeSearch')}
                  </Button>
                </div>
              </form>
            </>
          ) : stores.length === 0 ? (
            <>
              <p className="text-sm text-ink/70 dark:text-paper/70">{t('none')}</p>
              <div className="flex justify-end">
                <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                  {t('close')}
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-ink/70 dark:text-paper/70">
                {t('found', {
                  count: stores.length,
                  km: distance.format(radiusM / 1000),
                })}
              </p>
              <ul className="max-h-[50vh] divide-y divide-ink/10 overflow-y-auto rounded-lg border border-ink/10 dark:divide-paper/10 dark:border-paper/10">
                {stores.map((s, i) => (
                  <li key={`${s.name}|${s.location ?? ''}`}>
                    <label className="flex cursor-pointer items-start gap-3 px-3 py-2">
                      <input
                        type="checkbox"
                        className="mt-1 size-4 accent-quake"
                        checked={chosen.has(i)}
                        onChange={(e) =>
                          setChosen((c) => {
                            const next = new Set(c);
                            if (e.target.checked) next.add(i);
                            else next.delete(i);
                            return next;
                          })
                        }
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium">{s.name}</span>
                        <span className="block text-xs text-ink/60 dark:text-paper/60">
                          {[tTypes(`${s.type}.label`), s.location, km(s.distanceM)]
                            .filter(Boolean)
                            .join(' · ')}
                        </span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-ink/50 dark:text-paper/50">
                {t('attribution')}{' '}
                <a
                  href="https://www.openstreetmap.org/copyright"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  © OpenStreetMap
                </a>
              </p>
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  disabled={step === 'adding'}
                  onClick={() => setOpen(false)}
                >
                  {t('cancel')}
                </Button>
                <Button
                  type="button"
                  disabled={step === 'adding' || chosen.size === 0}
                  onClick={add}
                >
                  {step === 'adding' ? t('adding') : t('add', { count: chosen.size })}
                </Button>
              </div>
            </>
          )}
        </div>
      </Sheet>
    </>
  );
}
