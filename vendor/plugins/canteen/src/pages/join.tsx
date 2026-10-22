import type { PluginPageProps } from '@devquake/plugin-sdk';
import { pageScope } from '../components/guard';
import { JoinButton } from '../components/staff';
import { Notice } from '../components/ui';
import { localeOf, translator } from '../i18n';
import { inviteInfo } from '../lib/data';
import { INVITE_CODE_PATTERN } from '../lib/model';

export async function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('join.title') };
}

/** An invitation: which organisation and role it offers, and "Join". */
export default async function JoinPage({ ctx, params }: PluginPageProps) {
  const scope = pageScope(ctx);
  if (!scope.ok) return scope.notice;
  const t = translator(scope.locale);
  const code = (params.code ?? '').toUpperCase();
  const invite = INVITE_CODE_PATTERN.test(code) ? await inviteInfo(scope.db, code) : null;
  if (!invite) {
    return (
      <Notice title={t('join.title')}>
        <p>{t('errors.inviteInvalid')}</p>
      </Notice>
    );
  }
  return (
    <Notice title={t('join.title')}>
      <p>{t('join.body', { org: invite.orgName, role: t(`roles.${invite.role}`) })}</p>
      <JoinButton code={code} />
    </Notice>
  );
}
