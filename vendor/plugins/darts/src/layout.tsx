import type { PluginLayoutProps } from '@devquake/plugin-sdk';
import { AppToolbar, I18nProvider, Link, ReleaseNotes, SectionNav } from '@devquake/ui';
import { FeedbackProvider } from './components/feedback';
import { FALLBACK_MESSAGES, appMessages, localeOf, translator } from './i18n';

export default function Layout({ children, ctx }: PluginLayoutProps) {
  const locale = localeOf(ctx);
  const t = translator(locale);
  const appName = t('appName');
  const signedIn = Boolean(ctx.user && ctx.db);
  return (
    <I18nProvider locale={locale} messages={appMessages(locale)} fallback={FALLBACK_MESSAGES}>
      <FeedbackProvider>
        <div className="min-h-screen bg-paper text-ink dark:bg-ink dark:text-paper">
          <div className="print:hidden">
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
            >
              {signedIn ? (
                <SectionNav
                  label={t('nav.sections')}
                  items={[
                    { href: '/', label: t('nav.home'), also: ['/join'] },
                    { href: '/practice', label: t('nav.practice') },
                    { href: '/casual', label: t('nav.casual') },
                    { href: '/tournaments', label: t('nav.tournaments') },
                    { href: '/stats', label: t('nav.stats') },
                    { href: '/profile', label: t('nav.profile') },
                  ]}
                />
              ) : null}
            </AppToolbar>
          </div>
          <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">{children}</main>
          <footer className="mx-auto flex max-w-4xl flex-wrap items-center gap-x-3 gap-y-1 px-4 pb-10 text-xs text-ink/60 sm:px-6 dark:text-paper/60 print:hidden">
            <span>{appName}</span>
            <ReleaseNotes entries={ctx.changelog ?? []} title={appName} />
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
