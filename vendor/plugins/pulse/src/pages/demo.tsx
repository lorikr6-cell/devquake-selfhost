import type { PluginPageProps } from '@devquake/plugin-sdk';
import { BackLink, localizePath } from '@devquake/ui';
import { localeOf, translator } from '../i18n';
import { pageScope } from '../components/guard';
import { LiveDemo } from '../components/live-demo';

export function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('meta.demo') };
}

/**
 * "Check it live" (ADR 0029): open this page in two browsers signed in to the same account and
 * send events from one to the other through the real Pulse API, with timings.
 */
export default async function DemoPage({ ctx }: PluginPageProps) {
  const scope = await pageScope(ctx);
  if (!scope.ok) return scope.notice;
  const locale = localeOf(ctx);
  const t = translator(locale, 'demo');
  return (
    <div className="space-y-6">
      <div>
        <BackLink href="/" className="text-sm underline hover:text-quake">
          {t('back')}
        </BackLink>
        <h1 className="mt-2 font-display text-3xl font-bold">{t('title')}</h1>
        <p className="mt-1 max-w-prose text-sm text-ink/70 dark:text-paper/70">{t('intro')}</p>
      </div>
      <LiveDemo pageUrl={`${ctx.baseUrl}${localizePath('/demo', locale)}`} />
    </div>
  );
}
