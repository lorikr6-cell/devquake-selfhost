'use client';

import { useState, type FormEvent } from 'react';
import { Button, trackEvent, useT } from '@devquake/ui';
import { CURRENCIES } from '../lib/model';
import { callApi, errorMessage } from './call-api';
import { ErrorText, Field, Input, Select } from './ui';
import { useAppRouter } from './use-app-router';

/** Runs an API call, then re-renders the server page; returns the error message, if any. */
function useAction() {
  const router = useAppRouter();
  const tErr = useT('errors');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function act(change: () => Promise<unknown>, after?: () => void) {
    setBusy(true);
    setError('');
    try {
      await change();
      if (after) after();
      else router.refresh();
    } catch (err) {
      setError(errorMessage(err, tErr));
    } finally {
      setBusy(false);
    }
  }
  return { busy, error, act, router };
}

export function CopyButton({ text, label }: { text: string; label?: string }) {
  const t = useT('share');
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant="secondary"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          trackEvent('invite_link_copied');
          setTimeout(() => setCopied(false), 2000);
        } catch {
          prompt(t('copyPrompt'), text);
        }
      }}
    >
      {copied ? t('copied') : (label ?? t('copy'))}
    </Button>
  );
}

export function RotateInviteButton({ listId }: { listId: number }) {
  const { busy, error, act } = useAction();
  const t = useT('share');
  return (
    <span className="inline-flex flex-col gap-1">
      <Button
        type="button"
        variant="ghost"
        disabled={busy}
        onClick={() => {
          if (confirm(t('newLinkConfirm'))) {
            act(() => callApi(`/lists/${listId}/invite`, 'POST'));
          }
        }}
      >
        {t('newLink')}
      </Button>
      <ErrorText>{error}</ErrorText>
    </span>
  );
}

export function AddFriendButton({
  listId,
  userId,
  name,
}: {
  listId: number;
  userId: number;
  name: string;
}) {
  const { busy, error, act } = useAction();
  const t = useT('share');
  return (
    <span className="inline-flex flex-col items-end gap-1">
      <Button
        type="button"
        disabled={busy}
        onClick={() =>
          act(async () => {
            await callApi(`/lists/${listId}/members`, 'POST', { userId });
            trackEvent('friend_added');
          })
        }
        aria-label={t('addLabel', { name })}
      >
        {busy ? t('adding') : t('add')}
      </Button>
      <ErrorText>{error}</ErrorText>
    </span>
  );
}

export function RemoveMemberButton({
  listId,
  userId,
  name,
  leave = false,
}: {
  listId: number;
  userId: number;
  name: string;
  leave?: boolean;
}) {
  const { busy, error, act, router } = useAction();
  const t = useT('share');
  return (
    <span className="inline-flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="ghost"
        disabled={busy}
        className="text-red-700 dark:text-red-400"
        onClick={() => {
          const question = leave ? t('leaveConfirm') : t('removeConfirm', { name });
          if (confirm(question)) {
            act(
              () => callApi(`/lists/${listId}/members/${userId}`, 'DELETE'),
              leave ? () => router.push('/') : undefined,
            );
          }
        }}
      >
        {leave ? t('leave') : t('remove')}
      </Button>
      <ErrorText>{error}</ErrorText>
    </span>
  );
}

export function ListSettingsForm({
  listId,
  name,
  currency,
  shopDate,
}: {
  listId: number;
  name: string;
  currency: string;
  shopDate: string;
}) {
  const { busy, error, act, router } = useAction();
  const t = useT('forms');

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    act(() =>
      callApi(`/lists/${listId}`, 'PATCH', {
        name: form.get('name'),
        currency: form.get('currency'),
        shopDate: form.get('shopDate'),
      }),
    );
  }

  return (
    <form onSubmit={save} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-4">
        <Field label={t('name')} className="sm:col-span-2">
          <Input name="name" required maxLength={80} defaultValue={name} />
        </Field>
        <Field label={t('date')}>
          <Input type="date" name="shopDate" required defaultValue={shopDate} />
        </Field>
        <Field label={t('currency')}>
          <Select name="currency" defaultValue={currency}>
            {CURRENCIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
        </Field>
      </div>
      <ErrorText>{error}</ErrorText>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={busy}>
          {t('save')}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="ml-auto text-red-700 dark:text-red-400"
          disabled={busy}
          onClick={() => {
            if (confirm(t('deleteConfirm', { name }))) {
              act(
                () => callApi(`/lists/${listId}`, 'DELETE'),
                () => router.push('/'),
              );
            }
          }}
        >
          {t('deleteList')}
        </Button>
      </div>
    </form>
  );
}
