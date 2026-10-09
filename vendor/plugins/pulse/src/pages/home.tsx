import type { PluginPageProps } from '@devquake/plugin-sdk';
import { LOCALE_TAGS, Link } from '@devquake/ui';
import { localeOf, translator } from '../i18n';
import { pageScope } from '../components/guard';
import { NewApp } from '../components/new-app';
import { Panel } from '../components/panel';
import { PlanPanel } from '../components/plan-panel';
import { CallLogAdmin } from '../components/call-log-admin';
import { ALL_SERVICES, callTotals, logInfo } from '../lib/call-log';
import { compactCount } from '../lib/call-rules';
import { listApps } from '../lib/data';

export function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('meta.home') };
}

/** The member's API services, their plan, and how it works. */
export default async function Home({ ctx }: PluginPageProps) {
  const scope = await pageScope(ctx);
  if (!scope.ok) return scope.notice;
  const { db, user, plan, limits } = scope;
  const locale = localeOf(ctx);
  const t = translator(locale, 'home');
  const [apps, adminData] = await Promise.all([
    listApps(db, user.id),
    // DevQuake admins also manage the API call log (counts only, no member's data).
    user.isAdmin
      ? Promise.all([callTotals(db, ALL_SERVICES), logInfo(db)]).catch(() => null)
      : Promise.resolve(null),
  ]);
  const number = new Intl.NumberFormat(LOCALE_TAGS[locale]);
  const tc = translator(locale, 'calls');

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-bold">{t('title')}</h1>
        <p className="mt-1 max-w-prose text-sm text-ink/70 dark:text-paper/70">{t('intro')}</p>
      </header>

      <Link
        href="/demo"
        className="flex flex-wrap items-center gap-4 rounded-xl border border-quake/50 bg-quake/5 p-5 transition-colors hover:border-quake"
      >
        <svg
          viewBox="0 0 48 48"
          aria-hidden
          className="size-12 shrink-0 text-quake"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="10" width="17" height="13" rx="2" />
          <rect x="28" y="25" width="17" height="13" rx="2" />
          <path d="M20 16h8l-3-3M28 32h-8l3 3" />
        </svg>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-lg font-bold">{t('demoTitle')}</span>
          <span className="block text-sm text-ink/70 dark:text-paper/70">{t('demoBody')}</span>
        </span>
        <span className="font-medium text-quake">{t('demoOpen')} →</span>
      </Link>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-bold">{t('apps')}</h2>
        {apps.length === 0 ? (
          <p className="text-sm text-ink/70 dark:text-paper/70">{t('empty')}</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {apps.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/apps/${a.id}`}
                  className="block rounded-xl border border-ink/10 bg-white/70 p-4 hover:border-quake dark:border-paper/10 dark:bg-paper/5"
                >
                  <span className="flex items-center gap-2">
                    <span className="truncate font-medium">{a.name}</span>
                    {a.paused ? (
                      <span className="rounded-full bg-amber-500/15 px-2 text-xs">
                        {t('paused')}
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-1 block font-mono text-xs text-ink/60 dark:text-paper/60">
                    {a.publicKey}
                  </span>
                  <span className="mt-1 block text-sm">
                    {t('eventsToday', { count: a.eventsToday, n: number.format(a.eventsToday) })}
                  </span>
                  <span
                    className="mt-0.5 block text-xs text-ink/60 dark:text-paper/60"
                    title={number.format(a.calls)}
                  >
                    {tc('count', { count: a.calls, n: compactCount(a.calls, LOCALE_TAGS[locale]) })}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Panel>
          <h3 className="mb-2 font-semibold">{t('newTitle')}</h3>
          <NewApp atLimit={apps.length >= limits.apps} max={limits.apps} />
        </Panel>
      </section>

      <PlanPanel locale={locale} plan={plan} hostUrl={ctx.hostUrl} />

      {adminData ? (
        <CallLogAdmin totals={adminData[0]} log={adminData[1]} timeZone={ctx.timeZone ?? 'UTC'} />
      ) : null}

      <Panel title={t('howTitle')}>
        <ol className="list-decimal space-y-2 pl-5 text-sm">
          <li>{t('how1')}</li>
          <li>{t('how2')}</li>
          <li>{t('how3')}</li>
        </ol>
        <p className="mt-3 text-sm">
          <Link href="/help#test" className="font-medium text-quake underline">
            {t('howLink')}
          </Link>
        </p>
      </Panel>
    </div>
  );
}
