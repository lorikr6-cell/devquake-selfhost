'use client';

import { useState, type FormEvent } from 'react';
import { Button, trackEvent, useT } from '@devquake/ui';
import { INVITE_CODE_PATTERN } from '../lib/model';
import { callApi } from './call-api';
import { ErrorText, Field, Input } from './ui';
import { useAction } from './use-action';
import { useAppRouter } from './use-app-router';

export function CopyButton({ text }: { text: string }) {
  const t = useT('share');
  const [copied, setCopied] = useState(false);
  // Copying blocked (older browsers, some in-app browsers): the link to select by hand.
  const [manual, setManual] = useState(false);
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
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
            setManual(true);
          }
        }}
      >
        {copied ? t('copied') : t('copy')}
      </Button>
      {manual ? (
        <input
          readOnly
          value={text}
          aria-label={t('copyPrompt')}
          onFocus={(e) => e.currentTarget.select()}
          autoFocus
          className="min-w-0 flex-1 rounded-md border border-ink/20 bg-white px-2 py-1 text-xs dark:border-paper/20 dark:bg-paper/5"
        />
      ) : null}
    </span>
  );
}

export function RotateInviteButton({ utilityId }: { utilityId: number }) {
  const t = useT('share');
  const { busy, error, act, confirm } = useAction();
  return (
    <span className="inline-flex flex-col gap-1">
      <Button
        type="button"
        variant="ghost"
        disabled={busy}
        onClick={async () => {
          const ok = await confirm({ title: t('newLinkConfirm'), confirmLabel: t('newLink') });
          if (ok) act(() => callApi(`/utilities/${utilityId}/invite`, 'POST'));
        }}
      >
        {t('newLink')}
      </Button>
      <ErrorText>{error}</ErrorText>
    </span>
  );
}

export function AddFriendButton({
  utilityId,
  userId,
  name,
}: {
  utilityId: number;
  userId: number;
  name: string;
}) {
  const t = useT('share');
  const { busy, error, act } = useAction();
  return (
    <span className="inline-flex flex-col items-end gap-1">
      <Button
        type="button"
        disabled={busy}
        aria-label={t('addLabel', { name })}
        onClick={() =>
          act(async () => {
            await callApi(`/utilities/${utilityId}/members`, 'POST', { userId });
            trackEvent('friend_added');
          })
        }
      >
        {busy ? t('adding') : t('add')}
      </Button>
      <ErrorText>{error}</ErrorText>
    </span>
  );
}

export function RemoveMemberButton({
  utilityId,
  userId,
  name,
  leave,
}: {
  utilityId: number;
  userId: number;
  name: string;
  leave: boolean;
}) {
  const t = useT('share');
  const { busy, error, act, router, confirm } = useAction();
  return (
    <span className="inline-flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="ghost"
        disabled={busy}
        onClick={async () => {
          const ok = await confirm({
            title: leave ? t('leaveConfirm') : t('removeConfirm', { name }),
            confirmLabel: leave ? t('leave') : t('remove'),
            danger: true,
          });
          if (!ok) return;
          act(
            () => callApi(`/utilities/${utilityId}/members/${userId}`, 'DELETE'),
            leave ? () => router.push('/') : undefined,
          );
        }}
      >
        {leave ? t('leave') : t('remove')}
      </Button>
      <ErrorText>{error}</ErrorText>
    </span>
  );
}

/** Home: type an invite code (or open the link) to join someone's utility. */
export function JoinForm() {
  const t = useT('join');
  const router = useAppRouter();
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

export function JoinButton({ code }: { code: string }) {
  const t = useT('join');
  const { busy, error, act, router } = useAction();
  return (
    <div className="mt-5 space-y-2">
      <Button
        disabled={busy}
        onClick={() =>
          act(
            async () => {
              const res = await callApi<{ id: number }>('/join', 'POST', { code });
              trackEvent('utility_joined', { method: 'invite' });
              router.push(`/utilities/${res!.id}`);
            },
            () => undefined,
          )
        }
      >
        {busy ? t('joining') : t('join')}
      </Button>
      <ErrorText>{error}</ErrorText>
    </div>
  );
}

/**
 * Manager: a member only sees the bills (a family member, pays nothing) or shares them. The
 * change applies to bills they have not sent a reading or paid for yet.
 */
export function ViewOnlySwitch({
  utilityId,
  userId,
  viewOnly,
}: {
  utilityId: number;
  userId: number;
  viewOnly: boolean;
}) {
  const t = useT('share');
  const { busy, error, act } = useAction();
  return (
    <div className="mt-2 space-y-1">
      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          className="mt-0.5 size-4 accent-quake"
          checked={viewOnly}
          disabled={busy}
          onChange={(e) =>
            act(() =>
              callApi(`/utilities/${utilityId}/members/${userId}`, 'PATCH', {
                viewOnly: e.target.checked,
              }),
            )
          }
        />
        <span>
          <span className="block font-medium">{t('viewOnly')}</span>
          <span className="block text-xs text-ink/60 dark:text-paper/60">{t('viewOnlyHint')}</span>
        </span>
      </label>
      <ErrorText>{error}</ErrorText>
    </div>
  );
}
