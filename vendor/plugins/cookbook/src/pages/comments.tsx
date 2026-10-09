import type { PluginPageProps } from '@devquake/plugin-sdk';
import { BackLink, Link, formatDateTime } from '@devquake/ui';
import { localeOf, translator } from '../i18n';
import { pageScope } from '../components/guard';
import { commentsOnMine } from '../lib/data';

export function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('meta.comments') };
}

/**
 * Comments others wrote on the visitor's public recipes: which recipe, who, when and what, newest
 * first. The same comments reach them as notifications and in their messages on devquake.com.
 */
export default async function CommentsPage({ ctx }: PluginPageProps) {
  const scope = await pageScope(ctx);
  if (!scope.ok) return scope.notice;
  const { db, user, locale } = scope;
  const t = translator(locale, 'commentsPage');
  const timeZone = ctx.timeZone || 'UTC';
  const comments = await commentsOnMine(db, user.id);
  return (
    <div className="space-y-6">
      <div>
        <BackLink
          href="/?tab=mine"
          className="text-sm text-ink/60 hover:text-quake dark:text-paper/60"
        >
          {t('back')}
        </BackLink>
        <h1 className="font-display text-3xl font-bold">{t('title')}</h1>
        <p className="mt-1 text-sm text-ink/70 dark:text-paper/70">{t('intro')}</p>
      </div>
      {comments.length === 0 ? (
        <p className="text-sm text-ink/60 dark:text-paper/60">{t('empty')}</p>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => (
            <li
              key={c.id}
              className="rounded-xl border border-ink/10 bg-white/70 p-4 text-sm dark:border-paper/10 dark:bg-paper/5"
            >
              <p className="text-xs text-ink/60 dark:text-paper/60">
                {t('on', { name: c.name })}{' '}
                <Link
                  href={`/r/${c.recipeId}#comments`}
                  className="font-medium text-quake underline"
                >
                  {c.title}
                </Link>{' '}
                · {formatDateTime(c.at, timeZone, 'datetime', locale)}
              </p>
              <p className="mt-2 whitespace-pre-wrap">{c.body}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
