'use client';

import { useState, type FormEvent } from 'react';
import { Button, trackEvent, useT } from '@devquake/ui';
import { LIMITS } from '../lib/model';
import { callApi } from './call-api';
import { useFeedback } from './feedback';
import { ErrorText, Input } from './ui';
import { useAction } from './use-action';

/** Copies a text (an invite link) and says so. */
export function CopyButton({ text }: { text: string }) {
  const t = useT('members');
  const { toast } = useFeedback();
  return (
    <Button
      type="button"
      variant="secondary"
      onClick={() =>
        void navigator.clipboard
          .writeText(text)
          .then(() => toast(t('copied')))
          .catch(() => toast(t('copyFailed'), 'error'))
      }
    >
      {t('copy')}
    </Button>
  );
}

/** The invite link, its code and QR code; the owner can make a new one (the old stops working). */
export function InvitePanel({
  groupId,
  code,
  url,
  qr,
  isOwner,
}: {
  groupId: number;
  code: string;
  url: string;
  /** Branded QR code (SVG markup, made on the server). */
  qr: string;
  isOwner: boolean;
}) {
  const t = useT('members');
  const { busy, act, confirm } = useAction();
  return (
    <div className="grid gap-5 sm:grid-cols-[1fr_auto]">
      <div className="space-y-3">
        <h2 className="font-display text-lg font-semibold">{t('inviteTitle')}</h2>
        <p className="text-sm text-ink/70 dark:text-paper/70">{t('inviteBody')}</p>
        <p className="font-mono text-2xl tracking-widest">{code}</p>
        <p className="text-sm break-all text-ink/60 dark:text-paper/60">{url}</p>
        <div className="flex flex-wrap gap-2">
          <CopyButton text={url} />
          {isOwner ? (
            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              onClick={async () => {
                const ok = await confirm({
                  title: t('newLinkTitle'),
                  body: t('newLinkBody'),
                  confirmLabel: t('newLink'),
                });
                if (ok)
                  act(() => callApi(`/groups/${groupId}/invite`, 'POST'), {
                    success: t('newLinkDone'),
                  });
              }}
            >
              {t('newLink')}
            </Button>
          ) : null}
        </div>
      </div>
      <div
        className="size-40 justify-self-center overflow-hidden rounded-lg bg-white p-1 [&>svg]:size-full"
        role="img"
        aria-label={t('qr')}
        // Our own SVG, made by the QR library on the server.
        dangerouslySetInnerHTML={{ __html: qr }}
      />
    </div>
  );
}

/** The owner adds someone without a DevQuake account, by name. */
export function AddGuest({ groupId }: { groupId: number }) {
  const t = useT('members');
  const [name, setName] = useState('');
  const { busy, error, act } = useAction();
  function submit(event: FormEvent) {
    event.preventDefault();
    act(
      async () => {
        await callApi(`/groups/${groupId}/members`, 'POST', { name });
        trackEvent('expenses_guest_added');
        setName('');
      },
      { success: t('guestAdded', { name: name.trim() }) },
    );
  }
  return (
    <form onSubmit={submit} className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={LIMITS.memberName}
          placeholder={t('guestName')}
          aria-label={t('guestName')}
          className="max-w-xs flex-1"
          required
        />
        <Button type="submit" disabled={busy || !name.trim()}>
          {t('addGuest')}
        </Button>
      </div>
      <ErrorText>{error}</ErrorText>
    </form>
  );
}

/** The owner adds someone from their DevQuake referrals. */
export function AddFriend({
  groupId,
  userId,
  name,
}: {
  groupId: number;
  userId: number;
  name: string;
}) {
  const t = useT('members');
  const { busy, act } = useAction();
  return (
    <Button
      type="button"
      variant="secondary"
      className="px-3 py-1.5 text-sm"
      disabled={busy}
      aria-label={t('addFriendLabel', { name })}
      onClick={() =>
        act(
          async () => {
            await callApi(`/groups/${groupId}/members`, 'POST', { userId });
            trackEvent('expenses_friend_added');
          },
          { success: t('friendAdded', { name }) },
        )
      }
    >
      {t('addFriend')}
    </Button>
  );
}

/** Remove a member (owner) or leave the group (yourself): only with a zero balance. */
export function RemoveMember({
  groupId,
  memberId,
  name,
  self,
}: {
  groupId: number;
  memberId: number;
  name: string;
  self: boolean;
}) {
  const t = useT('members');
  const { busy, act, confirm, router } = useAction();
  return (
    <Button
      type="button"
      variant="ghost"
      className="px-2 py-1 text-xs text-red-700 dark:text-red-400"
      disabled={busy}
      onClick={async () => {
        const ok = await confirm({
          title: self ? t('leaveTitle') : t('removeTitle', { name }),
          body: self ? t('leaveBody') : t('removeBody', { name }),
          confirmLabel: self ? t('leave') : t('remove'),
          danger: true,
        });
        if (!ok) return;
        act(() => callApi(`/groups/${groupId}/members/${memberId}`, 'DELETE'), {
          success: self ? t('left') : t('removed', { name }),
          after: self ? () => router.push('/') : undefined,
        });
      }}
    >
      {self ? t('leave') : t('remove')}
    </Button>
  );
}

/** The owner renames someone they added by name. */
export function RenameGuest({
  groupId,
  memberId,
  name,
}: {
  groupId: number;
  memberId: number;
  name: string;
}) {
  const t = useT('members');
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const { busy, error, act } = useAction();
  if (!editing) {
    return (
      <Button
        type="button"
        variant="ghost"
        className="px-2 py-1 text-xs"
        onClick={() => setEditing(true)}
      >
        {t('rename')}
      </Button>
    );
  }
  return (
    <form
      className="flex w-full flex-wrap items-center gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        act(
          async () => {
            await callApi(`/groups/${groupId}/members/${memberId}`, 'PATCH', { name: value });
            setEditing(false);
          },
          { success: t('renamed') },
        );
      }}
    >
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        maxLength={LIMITS.memberName}
        aria-label={t('guestName')}
        className="max-w-xs flex-1"
        required
      />
      <Button type="submit" className="px-3 py-1.5 text-sm" disabled={busy}>
        {t('save')}
      </Button>
      <Button
        type="button"
        variant="ghost"
        className="px-3 py-1.5 text-sm"
        onClick={() => {
          setValue(name);
          setEditing(false);
        }}
      >
        {t('cancel')}
      </Button>
      <ErrorText>{error}</ErrorText>
    </form>
  );
}

/** The owner deletes the group with all its expenses, payments and comments. */
export function DeleteGroup({ groupId, name }: { groupId: number; name: string }) {
  const t = useT('members');
  const { busy, act, confirm, router } = useAction();
  return (
    <Button
      type="button"
      variant="ghost"
      className="text-red-700 dark:text-red-400"
      disabled={busy}
      onClick={async () => {
        const ok = await confirm({
          title: t('deleteGroupTitle', { name }),
          body: t('deleteGroupBody'),
          confirmLabel: t('deleteGroup'),
          danger: true,
        });
        if (!ok) return;
        act(() => callApi(`/groups/${groupId}`, 'DELETE'), {
          success: t('groupDeleted'),
          after: () => router.push('/'),
        });
      }}
    >
      {t('deleteGroup')}
    </Button>
  );
}

/** Opening an invite link signed in joins the group (free access for invitees, ADR 0043). */
export function JoinButton({ code }: { code: string }) {
  const t = useT('join');
  const { busy, error, act, router } = useAction();
  return (
    <div className="mt-4 space-y-2">
      <Button
        type="button"
        disabled={busy}
        onClick={() =>
          act(
            async () => {
              const res = await callApi<{ id: number }>('/join', 'POST', { code });
              trackEvent('expenses_group_joined');
              router.push(`/groups/${res!.id}`);
            },
            { success: t('joined'), after: () => undefined },
          )
        }
      >
        {t('join')}
      </Button>
      <ErrorText>{error}</ErrorText>
    </div>
  );
}
