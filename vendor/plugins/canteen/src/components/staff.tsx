'use client';

import { useState } from 'react';
import { AutoCheckbox, Button, formatDateTime, useLocale, useT } from '@devquake/ui';
import type { SentInvite, StaffMember } from '../lib/data';
import { ROLES, type Role } from '../lib/roles';
import { callApi } from './call-api';
import { InviteCard, type InviteWithQr } from './invite-card';
import { ErrorText, Field, Input, Panel, Select } from './ui';
import { useAppRouter } from './use-app-router';
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
  const router = useAppRouter();

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

  // Grouped by role, every role shown (with "nobody yet"), so gaps are visible at a glance.
  return (
    <div className="space-y-4">
      {ROLES.map((role) => {
        const members = staff.filter((m) => m.roles.includes(role));
        return (
          <section key={role}>
            <h3 className="mb-1 text-sm font-semibold">
              {t(`roles.${role}`)}{' '}
              <span className="font-normal text-ink/60 dark:text-paper/60">({members.length})</span>
            </h3>
            {members.length === 0 ? (
              <p className="text-sm text-ink/60 dark:text-paper/60">{t('staff.nobody')}</p>
            ) : (
              <ul className="divide-y divide-ink/10 rounded-xl border border-ink/10 bg-white/70 dark:divide-paper/10 dark:border-paper/10 dark:bg-paper/5">
                {members.map((m) => (
                  <li key={m.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                    <span className="min-w-0 flex-1 font-medium">
                      {m.name}
                      {m.userId === myUserId ? (
                        <span className="ml-2 text-xs text-ink/60 dark:text-paper/60">
                          {t('staff.you')}
                        </span>
                      ) : null}
                    </span>
                    {m.roles.length > 1 || m.socialWorker ? (
                      <span className="text-xs text-ink/60 dark:text-paper/60">
                        {[
                          ...m.roles.map((r) => t(`roles.${r}`)),
                          ...(m.socialWorker ? [t('staff.socialWorker')] : []),
                        ].join(' · ')}
                      </span>
                    ) : null}
                    <details className="w-full sm:w-auto">
                      <summary className="cursor-pointer text-sm underline hover:text-quake">
                        {t('staff.rolesOf', { name: m.name })}
                      </summary>
                      <div className="mt-2 space-y-1">
                        {ROLES.map((r) => (
                          <AutoCheckbox
                            key={r}
                            checked={m.roles.includes(r)}
                            label={t(`roles.${r}`)}
                            messages={{
                              on: t('staff.roleOn', { name: m.name, role: t(`roles.${r}`) }),
                              off: t('staff.roleOff', { name: m.name, role: t(`roles.${r}`) }),
                              failed: t('staff.roleFailed'),
                            }}
                            onSave={async (on) => {
                              await callApi(`/orgs/${orgId}/staff/${m.id}`, 'PATCH', {
                                role: r,
                                on,
                              });
                              router.refresh();
                            }}
                          />
                        ))}
                        <AutoCheckbox
                          checked={m.socialWorker}
                          label={
                            m.userId === myUserId
                              ? t('staff.imSocialWorker')
                              : t('staff.socialWorker')
                          }
                          hint={t('staff.socialWorkerHint')}
                          messages={{
                            on: t('staff.socialOn', { name: m.name }),
                            off: t('staff.socialOff', { name: m.name }),
                            failed: t('staff.roleFailed'),
                          }}
                          onSave={async (on) => {
                            await callApi(`/orgs/${orgId}/staff/${m.id}/social`, 'PUT', { on });
                            router.refresh();
                          }}
                        />
                      </div>
                    </details>
                    <Button type="button" variant="ghost" disabled={busy} onClick={() => remove(m)}>
                      {t('staff.remove')}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}

const STATUS_STYLE: Record<SentInvite['status'], string> = {
  open: 'bg-sky-100 text-sky-950 dark:bg-sky-900/60 dark:text-sky-100',
  accepted: 'bg-emerald-100 text-emerald-950 dark:bg-emerald-900/60 dark:text-emerald-100',
  expired: 'bg-ink/10 text-ink/70 dark:bg-paper/15 dark:text-paper/70',
  revoked: 'bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-100',
};

/** Every invitation of the last months with its status: open, accepted (by whom), expired, revoked. */
export function SentInvites({ invites, timeZone }: { invites: SentInvite[]; timeZone: string }) {
  const t = useT();
  const locale = useLocale();
  const day = (d: string) => formatDateTime(d, timeZone, 'date', locale);
  if (invites.length === 0) {
    return <p className="text-sm text-ink/60 dark:text-paper/60">{t('staff.noneSent')}</p>;
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-ink/10 dark:border-paper/10">
      <table className="w-full min-w-[34rem] text-left text-sm">
        <thead className="bg-ink/5 text-xs text-ink/70 dark:bg-paper/5 dark:text-paper/70">
          <tr>
            <th className="px-3 py-2 font-medium">{t('staff.role')}</th>
            <th className="px-3 py-2 font-medium">{t('staff.sentOn')}</th>
            <th className="px-3 py-2 font-medium">{t('staff.sentBy')}</th>
            <th className="px-3 py-2 font-medium">{t('staff.status')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink/10 dark:divide-paper/10">
          {invites.map((i) => (
            <tr key={i.id}>
              <td className="px-3 py-2">{t(`roles.${i.role}`)}</td>
              <td className="px-3 py-2 whitespace-nowrap">
                {day(i.createdAt)}
                {i.emailHint ? (
                  <span className="block text-xs text-ink/60 dark:text-paper/60">
                    {i.emailHint}
                  </span>
                ) : null}
              </td>
              <td className="px-3 py-2">{i.createdBy ?? '—'}</td>
              <td className="px-3 py-2">
                <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_STYLE[i.status]}`}>
                  {i.status === 'accepted'
                    ? t('staff.statusAccepted', { name: i.acceptedName ?? '—', date: day(i.when) })
                    : t(`staff.status_${i.status}`, { date: day(i.when) })}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Makes a one-time invitation link with a role, and lists the unused ones. */
export function Invites({
  orgId,
  invites,
  timeZone,
  canEmail,
}: {
  orgId: number;
  invites: InviteWithQr[];
  timeZone: string;
  /** The host can email invitations (ADR 0073). */
  canEmail: boolean;
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
          <ul className="space-y-3">
            {invites.map((i) => (
              <InviteCard
                key={i.id}
                orgId={orgId}
                invite={i}
                timeZone={timeZone}
                canEmail={canEmail}
              />
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
