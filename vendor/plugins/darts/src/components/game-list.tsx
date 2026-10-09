import { Link, formatDateTime, type Locale, type Translate } from '@devquake/ui';
import type { GameSummary } from '../lib/views';
import { gameName, optionsLine } from './game-text';
import { GameIcon } from './icons';

/** A list of games (server component): what, with whom, the result and when. */
export function GameList({
  games,
  t,
  timeZone,
  locale,
}: {
  games: GameSummary[];
  /** The root translator. */
  t: Translate;
  timeZone: string;
  locale: Locale;
}) {
  return (
    <ul className="divide-y divide-ink/10 overflow-hidden rounded-xl border border-ink/10 bg-white/70 dark:divide-paper/10 dark:border-paper/10 dark:bg-paper/5">
      {games.map((g) => {
        const others = g.players.length > 1;
        const result =
          g.status !== 'finished'
            ? t(`list.status.${g.status}`)
            : !others
              ? t('list.completed')
              : g.won
                ? t('list.won')
                : g.winner !== null
                  ? t('list.lost', { name: g.winner || t('score.formerPlayer') })
                  : t('list.draw');
        return (
          <li key={g.id}>
            <Link
              href={`/games/${g.id}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-quake/5"
            >
              <GameIcon type={g.type} className="size-9 shrink-0" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">
                  {g.drillReason ? t(`drills.titles.${g.type}`) : gameName(t, g.type, g.options)}
                  <span className="font-normal text-ink/60 dark:text-paper/60">
                    {' '}
                    · {optionsLine(t, g.type, g.options)}
                  </span>
                </span>
                <span className="block truncate text-xs text-ink/60 dark:text-paper/60">
                  {others
                    ? `${g.players.map((p) => p || t('score.formerPlayer')).join(' – ')} · `
                    : ''}
                  {g.tournamentName ? `${g.tournamentName} · ` : ''}
                  {t('list.darts', { count: g.darts })} ·{' '}
                  {formatDateTime(g.finishedAt ?? g.createdAt, timeZone, 'datetime', locale)}
                </span>
              </span>
              <span
                className={
                  g.status === 'finished' && g.won
                    ? 'shrink-0 text-sm font-bold text-green-700 dark:text-green-400'
                    : 'shrink-0 text-sm text-ink/70 dark:text-paper/70'
                }
              >
                {result}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
