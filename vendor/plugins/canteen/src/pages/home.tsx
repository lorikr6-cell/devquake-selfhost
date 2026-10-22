import type { PluginPageProps } from '@devquake/plugin-sdk';
import { Link } from '@devquake/ui';
import { OrgForm } from '../components/forms';
import { pageScope } from '../components/guard';
import { Panel } from '../components/ui';
import { localeOf, translator } from '../i18n';
import { orgsOf } from '../lib/data';

export async function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('meta.home') };
}

/** The visitor's organisations, and a new one. */
export default async function Home({ ctx }: PluginPageProps) {
  const scope = pageScope(ctx);
  if (!scope.ok) return scope.notice;
  const t = translator(scope.locale);
  const orgs = await orgsOf(scope.db, scope.user.id);
  return (
    <>
      <h1 className="font-display text-3xl font-bold">{t('home.title')}</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink/70 dark:text-paper/70">{t('home.intro')}</p>

      <h2 className="mt-8 mb-3 text-lg font-semibold">{t('home.yours')}</h2>
      {orgs.length === 0 ? (
        <p className="mb-4 text-sm text-ink/70 dark:text-paper/70">{t('home.empty')}</p>
      ) : (
        <ul className="mb-6 grid gap-3 sm:grid-cols-2">
          {orgs.map((o) => (
            <li key={o.id}>
              <Link
                href={`/orgs/${o.id}`}
                className="block rounded-xl border border-ink/10 bg-white/70 p-4 hover:border-quake dark:border-paper/10 dark:bg-paper/5"
              >
                <span className="block font-semibold">{o.name}</span>
                <span className="mt-1 block text-xs text-ink/60 dark:text-paper/60">
                  {t(`roles.${o.role}`)} · {t('home.people', { count: o.people })}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Panel>
        <h2 className="mb-3 font-semibold">{t('home.newOrg')}</h2>
        <OrgForm />
      </Panel>
    </>
  );
}
