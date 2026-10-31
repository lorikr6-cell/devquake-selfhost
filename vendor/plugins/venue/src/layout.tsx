import type { PluginLayoutProps } from '@devquake/plugin-sdk';
import {
  AppToolbar,
  I18nProvider,
  Link,
  PageTips,
  ReleaseNotes,
  TipsToggle,
  pageTips,
} from '@devquake/ui';
import { DemoPanel } from './components/demo-panel';
import { FALLBACK_MESSAGES, appMessages, localeOf, translator } from './i18n';
import { venueOfOwner, venuesOfOwner } from './lib/data';
import { DEMO_PINS } from './lib/demo';
import { TIPS_PAGES } from './i18n/tips';

const ADMIN_LINKS = [
  ['/', 'nav.home'],
  ['/floor', 'nav.floor'],
  ['/station/kitchen', 'nav.kitchen'],
  ['/menu', 'nav.menu'],
  ['/stock', 'nav.stock'],
  ['/tables', 'nav.tables'],
  ['/reports', 'nav.reports'],
  ['/staff', 'nav.staff'],
  ['/tablets', 'nav.tablets'],
  ['/settings', 'nav.settings'],
] as const;

// The toolbar is shared by every app (AppToolbar). The admin links show only to signed-in
// members; each page still checks that the venue is theirs (ADR 0080).
export default async function Layout({ children, ctx }: PluginLayoutProps) {
  const locale = localeOf(ctx);
  const t = translator(locale);
  const appName = t('appName');
  // In the demo venue every page says so, with the demo staff's PINs and the way back.
  const venue =
    ctx.user && ctx.db ? await venueOfOwner(ctx.db, ctx.user.id).catch(() => null) : null;
  const hasOwn =
    venue?.isDemo && ctx.user && ctx.db ? !!(await venuesOfOwner(ctx.db, ctx.user.id)).own : false;
  return (
    <I18nProvider locale={locale} messages={appMessages(locale)} fallback={FALLBACK_MESSAGES}>
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
          actions={<TipsToggle />}
        >
          {ctx.user ? (
            <nav className="mx-auto flex max-w-4xl flex-wrap gap-x-4 gap-y-1 px-4 pb-2 text-sm sm:px-6">
              {ADMIN_LINKS.map(([href, key]) => (
                <Link key={href} href={href} className="underline-offset-4 hover:underline">
                  {t(key)}
                </Link>
              ))}
            </nav>
          ) : null}
        </AppToolbar>
        {venue?.isDemo ? (
          <div className="border-b border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/40">
            <div className="mx-auto max-w-4xl space-y-2 px-4 py-3 text-sm sm:px-6">
              <p className="font-medium">{t('demo.banner')}</p>
              <p className="text-ink/70 dark:text-paper/70">
                {t('demo.pins', {
                  list: Object.entries(DEMO_PINS)
                    .map(([name, pin]) => `${name} ${pin}`)
                    .join(' · '),
                })}
              </p>
              <DemoPanel hasDemo inDemo hasOwn={hasOwn} />
            </div>
          </div>
        ) : null}
        <PageTips pages={pageTips(t, TIPS_PAGES)} />
        <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">{children}</main>
        <footer className="mx-auto flex max-w-4xl flex-wrap items-center gap-x-3 gap-y-1 px-4 pb-10 text-xs text-ink/60 sm:px-6 dark:text-paper/60">
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
    </I18nProvider>
  );
}
