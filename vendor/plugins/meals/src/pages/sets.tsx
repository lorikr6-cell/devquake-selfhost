import type { PluginPageProps } from '@devquake/plugin-sdk';
import { BackLink, Link, cn } from '@devquake/ui';
import { localeOf, translator } from '../i18n';
import { pageScope } from '../components/guard';
import { setsOf } from '../lib/data';
import { mealNutrition, slotIcon } from '../lib/plan';

export function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('meta.sets') };
}

/** Saved meals: the visitor's own (from "Save this meal") and the public ones of everyone. */
export default async function SetsPage({ ctx, searchParams }: PluginPageProps) {
  const scope = pageScope(ctx);
  if (!scope.ok) return scope.notice;
  const { db, user, locale } = scope;
  const t = translator(locale, 'sets');
  const sp = (await searchParams) ?? {};
  const tab = (Array.isArray(sp.tab) ? sp.tab[0] : sp.tab) === 'community' ? 'community' : 'mine';
  const sets = await setsOf(db, user.id, tab);
  return (
    <div className="space-y-6">
      <div>
        <BackLink href="/" className="text-sm text-ink/60 hover:text-quake dark:text-paper/60">
          {t('back')}
        </BackLink>
        <h1 className="font-display text-3xl font-bold">{t('title')}</h1>
        <p className="mt-1 text-sm text-ink/70 dark:text-paper/70">{t('intro')}</p>
      </div>
      <nav
        aria-label={t('title')}
        className="flex gap-1 border-b border-ink/10 text-sm dark:border-paper/10"
      >
        {(['mine', 'community'] as const).map((x) => (
          <Link
            key={x}
            href={`/meals?tab=${x}`}
            aria-current={x === tab ? 'page' : undefined}
            className={cn(
              '-mb-px border-b-2 px-3 py-2.5 font-medium',
              x === tab
                ? 'border-quake'
                : 'border-transparent text-ink/60 hover:text-ink dark:text-paper/60 dark:hover:text-paper',
            )}
          >
            {t(`tabs.${x}`)}
          </Link>
        ))}
      </nav>
      {sets.length === 0 ? (
        <p className="text-sm text-ink/60 dark:text-paper/60">{t(`empty.${tab}`)}</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {sets.map((s) => {
            const n = mealNutrition(s.items);
            return (
              <li key={s.id}>
                <Link
                  href={`/meals/${s.id}`}
                  className="block h-full rounded-xl border border-ink/10 bg-white/70 p-4 hover:border-quake dark:border-paper/10 dark:bg-paper/5"
                >
                  <span className="block font-medium">
                    <span aria-hidden>{slotIcon(s.slot)} </span>
                    {s.title}
                  </span>
                  <span className="mt-1 block text-xs text-ink/60 dark:text-paper/60">
                    {s.items.map((i) => i.name).join(', ')}
                  </span>
                  <span className="mt-1 block text-xs text-ink/60 dark:text-paper/60">
                    {[
                      n.kcal !== null ? t('kcal', { kcal: Math.round(n.kcal) }) : null,
                      s.isPublic ? `👍 ${s.recommendations}` : t('private'),
                      tab === 'community' ? s.ownerName : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
