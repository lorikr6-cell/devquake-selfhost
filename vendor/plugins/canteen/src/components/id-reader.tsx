'use client';

import { useState, type FormEvent } from 'react';
import { Button, useT } from '@devquake/ui';
import type { Person } from '../lib/data';
import { readIdCard, type IdCardFields } from '../lib/id-card';
import { formatTime } from '../lib/meals';
import { callApi } from './call-api';
import { ErrorText, Field, Input, Panel } from './ui';
import { recognise } from './ocr';
import { useAction } from './use-action';

/**
 * Reads the stored ID card picture in the browser (components/ocr.ts) and proposes its fields.
 * Nothing is saved until the organiser has checked and confirmed them.
 */
type Form = Record<keyof IdCardFields, string>;

export function IdReader({ base, person }: { base: string; person: Person }) {
  const t = useT();
  const [state, setState] = useState<'idle' | 'reading' | 'done'>('idle');
  const [found, setFound] = useState(0);
  const [form, setForm] = useState<Form | null>(null);
  const { busy, error, setError, act } = useAction();

  async function read() {
    setState('reading');
    setError('');
    try {
      const res = await fetch(`/api${base}/documents/id-card`, { cache: 'no-store' });
      if (!res.ok) throw new Error(t('errors.documentNotFound'));
      const fields = readIdCard(await recognise(await res.blob()));
      setFound(Object.values(fields).filter(Boolean).length);
      setForm({
        lastName: fields.lastName ?? person.lastName,
        firstName: fields.firstName ?? person.firstName,
        birthDate: fields.birthDate ?? person.birthDate ?? '',
        cnp: fields.cnp ?? '',
        idSeries: fields.idSeries ?? '',
        idNumber: fields.idNumber ?? '',
        address: fields.address ?? person.address ?? '',
        idExpiresOn: fields.idExpiresOn ?? '',
      });
      setState('done');
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : t('idReader.failed'));
      setState('idle');
    }
  }

  async function apply(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    const ok = await act(
      async () => {
        await callApi(`${base}/identity`, 'PUT', {
          idSeries: form.idSeries,
          idNumber: form.idNumber,
          cnp: form.cnp,
          idExpiresOn: form.idExpiresOn,
        });
        // The profile keeps everything else as it is.
        await callApi(base, 'PATCH', {
          ...person,
          firstName: form.firstName,
          lastName: form.lastName,
          birthDate: form.birthDate || null,
          address: form.address,
          windowFrom: person.windowFromMin === null ? '' : formatTime(person.windowFromMin),
          windowTo: person.windowToMin === null ? '' : formatTime(person.windowToMin),
        });
      },
      { success: t('idReader.applied') },
    );
    if (ok) {
      setForm(null);
      setState('idle');
    }
  }

  const field = (key: keyof Form, label: string, type = 'text') => (
    <Field label={label}>
      <Input
        type={type}
        value={form![key]}
        onChange={(e) => setForm({ ...form!, [key]: e.target.value })}
        autoComplete="off"
      />
    </Field>
  );

  return (
    <Panel>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">{t('idReader.title')}</h2>
        {state !== 'done' ? (
          <Button type="button" variant="secondary" disabled={state === 'reading'} onClick={read}>
            {state === 'reading' ? t('idReader.reading') : t('idReader.read')}
          </Button>
        ) : null}
      </div>
      <p className="mt-1 text-xs text-ink/60 dark:text-paper/60">{t('idReader.intro')}</p>
      <ErrorText>{error}</ErrorText>
      {form ? (
        <form data-dq-submit="always" onSubmit={apply} className="mt-3 grid gap-3 sm:grid-cols-2">
          <p className="text-sm sm:col-span-2">
            {found ? t('idReader.found', { count: found }) : t('idReader.nothing')}
          </p>
          {field('lastName', t('fields.lastName'))}
          {field('firstName', t('fields.firstName'))}
          {field('birthDate', t('fields.birthDate'), 'date')}
          {field('cnp', t('fields.cnp'))}
          {field('idSeries', t('fields.idSeries'))}
          {field('idNumber', t('fields.idNumber'))}
          {field('idExpiresOn', t('fields.idExpiresOn'), 'date')}
          <div className="sm:col-span-2">{field('address', t('fields.address'))}</div>
          <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
            <Button type="submit" disabled={busy}>
              {t('idReader.apply')}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setForm(null);
                setState('idle');
              }}
            >
              {t('feedback.cancel')}
            </Button>
          </div>
        </form>
      ) : null}
    </Panel>
  );
}
