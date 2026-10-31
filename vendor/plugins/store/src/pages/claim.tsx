import type { PluginPageProps } from '@devquake/plugin-sdk';
import { localeOf, translator } from '../i18n';
import { ClaimForm } from '../components/claim-form';
import { Notice } from '../components/ui';
import { claimState } from '../lib/claims';
import { claimByToken } from '../lib/claims-data';

export const metadata = { robots: { index: false, follow: false } };

/**
 * A claim's page (ADR 0079), from the link in the member's email: only the member it was made
 * for, signed in to DevQuake, may claim it with the secret code. Unlisted and never indexed.
 */
export default async function ClaimPage({ params, ctx }: PluginPageProps) {
  const locale = localeOf(ctx);
  const t = translator(locale, 'claims.page');
  if (!ctx.db) return <Notice title={t('title')}>{t('failed')}</Notice>;
  const row = await claimByToken(ctx.db, params.token ?? '');
  if (!row) return <Notice title={t('title')}>{t('unknown')}</Notice>;
  if (!ctx.user)
    return (
      <Notice title={t('title')}>
        <p>{t('signIn')}</p>
        <p className="mt-3">
          <a className="font-medium text-quake underline" href={`${ctx.hostUrl}/#account`}>
            {t('signInButton')}
          </a>
        </p>
      </Notice>
    );
  if (row.user_id !== ctx.user.id) return <Notice title={t('title')}>{t('notYours')}</Notice>;
  const state = claimState(row, new Date());
  const reason = (() => {
    try {
      const all = JSON.parse(row.reason) as Record<string, string>;
      return all[locale] ?? all.en ?? '';
    } catch {
      return '';
    }
  })();
  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="font-display text-3xl font-bold">{t('title')}</h1>
      {reason ? <p>{reason}</p> : null}
      <p className="font-medium">{t('what', { title: row.title, points: row.points })}</p>
      {state === 'open' ? (
        <ClaimForm token={params.token ?? ''} />
      ) : (
        <p className="rounded-md bg-ink/5 p-3 dark:bg-paper/10">{t(state)}</p>
      )}
    </div>
  );
}
