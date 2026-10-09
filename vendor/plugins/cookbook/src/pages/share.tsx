import { redirect } from 'next/navigation';
import type { PluginPageProps } from '@devquake/plugin-sdk';
import { BackLink, localizePath } from '@devquake/ui';
import { localeOf, translator } from '../i18n';
import { pageScope } from '../components/guard';
import { Notice } from '../components/ui';
import { SHARE_CODE_PATTERN, openShare } from '../lib/data';

export function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('meta.share') };
}

/** A recipe's share link: the visitor may see it from now on and goes to it. */
export default async function Share({ ctx, params }: PluginPageProps) {
  const scope = await pageScope(ctx);
  if (!scope.ok) return scope.notice;
  const code = (params.code ?? '').toUpperCase();
  const id = SHARE_CODE_PATTERN.test(code) ? await openShare(scope.db, code, scope.user.id) : null;
  if (id) redirect(localizePath(`/r/${id}`, scope.locale));
  const t = translator(scope.locale, 'shareLink');
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
