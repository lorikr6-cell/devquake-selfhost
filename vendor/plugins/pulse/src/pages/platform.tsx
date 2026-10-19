import { notFound } from 'next/navigation';
import type { PluginPageProps } from '@devquake/plugin-sdk';
import { localeOf, translator } from '../i18n';
import { pageScope } from '../components/guard';
import { Panel } from '../components/panel';
import { PlatformAdmin } from '../components/platform-admin';
import { masterKey } from '../lib/keys';
import { platformInfo } from '../lib/platform-service';

export function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('platform.metaTitle') };
}

/**
 * DevQuake's platform service (ADR 0063), for DevQuake admins only: everyone else gets a 404.
 * Not linked for members and not in the sitemap.
 */
export default async function Platform({ ctx }: PluginPageProps) {
  const scope = await pageScope(ctx);
  if (!scope.ok) return scope.notice;
  if (!scope.user.isAdmin) notFound();
  const t = translator(localeOf(ctx), 'platform');
  const master = masterKey();
  // Before migration 0004 the column is missing: say so instead of failing.
  const info = master ? await platformInfo(scope.db, master).catch(() => null) : null;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold">{t('title')}</h1>
        <p className="mt-1 max-w-prose text-sm text-ink/70 dark:text-paper/70">{t('intro')}</p>
      </header>
      {info ? (
        <PlatformAdmin info={info} timeZone={ctx.timeZone ?? 'UTC'} />
      ) : (
        <Panel>
          <p className="text-sm">{t('migration')}</p>
        </Panel>
      )}
    </div>
  );
}
