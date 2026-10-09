import type { PluginPageProps } from '@devquake/plugin-sdk';
import { localizePath } from '@devquake/ui';
import { brandedQrSvg } from '@devquake/ui/qr';
import { localeOf, translator } from '../i18n';
import { GroupForm } from '../components/group-form';
import { BalanceText, GroupShell } from '../components/group-shell';
import { groupScope, moneyIn, nameOf } from '../components/guard';
import {
  AddFriend,
  AddGuest,
  DeleteGroup,
  InvitePanel,
  RemoveMember,
  RenameGuest,
} from '../components/members';
import { Panel } from '../components/ui';
import { groupById, hasMoney, inviteCode, ledgerOf } from '../lib/data';
import { initials } from '../lib/model';

export async function generateMetadata({ ctx, params }: PluginPageProps) {
  const t = translator(localeOf(ctx));
  const group =
    ctx.db && ctx.user ? await groupById(ctx.db, Number(params.id)).catch(() => null) : null;
  return { title: group ? t('meta.members', { name: group.name }) : t('meta.home') };
}

/** Who is in the group, inviting and adding people, and the owner's settings. */
export default async function MembersPage({ ctx, params }: PluginPageProps) {
  const scope = await groupScope(ctx, params);
  if (!scope.ok) return scope.notice;
  const { db, group, me, members, locale } = scope;
  const t = translator(locale);
  const tGroup = translator(locale, 'group');
  const tMem = translator(locale, 'members');
  const tBal = translator(locale, 'balances');
  const money = moneyIn(locale, group.currency);
  const [ledger, code, used] = await Promise.all([
    ledgerOf(db, group.id),
    inviteCode(db, group.id, scope.user.id),
    hasMoney(db, group.id),
  ]);
  const url = `${ctx.baseUrl}${localizePath(`/join/${code}`, locale)}`;
  const active = members.filter((m) => m.active);
  // DevQuake referrals who are not in the group yet (owner only).
  const inGroup = new Set(active.map((m) => m.userId).filter((id): id is number => id !== null));
  const friends = me.isOwner
    ? ((await ctx.people?.referrals().catch(() => [])) ?? []).filter((p) => !inGroup.has(p.id))
    : [];

  return (
    <GroupShell
      group={group}
      tab="members"
      members={active.length}
      balance={
        <BalanceText cents={ledger.balance.get(me.memberId) ?? 0} money={money} t={tGroup} />
      }
      t={tGroup}
      tKinds={translator(locale, 'kinds')}
    >
      <Panel flush>
        <h2 className="px-5 pt-4 font-display text-lg font-semibold">{tMem('title')}</h2>
        <ul className="divide-y divide-ink/10 dark:divide-paper/10">
          {active.map((m) => {
            const cents = ledger.balance.get(m.id) ?? 0;
            return (
              <li key={m.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                <span
                  aria-hidden
                  className="grid size-9 shrink-0 place-items-center rounded-full bg-quake/10 text-sm font-semibold"
                >
                  {initials(nameOf(members, m.id, t))}
                </span>
                <span className="min-w-0 flex-1 text-sm">
                  <span className="block font-medium">
                    {nameOf(members, m.id, t)}
                    {m.id === me.memberId ? ` (${tMem('you')})` : ''}
                  </span>
                  <span className="block text-xs text-ink/60 dark:text-paper/60">
                    {[
                      m.role === 'owner' ? tMem('owner') : null,
                      m.hasAccount ? null : tMem('noAccount'),
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </span>
                <BalanceText cents={cents} money={money} t={tBal} className="text-sm" />
                <span className="flex flex-wrap items-center gap-1">
                  {me.isOwner && !m.hasAccount ? (
                    <RenameGuest groupId={group.id} memberId={m.id} name={m.name} />
                  ) : null}
                  {m.role !== 'owner' && (me.isOwner || m.id === me.memberId) ? (
                    <RemoveMember
                      groupId={group.id}
                      memberId={m.id}
                      name={nameOf(members, m.id, t)}
                      self={m.id === me.memberId}
                    />
                  ) : null}
                </span>
              </li>
            );
          })}
        </ul>
        <p className="px-5 py-3 text-xs text-ink/60 dark:text-paper/60">{tMem('settleHint')}</p>
      </Panel>

      <Panel>
        <InvitePanel
          groupId={group.id}
          code={code}
          url={url}
          qr={brandedQrSvg(url)}
          isOwner={me.isOwner}
        />
      </Panel>

      {me.isOwner ? (
        <>
          <Panel className="space-y-3">
            <h2 className="font-display text-lg font-semibold">{tMem('guestTitle')}</h2>
            <p className="text-sm text-ink/70 dark:text-paper/70">{tMem('guestBody')}</p>
            <AddGuest groupId={group.id} />
          </Panel>
          {friends.length > 0 ? (
            <Panel className="space-y-3">
              <h2 className="font-display text-lg font-semibold">{tMem('friendsTitle')}</h2>
              <p className="text-sm text-ink/70 dark:text-paper/70">{tMem('friendsBody')}</p>
              <ul className="space-y-2">
                {friends.map((f) => (
                  <li key={f.id} className="flex items-center justify-between gap-3 text-sm">
                    <span>{f.displayName}</span>
                    <AddFriend groupId={group.id} userId={f.id} name={f.displayName} />
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}
          <Panel className="space-y-3">
            <h2 className="font-display text-lg font-semibold">{tMem('settingsTitle')}</h2>
            <GroupForm
              group={{ id: group.id, name: group.name, kind: group.kind, currency: group.currency }}
              currencyLocked={used}
            />
            <div className="border-t border-ink/10 pt-3 dark:border-paper/10">
              <DeleteGroup groupId={group.id} name={group.name} />
            </div>
          </Panel>
        </>
      ) : null}
    </GroupShell>
  );
}
