'use client';

import { useState } from 'react';
import { Button, useT } from '@devquake/ui';
import { STAFF_ROLES, type StaffRole } from '../lib/roles';
import { callApi } from './call-api';
import { useFeedback } from './feedback';
import { Panel } from './ui';
import { useAction } from './use-action';

/** Checkboxes for one or more roles. */
function RolePicker({
  value,
  onChange,
  name,
}: {
  value: StaffRole[];
  onChange: (roles: StaffRole[]) => void;
  name: string;
}) {
  const tRoles = useT('team.roles');
  return (
    <fieldset className="flex flex-wrap gap-2">
      <legend className="sr-only">{name}</legend>
      {STAFF_ROLES.map((r) => (
        <label
          key={r}
          className="inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-full border border-ink/15 px-3 py-1 text-sm has-[:checked]:border-quake has-[:checked]:bg-quake/10 dark:border-paper/15"
        >
          <input
            type="checkbox"
            checked={value.includes(r)}
            onChange={(e) =>
              onChange(STAFF_ROLES.filter((x) => (x === r ? e.target.checked : value.includes(x))))
            }
            className="accent-quake"
          />
          {tRoles(r)}
        </label>
      ))}
    </fieldset>
  );
}

function MemberRow({
  member,
}: {
  member: { userId: number; displayName: string; roles: StaffRole[]; since: string };
}) {
  const t = useT('team');
  const { busy, act, confirm } = useAction();
  const [roles, setRoles] = useState(member.roles);
  const changed = roles.join() !== member.roles.join();
  return (
    <li className="space-y-2 p-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="min-w-0 flex-1">
          <span className="block font-medium">{member.displayName}</span>
          <span className="block text-xs text-ink/60 dark:text-paper/60">
            {t('since', { date: member.since })}
          </span>
        </span>
        <Button
          type="button"
          variant="ghost"
          disabled={busy}
          onClick={async () => {
            const ok = await confirm({
              title: t('removeTitle', { name: member.displayName }),
              body: t('removeBody'),
              confirmLabel: t('remove'),
              danger: true,
            });
            if (ok)
              await act(() => callApi(`/team/${member.userId}`, 'DELETE'), {
                success: t('removed'),
              });
          }}
        >
          {t('remove')}
        </Button>
      </div>
      <RolePicker
        value={roles}
        onChange={setRoles}
        name={t('roleOf', { name: member.displayName })}
      />
      {changed ? (
        <Button
          type="button"
          disabled={busy || roles.length === 0}
          onClick={() =>
            act(() => callApi(`/team/${member.userId}`, 'PATCH', { roles }), {
              success: t('roleSaved'),
            })
          }
        >
          {t('saveRoles')}
        </Button>
      ) : null}
    </li>
  );
}

/** Members of the team with their roles, open invitations, and making a new invitation link. */
export function TeamEditor({
  staff,
  invites,
}: {
  staff: Array<{ userId: number; displayName: string; roles: StaffRole[]; since: string }>;
  invites: Array<{ id: string; roles: StaffRole[]; expires: string }>;
}) {
  const t = useT('team');
  const tRoles = useT('team.roles');
  const { toast } = useFeedback();
  const { busy, act } = useAction();
  const [roles, setRoles] = useState<StaffRole[]>(['catalog']);
  const [link, setLink] = useState<string | null>(null);
  const names = (list: StaffRole[]) => list.map((r) => tRoles(r)).join(', ');

  return (
    <div className="space-y-6">
      <Panel className="space-y-3">
        <h2 className="font-display text-lg font-semibold">{t('roleTitle')}</h2>
        <p className="text-sm text-ink/60 dark:text-paper/60">{t('rolesIntro')}</p>
        <ul className="space-y-1 text-sm">
          <li>
            <span className="font-medium">{tRoles('owner')}</span> — {t('roleHint.owner')}
          </li>
          {STAFF_ROLES.map((r) => (
            <li key={r}>
              <span className="font-medium">{tRoles(r)}</span> — {t(`roleHint.${r}`)}
            </li>
          ))}
        </ul>
      </Panel>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold">{t('members')}</h2>
        {staff.length === 0 ? (
          <p className="text-sm text-ink/60 dark:text-paper/60">{t('noMembers')}</p>
        ) : (
          <ul className="divide-y divide-ink/10 rounded-xl border border-ink/10 dark:divide-paper/10 dark:border-paper/10">
            {staff.map((s) => (
              <MemberRow key={s.userId} member={s} />
            ))}
          </ul>
        )}
      </section>

      <Panel className="space-y-3">
        <h2 className="font-display text-lg font-semibold">{t('invite')}</h2>
        <p className="text-sm text-ink/60 dark:text-paper/60">{t('inviteHint')}</p>
        <RolePicker value={roles} onChange={setRoles} name={t('role')} />
        <Button
          type="button"
          disabled={busy || roles.length === 0}
          onClick={() =>
            act(
              async () => {
                const res = await callApi<{ link: string }>('/team/invites', 'POST', { roles });
                setLink(res?.link ?? null);
              },
              { success: t('inviteMade') },
            )
          }
        >
          {t('makeLink')}
        </Button>
        {link ? (
          <div className="flex flex-wrap gap-2">
            <input
              readOnly
              value={link}
              aria-label={t('link')}
              onFocus={(e) => e.currentTarget.select()}
              className="min-h-11 min-w-0 flex-1 rounded-md border border-ink/15 bg-white px-3 text-sm text-ink dark:border-paper/15 dark:bg-ink dark:text-paper"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={async () => {
                await navigator.clipboard?.writeText(link).catch(() => undefined);
                toast(t('copied'));
              }}
            >
              {t('copy')}
            </Button>
          </div>
        ) : null}
        {link ? <p className="text-xs text-ink/60 dark:text-paper/60">{t('linkOnce')}</p> : null}
        {invites.length > 0 ? (
          <ul className="space-y-1 text-sm">
            {invites.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center gap-2">
                <span>{t('openInvite', { role: names(i.roles), date: i.expires })}</span>
                <button
                  type="button"
                  className="text-xs underline hover:text-quake"
                  disabled={busy}
                  onClick={() =>
                    act(() => callApi(`/team/invites/${i.id}`, 'DELETE'), { success: t('revoked') })
                  }
                >
                  {t('revoke')}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </Panel>
    </div>
  );
}

/** For a member of a team: joining from an invitation, or leaving. */
export function JoinButton({ code, leave = false }: { code?: string; leave?: boolean }) {
  const t = useT('team');
  const { busy, error, act, router } = useAction();
  return (
    <div className="space-y-2">
      <Button
        type="button"
        disabled={busy}
        onClick={() =>
          act(() => (leave ? callApi('/team/leave', 'POST') : callApi('/join', 'POST', { code })), {
            success: leave ? t('left') : t('joined'),
            after: () => router.push('/'),
          })
        }
      >
        {leave ? t('leave') : t('join')}
      </Button>
      {error ? (
        <p role="alert" className="text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
