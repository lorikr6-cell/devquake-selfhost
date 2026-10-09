import { redirect } from 'next/navigation';
import type { PluginPageProps } from '@devquake/plugin-sdk';
import { BackLink, localizePath } from '@devquake/ui';
import { localeOf, translator } from '../i18n';
import { pageScope } from '../components/guard';
import { JoinButton } from '../components/members';
import { Notice } from '../components/ui';
import { groupByInvite, membership } from '../lib/data';
import { INVITE_CODE_PATTERN, KIND_ICONS } from '../lib/model';

export function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('meta.join') };
}

/**
 * The invite link (or its QR code): which group, who invites; Join adds the visitor. Open to every
 * signed-in DevQuake member (signedInRoutes): invited people get the app free (ADR 0043). Signed
 * out, the platform asks to sign in and comes back here.
 */
export default async function Join({ params, ctx }: PluginPageProps) {
  const scope = pageScope(ctx);
  if (!scope.ok) return scope.notice;
  const t = translator(scope.locale, 'join');
  const tGroup = translator(scope.locale, 'group');
  const code = (params.code ?? '').toUpperCase();
  const group = INVITE_CODE_PATTERN.test(code) ? await groupByInvite(scope.db, code) : null;

  if (!group) {
    return (
      <Notice title={t('invalidTitle')}>
        <p>{t('invalidBody')}</p>
        <p className="mt-3">
          <BackLink href="/" className="font-medium text-quake underline">
            {t('back')}
          </BackLink>
        </p>
      </Notice>
    );
  }
  if (await membership(scope.db, group.id, scope.user.id)) {
    redirect(localizePath(`/groups/${group.id}`, scope.locale));
  }

  return (
    <Notice title={`${KIND_ICONS[group.kind]} ${t('title', { name: group.name })}`}>
      <p>
        {t('body', {
          owner: group.owner || tGroup('someone'),
          members: tGroup('membersCount', { count: group.members }),
        })}
      </p>
      <JoinButton code={code} />
    </Notice>
  );
}
