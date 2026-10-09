import { redirect } from 'next/navigation';
import type { PluginPageProps } from '@devquake/plugin-sdk';
import { Link, localizePath } from '@devquake/ui';
import { localeOf, translator } from '../i18n';
import { pageScope } from '../components/guard';
import { NewHousehold } from '../components/household-forms';
import { Panel } from '../components/ui';
import { householdsOf } from '../lib/data';

export function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('meta.home') };
}

/** Start page: the visitor's households (straight to the week with only one), or a new one. */
export default async function Home({ ctx, searchParams }: PluginPageProps) {
  const scope = pageScope(ctx);
  if (!scope.ok) return scope.notice;
  const { db, user, locale } = scope;
  const t = translator(locale, 'home');
  const tRole = translator(locale, 'roles');
  const households = await householdsOf(db, user.id);
  const sp = (await searchParams) ?? {};
  if (households.length === 1 && sp.all === undefined) {
    redirect(localizePath(`/h/${households[0]!.id}`, locale));
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">{t('title')}</h1>
        <p className="mt-1 text-sm text-ink/70 dark:text-paper/70">{t('intro')}</p>
        <p className="mt-2">
          <Link href="/meals" className="text-sm font-medium text-quake underline">
            {t('savedMeals')}
          </Link>
        </p>
      </div>
      {households.length ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {households.map((h) => (
            <li key={h.id}>
              <Link
                href={`/h/${h.id}`}
                className="block rounded-xl border border-ink/10 bg-white/70 p-4 hover:border-quake dark:border-paper/10 dark:bg-paper/5"
              >
                <span className="block font-medium">🍽️ {h.name}</span>
                <span className="text-xs text-ink/60 dark:text-paper/60">{tRole(h.role)}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-ink/60 dark:text-paper/60">{t('empty')}</p>
      )}
      <Panel className="space-y-2">
        <h2 className="font-display text-xl font-bold">{t('newTitle')}</h2>
        <NewHousehold />
      </Panel>
    </div>
  );
}
