import type { PluginPageProps } from '@devquake/plugin-sdk';
import { Link, buttonClass, formatDateTime } from '@devquake/ui';
import { localeOf, translator } from '../i18n';
import { pageScope } from '../components/guard';
import { GameIcon } from '../components/icons';
import { JoinCodeForm } from '../components/join';
import { Empty, PageTitle, Panel, SectionTitle } from '../components/ui';
import { myTournaments } from '../lib/data/tournaments';

export function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('meta.tournaments') };
}

/** Tournaments you organise or play in; create one or join with a code. */
export default async function Tournaments({ ctx }: PluginPageProps) {
  const scope = await pageScope(ctx);
  if (!scope.ok) return scope.notice;
  const locale = localeOf(ctx);
  const t = translator(locale);
  const list = await myTournaments(scope.db, scope.user.id);
  return (
    <div className="space-y-8">
      <PageTitle
        title={t('modes.tournament.title')}
        intro={t('tournaments.intro')}
        action={
          <Link href="/tournaments/new" className={buttonClass('primary', 'min-h-11')}>
            {t('tournaments.create')}
          </Link>
        }
      />
      <Panel>
        <JoinCodeForm label={t('tournaments.join')} />
        <p className="mt-2 text-xs text-ink/60 dark:text-paper/60">{t('tournaments.joinHint')}</p>
      </Panel>
      <section>
        <SectionTitle>{t('tournaments.yours')}</SectionTitle>
        {list.length === 0 ? (
          <Empty>{t('tournaments.none')}</Empty>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {list.map((x) => (
              <li key={x.id}>
                <Link
                  href={`/tournaments/${x.id}`}
                  className="flex h-full gap-3 rounded-xl border border-ink/10 bg-white/70 p-4 hover:border-quake dark:border-paper/10 dark:bg-paper/5"
                >
                  <GameIcon type={x.type} className="size-10 shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-lg font-bold">{x.name}</span>
                    <span className="block text-xs text-ink/60 dark:text-paper/60">
                      {t(`tournaments.status.${x.status}`, { round: x.round })} ·{' '}
                      {t('tournaments.players', { count: x.players })} ·{' '}
                      {x.isOrganizer ? t('tournaments.organizer') : t('tournaments.player')}
                    </span>
                    <span className="block text-xs text-ink/60 dark:text-paper/60">
                      {formatDateTime(x.createdAt, ctx.timeZone ?? 'UTC', 'date', locale)}
                    </span>
                    {x.champion !== null ? (
                      <span className="mt-1 block text-sm">
                        {t('tournaments.champion', { name: x.champion || t('score.formerPlayer') })}
                      </span>
                    ) : null}
                    {x.myGameId ? (
                      <span className="mt-1 block text-sm font-bold text-quake">
                        {t('home.yourMatch')}
                        {x.myBoard ? ` · ${t('home.onBoard', { board: x.myBoard })}` : ''}
                      </span>
                    ) : null}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
