'use client';

import { useState, type FormEvent } from 'react';
import { Button, LOCALE_TAGS, useLocale, useT } from '@devquake/ui';
import { parseCnp } from '../lib/cnp';
import { callApi } from './call-api';
import { ErrorText, Field, Input, Panel } from './ui';
import { useAction } from './use-action';

interface Identity {
  idSeries: string | null;
  idNumber: string | null;
  cnp: string | null;
}

/**
 * The CNP and ID card series and number (organisers only). Hidden until "Show": each showing is
 * a request the server records in the access log.
 */
export function IdentityPanel({ path }: { path: string }) {
  const t = useT('identity');
  const tf = useT('fields');
  const locale = useLocale();
  const [shown, setShown] = useState<Identity | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Identity>({ idSeries: '', idNumber: '', cnp: '' });
  const { busy, error, act } = useAction();

  async function show() {
    await act(
      async () => {
        const data = await callApi<Identity>(path);
        setShown(data);
        setForm({
          idSeries: data?.idSeries ?? '',
          idNumber: data?.idNumber ?? '',
          cnp: data?.cnp ?? '',
        });
      },
      { after: () => undefined },
    );
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    await act(() => callApi(path, 'PUT', form), {
      success: t('saved'),
      after: () => {
        setShown({ ...form });
        setEditing(false);
      },
    });
  }

  const birth = form.cnp ? parseCnp(form.cnp)?.birthDate : null;
  const birthText = birth
    ? new Date(`${birth}T00:00:00Z`).toLocaleDateString(LOCALE_TAGS[locale], { timeZone: 'UTC' })
    : null;

  return (
    <Panel>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">{t('title')}</h2>
        {shown ? (
          <span className="flex gap-2">
            {!editing ? (
              <Button type="button" variant="ghost" onClick={() => setEditing(true)}>
                {t('edit')}
              </Button>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setShown(null);
                setEditing(false);
              }}
            >
              {t('hide')}
            </Button>
          </span>
        ) : (
          <Button type="button" variant="secondary" disabled={busy} onClick={show}>
            {t('show')}
          </Button>
        )}
      </div>
      <p className="mt-1 text-xs text-ink/60 dark:text-paper/60">{t('intro')}</p>
      {shown && !editing ? (
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
          {(['idSeries', 'idNumber', 'cnp'] as const).map((k) => (
            <div key={k}>
              <dt className="text-xs text-ink/60 dark:text-paper/60">{tf(k)}</dt>
              <dd className="font-mono">{shown[k] || t('notSet')}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {editing ? (
        <form onSubmit={save} className="mt-3 grid gap-3 sm:grid-cols-3">
          <Field label={tf('idSeries')}>
            <Input
              value={form.idSeries ?? ''}
              onChange={(e) => setForm({ ...form, idSeries: e.target.value.toUpperCase() })}
              maxLength={2}
              autoComplete="off"
            />
          </Field>
          <Field label={tf('idNumber')}>
            <Input
              value={form.idNumber ?? ''}
              onChange={(e) => setForm({ ...form, idNumber: e.target.value })}
              inputMode="numeric"
              maxLength={9}
              autoComplete="off"
            />
          </Field>
          <Field
            label={tf('cnp')}
            hint={birthText ? t('cnpBirth', { date: birthText }) : undefined}
          >
            <Input
              value={form.cnp ?? ''}
              onChange={(e) => setForm({ ...form, cnp: e.target.value })}
              inputMode="numeric"
              maxLength={13}
              autoComplete="off"
            />
          </Field>
          <div className="flex items-center gap-3 sm:col-span-3">
            <Button type="submit" disabled={busy}>
              {t('save')}
            </Button>
            <ErrorText>{error}</ErrorText>
          </div>
        </form>
      ) : null}
      {!editing ? <ErrorText>{error}</ErrorText> : null}
    </Panel>
  );
}
