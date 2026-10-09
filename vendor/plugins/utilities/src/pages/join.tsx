import { redirect } from 'next/navigation';
import type { PluginPageProps } from '@devquake/plugin-sdk';
import { BackLink, localizePath } from '@devquake/ui';
import { localeOf, translator } from '../i18n';
import { pageScope, requireProfile } from '../components/guard';
import { JoinButton } from '../components/share-actions';
import { Notice } from '../components/ui';
import { membership, utilityByInvite } from '../lib/data';
import { INVITE_CODE_PATTERN } from '../lib/model';

export function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('meta.join') };
}

/** The invitation page: who invites to which utility, and a "Join" button. */
export default async function Join({ params, ctx }: PluginPageProps) {
  const scope = pageScope(ctx);
  if (!scope.ok) return scope.notice;
  const locale = localeOf(ctx);
  const t = translator(locale, 'join');
  const code = (params.code ?? '').toUpperCase();
  await requireProfile(ctx, scope.db, scope.user, `/join/${code}`);
  const utility = INVITE_CODE_PATTERN.test(code) ? await utilityByInvite(scope.db, code) : null;

  if (!utility) {
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
  if (await membership(scope.db, utility.id, scope.user.id)) {
    redirect(localizePath(`/utilities/${utility.id}`, locale));
  }

  return (
    <Notice title={t('title', { name: utility.name })}>
      <p>
        {t('body', {
          owner: utility.owner ?? '',
          category: translator(locale)(`categories.${utility.category}`),
          members: t('members', { count: utility.members }),
        })}
      </p>
      <p className="mt-2">{t('fromNow')}</p>
      <JoinButton code={code} />
    </Notice>
  );
}
