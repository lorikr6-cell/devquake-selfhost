'use client';

import { useRef, useState, type FormEvent } from 'react';
import { Button, LOCALE_TAGS, cn, photoUpload, useLocale, useT } from '@devquake/ui';
import { licenceState, nameOnLicence, readLicence } from '../lib/licence';
import { ErrorText, Field, Input } from './ui';
import { recognise } from './ocr';
import { useAction } from './use-action';

/** The licence's state as a short label: valid until, expires in N days, expired, or none. */
export function LicenceLabel({ expiresOn, today }: { expiresOn: string | null; today: string }) {
  const t = useT('licence');
  const tag = LOCALE_TAGS[useLocale()];
  const state = licenceState(expiresOn, today);
  const date = (d: string) =>
    new Date(`${d}T12:00:00Z`).toLocaleDateString(tag, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    });
  const [text, style] =
    state.kind === 'missing'
      ? [t('missing'), 'bg-ink/10 text-ink/70 dark:bg-paper/15 dark:text-paper/70']
      : state.kind === 'expired'
        ? [
            t('expired', { date: date(state.expiresOn) }),
            'bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-100',
          ]
        : state.kind === 'soon'
          ? [
              t('soon', { count: state.daysLeft, date: date(state.expiresOn) }),
              'bg-amber-100 text-amber-950 dark:bg-amber-900/60 dark:text-amber-100',
            ]
          : [
              t('valid', { date: date(state.expiresOn) }),
              'bg-emerald-100 text-emerald-950 dark:bg-emerald-900/60 dark:text-emerald-100',
            ];
  return <span className={cn('rounded-full px-2 py-0.5 text-xs', style)}>{text}</span>;
}

/**
 * Upload a driver's licence: take or choose the picture, read it on the device (expiry date,
 * number, whether the driver's name is on it), check and save. An expired licence is refused.
 */
export function LicenceUpload({
  orgId,
  driverId,
  driverName,
  today,
  onDone,
}: {
  orgId: number;
  driverId: number;
  driverName: string;
  today: string;
  onDone?: () => void;
}) {
  const t = useT('licence');
  const input = useRef<HTMLInputElement>(null);
  const camera = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [reading, setReading] = useState(false);
  const [form, setForm] = useState<{
    expiresOn: string;
    number: string;
    nameChecked: boolean;
  } | null>(null);
  const { busy, error, setError, act } = useAction();

  async function chosen(f: File) {
    setFile(f);
    setReading(true);
    setError('');
    try {
      const text = await recognise(f);
      const fields = readLicence(text);
      setForm({
        expiresOn: fields.expiresOn ?? '',
        number: fields.number ?? '',
        nameChecked: nameOnLicence(driverName, text),
      });
    } catch {
      setForm({ expiresOn: '', number: '', nameChecked: false });
    } finally {
      setReading(false);
    }
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!file || !form) return;
    const ok = await act(
      async () => {
        const body = await photoUpload(file);
        body.append('expiresOn', form.expiresOn);
        body.append('number', form.number);
        body.append('nameChecked', String(form.nameChecked));
        const res = await fetch(`/api/orgs/${orgId}/drivers/${driverId}/licence`, {
          method: 'PUT',
          body,
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(data?.error ?? t('failed'));
        }
      },
      { success: t('saved') },
    );
    if (ok) {
      setFile(null);
      setForm(null);
      onDone?.();
    }
  }

  const expired = Boolean(form?.expiresOn) && form!.expiresOn < today;
  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) void chosen(f);
    e.target.value = '';
  };

  return (
    <div className="mt-2 rounded-md border border-ink/10 p-3 text-sm dark:border-paper/10">
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={pick}
      />
      <input
        ref={camera}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={pick}
      />
      {!form ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={reading}
            onClick={() => camera.current?.click()}
          >
            {t('take')}
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={reading}
            onClick={() => input.current?.click()}
          >
            {t('choose')}
          </Button>
          {reading ? (
            <span>{t('reading')}</span>
          ) : (
            <span className="text-xs text-ink/60 dark:text-paper/60">{t('hint')}</span>
          )}
        </div>
      ) : (
        <form data-dq-submit="always" onSubmit={save} className="grid gap-3 sm:grid-cols-2">
          <p
            className={cn(
              'sm:col-span-2',
              form.nameChecked
                ? 'text-emerald-800 dark:text-emerald-300'
                : 'text-amber-800 dark:text-amber-300',
            )}
          >
            {form.nameChecked
              ? t('nameFound', { name: driverName })
              : t('nameMissing', { name: driverName })}
          </p>
          <Field label={t('expiry')}>
            <Input
              type="date"
              value={form.expiresOn}
              onChange={(e) => setForm({ ...form, expiresOn: e.target.value })}
              required
            />
          </Field>
          <Field label={t('number')}>
            <Input
              value={form.number}
              onChange={(e) => setForm({ ...form, number: e.target.value })}
              maxLength={20}
            />
          </Field>
          {expired ? (
            <p className="font-medium text-red-700 sm:col-span-2 dark:text-red-400">
              {t('expiredRefused')}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
            <Button type="submit" disabled={busy || expired || !form.expiresOn}>
              {t('save')}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setForm(null);
                setFile(null);
              }}
            >
              {t('cancel')}
            </Button>
          </div>
        </form>
      )}
      <ErrorText>{error}</ErrorText>
    </div>
  );
}

/**
 * On the driver's own route, every time it is opened: their licence is missing, expires within
 * three months, or has expired; with the upload right there.
 */
export function MyLicenceNotice({
  orgId,
  driverId,
  driverName,
  expiresOn,
  today,
}: {
  orgId: number;
  driverId: number;
  driverName: string;
  expiresOn: string | null;
  today: string;
}) {
  const t = useT('licence');
  const tag = LOCALE_TAGS[useLocale()];
  const [open, setOpen] = useState(false);
  const state = licenceState(expiresOn, today);
  if (state.kind === 'ok') return null;
  const date = (d: string) =>
    new Date(`${d}T12:00:00Z`).toLocaleDateString(tag, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    });
  const text =
    state.kind === 'missing'
      ? t('noticeMissing')
      : state.kind === 'expired'
        ? t('noticeExpired', { date: date(state.expiresOn) })
        : t('noticeSoon', { count: state.daysLeft, date: date(state.expiresOn) });
  return (
    <div
      role="alert"
      className={cn(
        'mb-4 rounded-md px-3 py-2 text-sm',
        state.kind === 'soon'
          ? 'bg-amber-100 text-amber-950 dark:bg-amber-900/60 dark:text-amber-100'
          : 'bg-red-100 text-red-950 dark:bg-red-950 dark:text-red-100',
      )}
    >
      <p>{text}</p>
      {!open ? (
        <Button type="button" variant="secondary" className="mt-2" onClick={() => setOpen(true)}>
          {t('upload')}
        </Button>
      ) : (
        <LicenceUpload
          orgId={orgId}
          driverId={driverId}
          driverName={driverName}
          today={today}
          onDone={() => setOpen(false)}
        />
      )}
    </div>
  );
}
