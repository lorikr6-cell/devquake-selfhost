import { notFound } from 'next/navigation';
import type { PluginPageProps } from '@devquake/plugin-sdk';
import { BackLink, Link, LOCALE_TAGS, buttonClass } from '@devquake/ui';
import { brandedQrSvg } from '@devquake/ui/qr';
import { localeOf, translator } from '../i18n';
import { Bracket } from '../components/bracket';
import { ScoreProgress } from '../components/score-progress';
import { gameName, optionsLine } from '../components/game-text';
import { pageScope } from '../components/guard';
import { GameIcon } from '../components/icons';
import { StatTile } from '../components/stats-charts';
import {
  BoardsPanel,
  PlayersPanel,
  RoundDrawer,
  TournamentLive,
  TournamentSettings,
} from '../components/tournament-admin';
import { Panel } from '../components/ui';
import { tournamentView } from '../lib/data/tournaments';
import { formatMoney } from '../lib/model';
import { pot } from '../lib/tournament';

export function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('meta.tournament') };
}

/**
 * A tournament for its organiser (boards and QR codes, players and fees, drawing rounds, the
 * bracket with every match to watch) and its players (their match, the bracket).
 */
export default async function TournamentPage({ params, ctx }: PluginPageProps) {
  const scope = await pageScope(ctx);
  if (!scope.ok) return scope.notice;
  const id = Number(params.id);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();
  const view = await tournamentView(scope.db, id, scope.user.id).catch(() => null);
  if (!view) notFound();
  const locale = localeOf(ctx);
  const t = translator(locale);
  const tt = translator(locale, 'tournament');
  const money = (cents: number) => formatMoney(cents, view.currency, LOCALE_TAGS[locale]);
  const fees = pot(view.feeCents, view.players.length, view.organizerPct);
  const myMatch = view.matches.find((m) => m.mine && m.status === 'playing');
  const roundOpen = view.matches.some((m) => m.status !== 'finished');
  const alive = view.players.filter((p) => p.eliminatedRound === null).length;
  const canDraw = view.isOrganizer && view.status !== 'finished' && !roundOpen && alive >= 2;
  const champion = view.players.find((p) => p.id === view.championId);
  const qrs = view.isOrganizer
    ? Object.fromEntries(
        view.boards.map((b) => [
          b.id,
          brandedQrSvg(`${ctx.baseUrl}/join/${b.code}`, { margin: 1 }),
        ]),
      )
    : {};

  return (
    <div className="space-y-6">
      <TournamentLive id={view.id} version={view.version} />
      <div className="print:hidden">
        <BackLink
          href="/tournaments"
          className="text-sm text-ink/60 hover:text-quake dark:text-paper/60"
        >
          {tt('back')}
        </BackLink>
        <div className="mt-1 flex items-center gap-3">
          <GameIcon type={view.type} className="size-12 shrink-0" />
          <div className="min-w-0">
            <h1 className="font-display text-3xl font-bold">{view.name}</h1>
            <p className="text-sm text-ink/60 dark:text-paper/60">
              {gameName(t, view.type, view.options)} · {optionsLine(t, view.type, view.options)} ·{' '}
              {tt('by', { name: view.ownerName })}
            </p>
          </div>
        </div>
      </div>

      {champion ? (
        <Panel className="border-quake bg-quake/10 text-center">
          <p className="text-4xl" aria-hidden>
            🏆
          </p>
          <p className="font-display text-2xl font-bold">
            {tt('champion', { name: champion.name || t('score.formerPlayer') })}
          </p>
        </Panel>
      ) : null}

      {myMatch ? (
        <Panel className="flex flex-wrap items-center justify-between gap-3 border-quake bg-quake/10 print:hidden">
          <p>
            <span className="font-display text-lg font-bold">{t('home.yourMatch')}</span>
            <span className="block text-sm text-ink/70 dark:text-paper/70">
              {myMatch.names.join(' – ')} ·{' '}
              {myMatch.board ? t('home.onBoard', { board: myMatch.board }) : t('home.waitingBoard')}
            </span>
          </p>
          <Link href={`/games/${myMatch.gameId}`} className={buttonClass('primary', 'min-h-11')}>
            {t('home.play')}
          </Link>
        </Panel>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 print:hidden">
        <StatTile
          label={tt('statusLabel')}
          value={tt(`status.${view.status}`, { round: view.round })}
        />
        <StatTile
          label={tt('playersLabel')}
          value={String(view.players.length)}
          hint={tt('alive', { count: alive })}
        />
        {view.feeCents > 0 ? (
          <>
            <StatTile
              label={tt('pot')}
              value={money(fees.total)}
              hint={tt('feeEach', { fee: money(view.feeCents) })}
            />
            <StatTile
              label={tt('prize')}
              value={money(fees.prize)}
              hint={tt('organizerShare', { amount: money(fees.organizer), pct: view.organizerPct })}
            />
          </>
        ) : (
          <StatTile label={tt('fee')} value={tt('free')} />
        )}
      </div>

      {view.isOrganizer && view.status !== 'finished' ? (
        <Panel className="space-y-2 print:hidden">
          {canDraw ? (
            <>
              <p className="text-sm text-ink/70 dark:text-paper/70">
                {view.round === 0 ? tt('readyFirst') : tt('readyNext')}
              </p>
              <RoundDrawer
                tournamentId={view.id}
                label={
                  view.round === 0
                    ? tt('startTournament')
                    : tt('drawRound', { round: view.round + 1 })
                }
              />
            </>
          ) : (
            <p className="text-sm text-ink/70 dark:text-paper/70">
              {roundOpen ? tt('roundRunning', { round: view.round }) : tt('needPlayers')}
            </p>
          )}
        </Panel>
      ) : null}

      <section className="space-y-2 print:hidden">
        <h2 className="font-display text-xl font-bold">{tt('bracket')}</h2>
        <p className="text-sm text-ink/60 dark:text-paper/60">{tt('bracketHint')}</p>
        <Bracket view={view} />
      </section>

      {view.progress.length ? (
        <div className="print:hidden">
          <ScoreProgress matches={view.progress} tournament />
        </div>
      ) : null}

      {view.isOrganizer ? <BoardsPanel view={view} qrs={qrs} baseUrl={ctx.baseUrl} /> : null}
      <div className="print:hidden">
        <PlayersPanel view={view} />
      </div>
      {view.isOrganizer ? (
        <TournamentSettings view={view} joinUrl={`${ctx.baseUrl}/join/${view.joinCode}`} />
      ) : null}
    </div>
  );
}
