'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Button, shrinkPhoto, trackEvent, useT, THUMB_SIDE } from '@devquake/ui';
import { consumptionBetween, pickMeterIndex } from '../lib/meter';
import { callApi } from './call-api';
import { readMeterText } from './meter-ocr';
import { ErrorText, Field, Input } from './ui';
import { useAction } from './use-action';
import { useFormat } from './use-format';

type OcrState =
  { kind: 'idle' } | { kind: 'reading' } | { kind: 'found'; value: number } | { kind: 'nothing' };

const parse = (s: string) => {
  const text = s.replace(/\s/g, '').replace(',', '.');
  return text && /^\d+(\.\d+)?$/.test(text) ? Number(text) : null;
};

/**
 * A meter reading for one participant of a bill: photo of the meter (read automatically when
 * possible), previous and current index, or just the consumption.
 */
export function ReadingForm({
  billId,
  userId,
  unit,
  meterRequired,
  hasPhoto,
  initial,
  onDone,
}: {
  billId: number;
  userId: number;
  unit: string | null;
  meterRequired: boolean;
  hasPhoto: boolean;
  initial: {
    previousIndex: number | null;
    currentIndex: number | null;
    consumption: number | null;
  };
  onDone?: () => void;
}) {
  const t = useT('reading');
  const tErr = useT('errors');
  const f = useFormat();
  const { busy, error, setError, act, router } = useAction();
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [ocr, setOcr] = useState<OcrState>({ kind: 'idle' });
  const [byIndex, setByIndex] = useState(
    initial.consumption === null || initial.currentIndex !== null,
  );
  const [previous, setPrevious] = useState(initial.previousIndex?.toString() ?? '');
  const [current, setCurrent] = useState(initial.currentIndex?.toString() ?? '');
  const [consumption, setConsumption] = useState(
    initial.currentIndex === null ? (initial.consumption?.toString() ?? '') : '',
  );

  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

  async function pick(file: File | null) {
    setError('');
    if (!file) return;
    let blob: Blob;
    try {
      blob = await shrinkPhoto(file, 1600, 0.85);
    } catch {
      setError(tErr('photoPrepare'));
      return;
    }
    setPhoto(blob);
    setPreview(URL.createObjectURL(blob));
    setOcr({ kind: 'reading' });
    try {
      const text = await readMeterText(blob);
      const value = pickMeterIndex(text, parse(previous));
      if (value === null) setOcr({ kind: 'nothing' });
      else {
        setOcr({ kind: 'found', value });
        setByIndex(true);
        setCurrent(String(value));
      }
      trackEvent('meter_photo_read', { found: value === null ? 0 : 1 });
    } catch {
      setOcr({ kind: 'nothing' });
    }
  }

  const prev = parse(previous);
  const cur = parse(current);
  const computed = byIndex && prev !== null && cur !== null ? consumptionBetween(prev, cur) : null;
  const needsPhoto = meterRequired && !hasPhoto && !photo;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (needsPhoto) {
      setError(tErr('photoRequired'));
      return;
    }
    act(
      async () => {
        if (photo) {
          // The photo and its small version (ADR 0040).
          const body = new FormData();
          body.append('photo', photo, 'photo.jpg');
          const small = await shrinkPhoto(
            new File([photo], 'photo.jpg', { type: photo.type }),
            THUMB_SIDE,
            0.78,
          ).catch(() => null);
          if (small) body.append('thumb', small, 'thumb.jpg');
          const res = await fetch(`/api/bills/${billId}/readings/${userId}/photo`, {
            method: 'PUT',
            body,
          });
          if (!res.ok) {
            const data = (await res.json().catch(() => null)) as { error?: string } | null;
            throw new Error(data?.error ?? tErr('photoSave', { status: res.status }));
          }
        }
        await callApi(
          `/bills/${billId}/readings/${userId}`,
          'PUT',
          byIndex ? { previousIndex: previous, currentIndex: current } : { consumption },
        );
        trackEvent('reading_saved', { photo: photo ? 1 : 0 });
      },
      () => {
        setPhoto(null);
        setOcr({ kind: 'idle' });
        router.refresh();
        onDone?.();
      },
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <Field
          label={meterRequired ? t('photoRequired') : t('photoOptional')}
          hint={hasPhoto && !photo ? t('photoKept') : t('photoHint')}
        >
          <span className="flex flex-wrap gap-2">
            {/* Two inputs: the camera, or a photo already in the library. */}
            <label className="inline-flex min-h-11 cursor-pointer items-center rounded-md bg-ink px-3 text-sm font-medium text-paper hover:bg-ink/85 dark:bg-paper dark:text-ink dark:hover:bg-paper/85">
              <span aria-hidden>📷&nbsp;</span>
              {t('takePhoto')}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="sr-only"
                onChange={(e) => {
                  void pick(e.target.files?.[0] ?? null);
                  e.target.value = '';
                }}
              />
            </label>
            <label className="inline-flex min-h-11 cursor-pointer items-center rounded-md border border-ink/20 px-3 text-sm font-medium hover:bg-ink/5 dark:border-paper/20 dark:hover:bg-paper/10">
              <span aria-hidden>🖼&nbsp;</span>
              {t('choosePhoto')}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                className="sr-only"
                onChange={(e) => {
                  void pick(e.target.files?.[0] ?? null);
                  e.target.value = '';
                }}
              />
            </label>
          </span>
        </Field>
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt={t('photoAlt')} className="h-28 w-auto rounded-md object-cover" />
        ) : null}
      </div>
      <p role="status" className="text-sm">
        {ocr.kind === 'reading' ? (
          <span className="text-ink/60 dark:text-paper/60">{t('ocrReading')}</span>
        ) : ocr.kind === 'found' ? (
          <span className="text-emerald-700 dark:text-emerald-400">
            {t('ocrFound', { value: f.amount(ocr.value) })}
          </span>
        ) : ocr.kind === 'nothing' ? (
          <span className="text-amber-700 dark:text-amber-400">{t('ocrNothing')}</span>
        ) : null}
      </p>

      <div role="group" aria-label={t('mode')} className="flex gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            checked={byIndex}
            onChange={() => setByIndex(true)}
            className="accent-quake"
          />
          {t('byIndex')}
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            checked={!byIndex}
            onChange={() => setByIndex(false)}
            className="accent-quake"
          />
          {t('byConsumption')}
        </label>
      </div>

      {byIndex ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={t('previousIndex')} hint={t('previousHint')}>
            <Input
              inputMode="decimal"
              required
              value={previous}
              onChange={(e) => setPrevious(e.target.value)}
            />
          </Field>
          <Field label={t('currentIndex')}>
            <Input
              inputMode="decimal"
              required
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
            />
          </Field>
          <p className="self-end pb-2 text-sm text-ink/70 dark:text-paper/70">
            {computed !== null
              ? t('consumptionIs', { value: f.amount(computed, unit) })
              : prev !== null && cur !== null
                ? t('indexBelow')
                : null}
          </p>
        </div>
      ) : (
        <Field label={unit ? t('consumptionIn', { unit }) : t('consumption')}>
          <Input
            inputMode="decimal"
            required
            value={consumption}
            onChange={(e) => setConsumption(e.target.value)}
          />
        </Field>
      )}

      <ErrorText>{error}</ErrorText>
      <Button type="submit" disabled={busy || ocr.kind === 'reading'}>
        {busy ? t('saving') : t('save')}
      </Button>
    </form>
  );
}
