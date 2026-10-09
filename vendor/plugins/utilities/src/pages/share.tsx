import { notFound } from 'next/navigation';
import { brandedQrSvg } from '@devquake/ui/qr';
import type { PluginPageProps, PluginPerson } from '@devquake/plugin-sdk';
import { LOCALE_TAGS, Link, rich } from '@devquake/ui';
import { localeOf, translator } from '../i18n';
import { pageScope, requireProfile } from '../components/guard';
import {
  AddFriendButton,
  CopyButton,
  ViewOnlySwitch,
  RemoveMemberButton,
  RotateInviteButton,
} from '../components/share-actions';
import { Panel } from '../components/ui';
import { countryName, formatAddress } from '../lib/address';
import { HttpError, activeInvite, membersOf, requireMember } from '../lib/data';

export function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('meta.share') };
}

/**
 * Sharing a utility: invite link and QR code, people from the owner's DevQuake referrals, and
 * the members with their name and address (to check a meter if needed).
 */
export default async function SharePage({ params, ctx }: PluginPageProps) {
  const scope = pageScope(ctx);
  if (!scope.ok) return scope.notice;
  const { db, user } = scope;
  const utilityId = Number(params.id);
  if (!Number.isSafeInteger(utilityId) || utilityId <= 0) notFound();
  await requireProfile(ctx, db, user, `/utilities/${utilityId}/share`);
  const utility = await requireMember(db, utilityId, user.id).catch((err) => {
    if (err instanceof HttpError) notFound();
    throw err;
  });
  const t = translator(localeOf(ctx), 'share');
  const tag = LOCALE_TAGS[localeOf(ctx)];
  const isOwner = utility.role === 'owner';
  const members = await membersOf(db, utilityId);

  let invite: { code: string; url: string; qr: string } | null = null;
  let friends: PluginPerson[] = [];
  if (isOwner) {
    const code = await activeInvite(db, utilityId, user.id);
    const url = `${ctx.baseUrl}/join/${code}`;
    invite = { code, url, qr: brandedQrSvg(url, { margin: 1 }) };
    const memberIds = new Set(members.map((m) => m.userId));
    friends = ((await ctx.people?.referrals().catch(() => [])) ?? []).filter(
      (p) => !memberIds.has(p.id),
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/utilities/${utility.id}`}
          className="text-sm text-ink/60 hover:text-quake dark:text-paper/60"
        >
          {t('back', { name: utility.name })}
        </Link>
        <h1 className="font-display text-3xl font-bold">{t('title', { name: utility.name })}</h1>
      </div>

      {invite ? (
        <Panel className="grid gap-5 sm:grid-cols-[1fr_auto]">
          <div className="space-y-3">
            <h2 className="font-display text-lg font-semibold">{t('inviteTitle')}</h2>
            <p className="text-sm text-ink/70 dark:text-paper/70">{t('inviteBody')}</p>
            <p className="font-mono text-2xl tracking-widest">{invite.code}</p>
            <p className="break-all text-sm text-ink/60 dark:text-paper/60">{invite.url}</p>
            <div className="flex flex-wrap gap-2">
              <CopyButton text={invite.url} />
              <RotateInviteButton utilityId={utility.id} />
            </div>
          </div>
          <div
            className="size-40 justify-self-center overflow-hidden rounded-lg bg-white p-1 [&>svg]:size-full"
            role="img"
            aria-label={t('qr')}
            dangerouslySetInnerHTML={{ __html: invite.qr }}
          />
        </Panel>
      ) : null}

      {isOwner ? (
        <Panel>
          <h2 className="font-display text-lg font-semibold">{t('friendsTitle')}</h2>
          <p className="mt-1 text-sm text-ink/70 dark:text-paper/70">{t('friendsBody')}</p>
          {friends.length === 0 ? (
            <p className="mt-3 text-sm text-ink/60 dark:text-paper/60">
              {rich(t('nobody'), {
                link: (
                  <a className="font-medium text-quake underline" href={`${ctx.hostUrl}/#account`}>
                    {t('inviteFriends')}
                  </a>
                ),
              })}
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-ink/10 dark:divide-paper/10">
              {friends.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-2">
                  <div>
                    <p className="font-medium">{p.displayName}</p>
                    <p className="text-xs text-ink/60 dark:text-paper/60">
                      {p.relation === 'referred' ? t('referred') : t('invitedYou')}
                      {p.hasAccess ? null : ` · ${t('mustSubscribe')}`}
                    </p>
                  </div>
                  <AddFriendButton utilityId={utility.id} userId={p.id} name={p.displayName} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      ) : null}

      <Panel>
        <h2 className="font-display text-lg font-semibold">{t('members')}</h2>
        <p className="mt-1 text-sm text-ink/70 dark:text-paper/70">{t('membersBody')}</p>
        <ul className="mt-3 divide-y divide-ink/10 dark:divide-paper/10">
          {members.map((m) => (
            <li key={m.userId} className="flex items-start justify-between gap-3 py-3">
              <div>
                <p>
                  <span className="font-medium">{m.fullName ?? m.displayName}</span>
                  {m.fullName && m.fullName !== m.displayName ? (
                    <span className="text-ink/50 dark:text-paper/50"> ({m.displayName})</span>
                  ) : null}
                  {m.userId === user.id ? (
                    <span className="text-ink/50 dark:text-paper/50"> {t('you')}</span>
                  ) : null}
                  {m.role === 'owner' ? (
                    <span className="ml-2 text-xs text-ink/50 dark:text-paper/50">
                      {t('owner')}
                    </span>
                  ) : null}
                  {m.viewOnly ? (
                    <span className="ml-2 rounded-full bg-ink/5 px-2 py-0.5 text-xs dark:bg-paper/10">
                      <span aria-hidden>👁 </span>
                      {t('viewOnlyBadge')}
                    </span>
                  ) : null}
                </p>
                <p className="whitespace-pre-line text-sm text-ink/60 dark:text-paper/60">
                  {m.parts
                    ? formatAddress(
                        m.parts,
                        countryName(m.parts.countryCode, tag),
                        t('apartmentShort'),
                      )
                    : (m.address ?? t('noAddress'))}
                </p>
                {isOwner && m.role === 'member' ? (
                  <ViewOnlySwitch utilityId={utility.id} userId={m.userId} viewOnly={m.viewOnly} />
                ) : null}
              </div>
              {m.role === 'member' && (isOwner || m.userId === user.id) ? (
                <RemoveMemberButton
                  utilityId={utility.id}
                  userId={m.userId}
                  name={m.fullName ?? m.displayName}
                  leave={m.userId === user.id}
                />
              ) : null}
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
