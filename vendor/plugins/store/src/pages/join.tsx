import type { Metadata } from 'next';
import type { PluginPageProps } from '@devquake/plugin-sdk';
import { localeOf, translator } from '../i18n';
import { ownerScope } from '../components/guard';
import { JoinButton } from '../components/team-editor';
import { Notice } from '../components/ui';
import { inviteByCode } from '../lib/team-data';

export function generateMetadata({ ctx }: PluginPageProps): Metadata {
  return {
    title: translator(localeOf(ctx))('meta.join'),
    robots: { index: false, follow: false },
    referrer: 'no-referrer',
  };
}

/** An invitation to a shop's team: who invites and with which role, and joining it. */
export default async function JoinPage({ ctx, params }: PluginPageProps) {
  const scope = await ownerScope(ctx);
  if (!scope.ok) return scope.notice;
  const { db, store, user, locale } = scope;
  const t = translator(locale, 'team');
  const tRoles = translator(locale, 'team.roles');
  const invite = await inviteByCode(db, params.code ?? '');
  if (!invite) {
    return (
      <Notice title={t('goneTitle')}>
        <p>{t('goneBody')}</p>
      </Notice>
    );
  }
  if (store && store.id !== invite.storeId) {
    return (
      <Notice title={t('otherTitle')}>
        <p>{t('otherBody', { store: store.name })}</p>
      </Notice>
    );
  }
  if (invite.ownerUserId === user.id) {
    return (
      <Notice title={t('ownTitle')}>
        <p>{t('ownBody')}</p>
      </Notice>
    );
  }
  return (
    <Notice title={t('joinTitle', { store: invite.storeName })}>
      <div className="space-y-3">
        <p>{t('joinBody', { role: invite.roles.map((r) => tRoles(r)).join(', ') })}</p>
        <ul className="space-y-1 text-left">
          {invite.roles.map((r) => (
            <li key={r}>
              <span className="font-medium">{tRoles(r)}</span> — {t(`roleHint.${r}`)}
            </li>
          ))}
        </ul>
        <div className="flex justify-center">
          <JoinButton code={params.code} />
        </div>
      </div>
    </Notice>
  );
}
