'use client';

import { useState, type FormEvent } from 'react';
import { Button, formatDateTime, localDateTimeToUtc, useLocale, useT } from '@devquake/ui';
import { LIMITS } from '../lib/model';
import type { Incident } from '../lib/data';
import { callApi } from './call-api';
import { ErrorText, Field, Input, Panel, TextArea } from './ui';
import { useAction } from './use-action';

/** "Now" as the value of a datetime-local input in `timeZone`. */
function nowLocal(timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
}

/** The incident notes of a person: newest first, add one, delete your own (organisers: any). */
export function Incidents({
  path,
  incidents,
  timeZone,
  canWrite,
  texts = 'incidents',
}: {
  path: string;
  incidents: Incident[];
  timeZone: string;
  canWrite: boolean;
  /** Whose texts: the organisation's incidents or the medical notes (same shape). */
  texts?: 'incidents' | 'medNotes';
}) {
  const t = useT(texts);
  const tf = useT('fields');
  const locale = useLocale();
  const [when, setWhen] = useState(() => nowLocal(timeZone));
  const [note, setNote] = useState('');
  const { busy, error, act, confirm } = useAction();

  async function add(e: FormEvent) {
    e.preventDefault();
    const occurredAt = localDateTimeToUtc(when, timeZone);
    const saved = await act(
      () => callApi(path, 'POST', { occurredAt: occurredAt?.toISOString() ?? '', note }),
      { success: t('saved') },
    );
    if (saved) setNote('');
  }

  async function remove(id: number) {
    const ok = await confirm({
      title: t('deleteTitle'),
      body: t('deleteBody'),
      confirmLabel: t('delete'),
      danger: true,
    });
    if (ok) await act(() => callApi(`${path}/${id}`, 'DELETE'), { success: t('deleted') });
  }

  return (
    <Panel>
      <h2 className="font-semibold">{t('title')}</h2>
      <p className="mt-1 text-xs text-ink/60 dark:text-paper/60">{t('intro')}</p>
      {canWrite ? (
        <form onSubmit={add} className="mt-3 grid gap-3 sm:grid-cols-[12rem_1fr]">
          <Field label={tf('occurredAt')}>
            <Input
              type="datetime-local"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
              required
            />
          </Field>
          <Field label={tf('note')}>
            <TextArea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={LIMITS.incident}
              required
            />
          </Field>
          <div className="flex items-center gap-3 sm:col-span-2">
            <Button type="submit" disabled={busy}>
              {t('add')}
            </Button>
            <ErrorText>{error}</ErrorText>
          </div>
        </form>
      ) : null}
      {incidents.length === 0 ? (
        <p className="mt-3 text-sm text-ink/70 dark:text-paper/70">{t('empty')}</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {incidents.map((i) => (
            <li key={i.id} className="border-l-2 border-quake/60 pl-3">
              <p className="text-xs text-ink/60 dark:text-paper/60">
                {formatDateTime(i.occurredAt, timeZone, 'datetime', locale)}
                {i.author ? ` · ${t('by', { name: i.author })}` : ''}
              </p>
              <p className="text-sm whitespace-pre-line">{i.note}</p>
              {canWrite ? (
                <button
                  type="button"
                  className="mt-1 text-xs underline hover:text-quake"
                  onClick={() => remove(i.id)}
                >
                  {t('delete')}
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
