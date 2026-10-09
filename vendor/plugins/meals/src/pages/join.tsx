import { redirect } from 'next/navigation';
import type { PluginPageProps } from '@devquake/plugin-sdk';
import { BackLink, localizePath } from '@devquake/ui';
import { localeOf, translator } from '../i18n';
import { pageScope } from '../components/guard';
import { JoinButton } from '../components/household-forms';
import { Notice } from '../components/ui';
import { householdByInvite, membership } from '../lib/data';
import { INVITE_CODE_PATTERN } from '../lib/plan';

export function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('meta.join') };
}

/** The invitation page: which household, who invites, and a "Join" button. */
export default async function Join({ params, ctx }: PluginPageProps) {
  const scope = pageScope(ctx);
  if (!scope.ok) return scope.notice;
  const t = translator(scope.locale, 'join');
  const code = (params.code ?? '').toUpperCase();
  const h = INVITE_CODE_PATTERN.test(code) ? await householdByInvite(scope.db, code) : null;
  if (!h) {
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
  if (await membership(scope.db, h.id, scope.user.id))
    redirect(localizePath(`/h/${h.id}`, scope.locale));
  return (
    <Notice title={t('title', { name: h.name })}>
      <p>{t('body', { owner: h.owner ?? '', name: h.name })}</p>
      <JoinButton code={code} name={h.name} />
    </Notice>
  );
}
