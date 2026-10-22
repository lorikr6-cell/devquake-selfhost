'use client';

import { useState } from 'react';
import { Button, formatDateTime, useLocale, useT } from '@devquake/ui';
import type { Invite, StaffMember } from '../lib/data';
import { ROLES, type Role } from '../lib/roles';
import { callApi } from './call-api';
import { ErrorText, Field, Input, Panel, Select } from './ui';
import { useAction } from './use-action';

/** The organisation's staff with their roles (organisers change and remove them). */
export function StaffList({
  orgId,
  staff,
  myUserId,
}: {
  orgId: number;
  staff: StaffMember[];
  myUserId: number;
}) {
  const t = useT();
  const { busy, act, confirm } = useAction();

  async function setRole(member: StaffMember, role: Role) {
    await act(() => callApi(`/orgs/${orgId}/staff/${member.id}`, 'PATCH', { role }), {
      success: t('staff.roleSaved', { name: member.name, role: t(`roles.${role}`) }),
    });
  }

  async function remove(member: StaffMember) {
    const ok = await confirm({
      title: t('staff.removeTitle', { name: member.name }),
      body: t('staff.removeBody'),
      confirmLabel: t('staff.remove'),
      danger: true,
    });
    if (ok) {
      await act(() => callApi(`/orgs/${orgId}/staff/${member.id}`, 'DELETE'), {
        success: t('staff.removed'),
      });
    }
  }

  return (
    <ul className="divide-y divide-ink/10 rounded-xl border border-ink/10 bg-white/70 dark:divide-paper/10 dark:border-paper/10 dark:bg-paper/5">
      {staff.map((m) => (
        <li key={m.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
          <span className="min-w-0 flex-1 font-medium">
            {m.name}
            {m.userId === myUserId ? (
              <span className="ml-2 text-xs text-ink/60 dark:text-paper/60">{t('staff.you')}</span>
            ) : null}
          </span>
          <Select
            value={m.role}
            disabled={busy}
            aria-label={t('staff.roleOf', { name: m.name })}
            onChange={(e) => setRole(m, e.target.value as Role)}
            className="w-auto"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {t(`roles.${r}`)}
              </option>
            ))}
          </Select>
          <Button type="button" variant="ghost" disabled={busy} onClick={() => remove(m)}>
            {t('staff.remove')}
          </Button>
        </li>
      ))}
    </ul>
  );
}

/** Makes a one-time invitation link with a role, and lists the unused ones. */
export function Invites({
  orgId,
  invites,
  timeZone,
}: {
  orgId: number;
  invites: Invite[];
  timeZone: string;
}) {
  const t = useT();
  const locale = useLocale();
  const [role, setRole] = useState<Role>('coordinator');
  const [link, setLink] = useState('');
  const { busy, error, act } = useAction();
  const linkOf = (code: string) => `${window.location.origin}/join/${code}`;

  async function create() {
    await act(async () => {
      const answer = await callApi<{ code: string }>(`/orgs/${orgId}/invites`, 'POST', { role });
      setLink(linkOf(answer!.code));
    });
  }

  async function copy(text: string) {
    await navigator.clipboard.writeText(text).catch(() => undefined);
  }

  return (
    <Panel>
      <h2 className="font-semibold">{t('staff.inviteTitle')}</h2>
      <p className="mt-1 text-xs text-ink/60 dark:text-paper/60">{t('staff.inviteIntro')}</p>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <Field label={t('staff.role')}>
          <Select value={role} onChange={(e) => setRole(e.target.value as Role)}>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {t(`roles.${r}`)}
              </option>
            ))}
          </Select>
        </Field>
        <Button type="button" disabled={busy} onClick={create}>
          {t('staff.createLink')}
        </Button>
      </div>
      <ErrorText>{error}</ErrorText>
      {link ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Input readOnly value={link} className="min-w-0 flex-1 font-mono text-xs" />
          <Button type="button" variant="secondary" onClick={() => copy(link)}>
            {t('staff.copy')}
          </Button>
        </div>
      ) : null}
      {invites.length ? (
        <>
          <h3 className="mt-5 mb-2 text-sm font-semibold">{t('staff.pending')}</h3>
          <ul className="space-y-2 text-sm">
            {invites.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{t(`roles.${i.role}`)}</span>
                <span className="text-xs text-ink/60 dark:text-paper/60">
                  {t('staff.until', {
                    date: formatDateTime(i.expiresAt, timeZone, 'date', locale),
                  })}
                </span>
                <Button type="button" variant="ghost" onClick={() => copy(linkOf(i.code))}>
                  {t('staff.copy')}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={busy}
                  onClick={() =>
                    act(() => callApi(`/orgs/${orgId}/invites/${i.id}`, 'DELETE'), {
                      success: t('staff.revoked'),
                    })
                  }
                >
                  {t('staff.revoke')}
                </Button>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </Panel>
  );
}

/** Joins the organisation behind an invitation, then opens it. */
export function JoinButton({ code }: { code: string }) {
  const t = useT('join');
  const { busy, error, act, router } = useAction();
  async function join() {
    let id = 0;
    await act(
      async () => {
        id = (await callApi<{ id: number }>('/join', 'POST', { code }))!.id;
      },
      { success: t('joined'), after: () => router.push(`/orgs/${id}`) },
    );
  }
  return (
    <div className="mt-4">
      <Button type="button" disabled={busy} onClick={join}>
        {t('join')}
      </Button>
      <ErrorText>{error}</ErrorText>
    </div>
  );
}
