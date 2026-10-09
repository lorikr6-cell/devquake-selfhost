import type { PluginLayoutProps } from '@devquake/plugin-sdk';
import { AppToolbar, I18nProvider, WorksWith, Link, ReleaseNotes } from '@devquake/ui';
import { FeedbackProvider } from './components/feedback';
import { FALLBACK_MESSAGES, appMessages, localeOf, translator } from './i18n';

export default async function Layout({ children, ctx }: PluginLayoutProps) {
  const locale = localeOf(ctx);
  const t = translator(locale);
  const appName = t('appName');
  // Apps this one works with (ADR 0035), for the footer's "Works with".
  const linked = ctx.links ? await ctx.links.list().catch(() => []) : [];
  return (
    <I18nProvider locale={locale} messages={appMessages(locale)} fallback={FALLBACK_MESSAGES}>
      <FeedbackProvider>
        <div className="min-h-screen bg-paper text-ink dark:bg-ink dark:text-paper">
          <AppToolbar
            title={appName}
            iconUrl={ctx.app?.iconUrl}
            hostUrl={ctx.hostUrl}
            signedIn={Boolean(ctx.user)}
            labels={{
              fullscreen: t('nav.fullscreen'),
              exitFullscreen: t('nav.exitFullscreen'),
              language: t('nav.language'),
              devquake: t('nav.devquake'),
            }}
          />
          <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">{children}</main>
          <footer className="mx-auto flex max-w-4xl flex-wrap items-center gap-x-3 gap-y-1 px-4 pb-10 text-xs text-ink/60 sm:px-6 dark:text-paper/60">
            <span>{appName}</span>
            <ReleaseNotes entries={ctx.changelog ?? []} title={appName} />
            <WorksWith
              apps={linked}
              labels={{
                title: t('worksWith.title'),
                intro: t('worksWith.intro'),
                open: t('worksWith.open'),
                connect: t('worksWith.connect'),
                getIt: t('worksWith.getIt'),
                connected: t('worksWith.connected'),
                close: t('worksWith.close'),
                disconnect: t('worksWith.disconnect'),
                disconnectTitle: t('worksWith.disconnectTitle'),
                disconnectBody: t('worksWith.disconnectBody'),
                cancel: t('worksWith.cancel'),
              }}
            />
            <Link href="/help" className="underline hover:text-quake">
              {t('nav.manual')}
            </Link>
            <a href={ctx.hostUrl} className="underline hover:text-quake">
              {t('nav.devquake')}
            </a>
          </footer>
        </div>
      </FeedbackProvider>
    </I18nProvider>
  );
}
