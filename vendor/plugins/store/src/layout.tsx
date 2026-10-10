import type { PluginLayoutProps } from '@devquake/plugin-sdk';
import { AppToolbar, I18nProvider, Link, ReleaseNotes, SectionNav } from '@devquake/ui';
import { FeedbackProvider } from './components/feedback';
import { FALLBACK_MESSAGES, appMessages, localeOf, translator } from './i18n';
import { storeOfMember } from './lib/data';
import { can, type Area, type Role } from './lib/roles';

/** The owner's and team's sections, each shown to the roles that may open it. */
const SECTIONS: Array<{ href: string; key: string; area: Area; also?: string[] }> = [
  { href: '/', key: 'overview', area: 'overview' },
  { href: '/products', key: 'products', area: 'products', also: ['/vendors'] },
  { href: '/orders', key: 'orders', area: 'orders' },
  { href: '/messages', key: 'messages', area: 'messages' },
  { href: '/reviews', key: 'reviews', area: 'reviews' },
  { href: '/marketing', key: 'marketing', area: 'marketing', also: ['/newsletters'] },
  { href: '/stats', key: 'stats', area: 'stats' },
  { href: '/settings', key: 'settings', area: 'settings', also: ['/team'] },
];

export default async function Layout({ children, ctx }: PluginLayoutProps) {
  const locale = localeOf(ctx);
  const t = translator(locale);
  const appName = ctx.app?.name ?? t('appName');
  let roles: Role[] = [];
  if (ctx.user && ctx.db) {
    roles = (await storeOfMember(ctx.db, ctx.user.id).catch(() => null))?.roles ?? [];
  }
  // Before there is a shop, only the overview (where it is made).
  const sections = roles.length
    ? SECTIONS.filter((s) =>
        s.key === 'settings'
          ? ['settings', 'design', 'seo', 'payments', 'shipping', 'team'].some((a) =>
              can(roles, a as Area),
            )
          : can(roles, s.area),
      )
    : SECTIONS.slice(0, 1);
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
          >
            {/* The owner's and team's sections; buyers see only the shop. */}
            {ctx.user ? (
              <SectionNav
                label={t('owner.label')}
                items={sections.map((s) => {
                  // Roles without the shop's basics open their first settings page instead.
                  const href =
                    s.key === 'settings' && !can(roles, 'settings')
                      ? can(roles, 'design')
                        ? '/settings/design'
                        : can(roles, 'seo')
                          ? '/settings/seo'
                          : '/settings/shipping'
                      : s.href;
                  return {
                    href,
                    label: t(`owner.${s.key}`),
                    also: s.key === 'settings' ? ['/settings', '/team'] : s.also,
                  };
                })}
              />
            ) : null}
          </AppToolbar>
          <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</main>
          <footer className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-3 gap-y-1 px-4 pb-10 text-xs text-ink/60 sm:px-6 dark:text-paper/60">
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
