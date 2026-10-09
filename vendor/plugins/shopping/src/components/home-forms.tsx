'use client';

import { useState, type FormEvent } from 'react';
import { Button, trackEvent, useT } from '@devquake/ui';
import type { IsoDate } from '../lib/dates';
import { CURRENCIES, INVITE_CODE_PATTERN } from '../lib/model';
import { callApi, errorMessage } from './call-api';
import { ErrorText, Field, Input, Select } from './ui';
import { useAppRouter } from './use-app-router';
import { useToday } from './use-today';

export function CreateListForm({ serverToday }: { serverToday: IsoDate }) {
  const router = useAppRouter();
  const t = useT('forms');
  const tErr = useT('errors');
  const today = useToday(serverToday);
  // The date follows "today" until the user picks one.
  const [picked, setPicked] = useState<IsoDate | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError('');
    try {
      const res = await callApi<{ id: number }>('/lists', 'POST', {
        name: form.get('name'),
        currency: form.get('currency'),
        shopDate: form.get('shopDate'),
      });
      trackEvent('list_created', { planned_ahead: (picked ?? today) > today });
      router.push(`/lists/${res!.id}`);
    } catch (err) {
      setError(errorMessage(err, tErr));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-3 space-y-3">
      <Field label={t('name')}>
        <Input name="name" required maxLength={80} placeholder={t('namePlaceholder')} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t('date')}>
          <Input
            type="date"
            name="shopDate"
            required
            value={picked ?? today}
            onChange={(e) => setPicked(e.target.value || null)}
          />
        </Field>
        <Field label={t('currency')}>
          <Select name="currency" defaultValue="RON">
            {CURRENCIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
        </Field>
      </div>
      <ErrorText>{error}</ErrorText>
      <Button type="submit" disabled={busy}>
        {busy ? t('creating') : t('create')}
      </Button>
    </form>
  );
}

export function JoinForm() {
  const router = useAppRouter();
  const t = useT('forms');
  const [error, setError] = useState('');

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = String(new FormData(event.currentTarget).get('code') ?? '')
      .trim()
      .toUpperCase();
    if (!INVITE_CODE_PATTERN.test(code)) {
      setError(t('codeInvalid'));
      return;
    }
    router.push(`/join/${code}`);
  }

  return (
    <form onSubmit={submit} className="mt-3 space-y-3">
      <Field label={t('code')} hint={t('codeHint')}>
        <Input
          name="code"
          required
          maxLength={8}
          autoComplete="off"
          className="font-mono uppercase tracking-widest"
          placeholder="K7MPX2QA"
        />
      </Field>
      <ErrorText>{error}</ErrorText>
      <Button type="submit" variant="secondary">
        {t('continue')}
      </Button>
    </form>
  );
}

/** "Join this list" on the invitation page. */
export function JoinButton({ code }: { code: string }) {
  const router = useAppRouter();
  const t = useT('forms');
  const tErr = useT('errors');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function join() {
    setBusy(true);
    setError('');
    try {
      const res = await callApi<{ id: number }>('/join', 'POST', { code });
      trackEvent('list_joined', { method: 'invite' });
      router.push(`/lists/${res!.id}`);
    } catch (err) {
      setError(errorMessage(err, tErr));
      setBusy(false);
    }
  }

  return (
    <div className="mt-5 space-y-2">
      <Button onClick={join} disabled={busy}>
        {busy ? t('joining') : t('join')}
      </Button>
      <ErrorText>{error}</ErrorText>
    </div>
  );
}

type CopyMode = 'list' | 'week' | 'month';

/**
 * "Copy lists": one list to a day, to every day of a week or of a month; a week's lists to the
 * other weeks of that month; a month's lists to the other months of the year. Lists already
 * there (same name and day) are not created twice.
 */
export function CopyListsForm({
  lists,
  serverToday,
}: {
  lists: { id: number; name: string; shopDate: IsoDate }[];
  serverToday: IsoDate;
}) {
  const router = useAppRouter();
  const t = useT('copy');
  const tErr = useT('errors');
  const today = useToday(serverToday);
  const [mode, setMode] = useState<CopyMode>(lists.length ? 'list' : 'week');
  const [listId, setListId] = useState<string>(lists[0] ? String(lists[0].id) : '');
  const [scope, setScope] = useState<'day' | 'week' | 'month'>('day');
  const [date, setDate] = useState<IsoDate | null>(null);
  const [month, setMonth] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const day = date ?? today;
  const monthValue = month ?? today.slice(0, 7);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body =
      mode === 'list'
        ? { mode, listId: Number(listId), scope, date: day }
        : mode === 'week'
          ? { mode, date: day }
          : { mode, month: monthValue };
    const confirmText =
      mode === 'week' ? t('confirmWeek') : mode === 'month' ? t('confirmMonth') : null;
    if (confirmText && !confirm(confirmText)) return;
    setBusy(true);
    setError('');
    setDone('');
    try {
      const res = await callApi<{ created: number; skipped: number }>('/copy', 'POST', body);
      trackEvent('lists_copied', { mode, created: res?.created ?? 0 });
      setDone(t('done', { count: res?.created ?? 0, skipped: res?.skipped ?? 0 }));
      router.refresh();
    } catch (err) {
      setError(errorMessage(err, tErr));
    } finally {
      setBusy(false);
    }
  }

  const option = (value: CopyMode, label: string) => (
    <label className="flex min-h-11 items-center gap-2 text-sm">
      <input
        type="radio"
        name="copy-mode"
        className="accent-quake"
        checked={mode === value}
        disabled={value === 'list' && lists.length === 0}
        onChange={() => setMode(value)}
      />
      {label}
    </label>
  );

  return (
    <form onSubmit={submit} className="mt-3 space-y-3">
      <fieldset>
        <legend className="mb-1 text-sm font-medium">{t('what')}</legend>
        {option('list', t('modeList'))}
        {option('week', t('modeWeek'))}
        {option('month', t('modeMonth'))}
      </fieldset>

      {mode === 'list' ? (
        <>
          <Field label={t('list')}>
            <Select value={listId} onChange={(e) => setListId(e.target.value)} required>
              {lists.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} · {l.shopDate}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t('to')}>
            <Select value={scope} onChange={(e) => setScope(e.target.value as typeof scope)}>
              <option value="day">{t('toDay')}</option>
              <option value="week">{t('toWeek')}</option>
              <option value="month">{t('toMonth')}</option>
            </Select>
          </Field>
          <Field
            label={scope === 'day' ? t('day') : scope === 'week' ? t('dayInWeek') : t('dayInMonth')}
          >
            <Input type="date" required value={day} onChange={(e) => setDate(e.target.value)} />
          </Field>
        </>
      ) : mode === 'week' ? (
        <Field label={t('dayInWeek')} hint={t('weekHint')}>
          <Input type="date" required value={day} onChange={(e) => setDate(e.target.value)} />
        </Field>
      ) : (
        <Field label={t('month')} hint={t('monthHint')}>
          <Input
            type="month"
            required
            value={monthValue}
            onChange={(e) => setMonth(e.target.value)}
          />
        </Field>
      )}

      <ErrorText>{error}</ErrorText>
      {done ? (
        <p role="status" className="text-sm text-emerald-700 dark:text-emerald-400">
          {done}
        </p>
      ) : null}
      <Button type="submit" variant="secondary" disabled={busy}>
        {busy ? t('copying') : t('copy')}
      </Button>
    </form>
  );
}
