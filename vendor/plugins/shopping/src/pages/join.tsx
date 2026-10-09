import { redirect } from 'next/navigation';
import type { PluginPageProps } from '@devquake/plugin-sdk';
import { BackLink, localizePath } from '@devquake/ui';
import { localeOf, translator } from '../i18n';
import { JoinButton } from '../components/home-forms';
import { pageScope } from '../components/guard';
import { Notice } from '../components/ui';
import { listByInvite, membership } from '../lib/data';
import { INVITE_CODE_PATTERN } from '../lib/model';

export function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('meta.join') };
}

export default async function Join({ params, ctx }: PluginPageProps) {
  const scope = pageScope(ctx);
  if (!scope.ok) return scope.notice;
  const locale = localeOf(ctx);
  const t = translator(locale, 'join');
  const code = (params.code ?? '').toUpperCase();
  const list = INVITE_CODE_PATTERN.test(code) ? await listByInvite(scope.db, code) : null;

  if (!list) {
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
  if (await membership(scope.db, list.id, scope.user.id))
    redirect(localizePath(`/lists/${list.id}`, locale));

  const members = Number(list.members);
  return (
    <Notice title={t('title', { name: list.name })}>
      <p>{t('body', { owner: list.owner, members: t('members', { count: members }) })}</p>
      <JoinButton code={code} />
    </Notice>
  );
}
