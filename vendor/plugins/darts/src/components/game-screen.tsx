'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Link, buttonClass, trackEvent, useT } from '@devquake/ui';
import { dartLabel, textToDarts, type Dart } from '../lib/engine/darts';
import { play, playerOf, type GameState } from '../lib/engine/engine';
import { PLAYER_LIMITS } from '../lib/engine/games';
import { GAME_POLL_MS, type EntryMode } from '../lib/model';
import type { GameView } from '../lib/views';
import { callApi, errorMessage } from './call-api';
import { Dartboard } from './dartboard';
import { gameName, optionsLine } from './game-text';
import { GameIcon } from './icons';
import { Celebration } from './celebration';
import { useFeedback } from './feedback';
import { ScoreEntry } from './score-entry';
import { ScoreProgress } from './score-progress';
import { progressOf } from '../lib/progress';
import { Scoreboard, playerName, useTargetHint } from './scoreboard';
import { ErrorText, Panel } from './ui';
import { useAppRouter } from './use-app-router';

export interface ShareInfo {
  url: string;
  code: string;
  /** Branded QR code (SVG markup made on the server). */
  qr: string;
}

function stateOf(view: GameView): GameState | null {
  try {
    return play(
      {
        type: view.type,
        options: view.options,
        seats: view.players.map((p) => ({ id: p.id, name: p.name, number: p.number })),
      },
      view.visits.map((v) => ({ playerId: v.playerId, darts: textToDarts(v.darts) })),
    );
  } catch {
    return null;
  }
}

/**
 * A game, live: the lobby while players join, the scoreboard and score entry while it is played
 * (only for the player on turn), the result at the end, and every visit. Watchers see the same
 * without the controls. It asks the server every two seconds whether anything changed.
 */
export function GameScreen({
  initial,
  pollPath,
  join,
  watch,
  entryMode,
  favorite,
  habits = [],
}: {
  initial: GameView;
  /** "/games/12" for players and organisers, "/watch/CODE" for watchers. */
  pollPath: string;
  join: ShareInfo | null;
  watch: ShareInfo | null;
  entryMode: EntryMode;
  favorite: number | null;
  /** The player's frequent visits, for the keypad's one-click visits. */
  habits?: string[];
}) {
  const t = useT('play');
  const tAll = useT();
  const tErr = useT('errors');
  const tToast = useT('toasts');
  const { toast, confirm } = useFeedback();
  const router = useAppRouter();
  const [view, setView] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const version = useRef(initial.version);
  const state = useMemo(() => stateOf(view), [view]);
  const spectator = view.me === null;
  // The darts being entered, shown on the scoreboard before they are sent.
  const [live, setLive] = useState<GameState | null>(null);
  const [mode, setMode] = useState<EntryMode>(entryMode);
  // The end of the game is celebrated when it happens here, not when opening a finished game.
  const [celebrate, setCelebrate] = useState(false);
  const lastStatus = useRef(initial.status);
  useEffect(() => {
    if (view.status === 'finished' && lastStatus.current !== 'finished') setCelebrate(true);
    lastStatus.current = view.status;
  }, [view.status]);
  const endCelebration = useCallback(() => setCelebrate(false), []);

  const refresh = useCallback(async () => {
    const res = await callApi<{ changed: boolean; game?: GameView }>(
      `${pollPath}?v=${version.current}`,
    ).catch(() => null);
    if (res?.changed && res.game) {
      version.current = res.game.version;
      setView(res.game);
    }
  }, [pollPath]);

  useEffect(() => {
    if (view.status === 'finished') return;
    const tick = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    const timer = setInterval(tick, GAME_POLL_MS);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [refresh, view.status]);

  const run = async (change: () => Promise<unknown>): Promise<boolean> => {
    setBusy(true);
    setError('');
    try {
      await change();
      await refresh();
      return true;
    } catch (err) {
      setError(errorMessage(err, tErr));
      await refresh();
      return false;
    } finally {
      setBusy(false);
    }
  };

  const submit = (darts: Dart[]) =>
    run(() =>
      callApi(`/games/${view.id}/visits`, 'POST', {
        darts: darts.map(dartLabel),
        seq: view.visits.length,
      }),
    );

  if (!state) {
    return (
      <Panel>
        <ErrorText>{tErr('genericShort')}</ErrorText>
      </Panel>
    );
  }

  const me = view.me;
  const myTurn = !spectator && view.status === 'playing' && state.current === me;
  const onTurn = playerOf(state, state.current);
  const waitingBoard =
    view.tournament !== null && view.tournament.board === null && view.status === 'playing';
  const lastVisit = state.visits[state.visits.length - 1];
  const lastMine = lastVisit && lastVisit.playerId === me;
  const former = t('formerPlayer');

  const winner = playerOf(state, state.winner);
  const celebration = !celebrate
    ? null
    : state.players.length === 1
      ? t('celebrateDone')
      : winner && winner.id === me
        ? t('celebrateYou')
        : winner
          ? t('celebrateWinner', { name: playerName(winner.name, former) })
          : null;

  return (
    <div className="space-y-5">
      {celebration ? (
        <Celebration
          title={celebration}
          subtitle={gameName(tAll, view.type, view.options)}
          onDone={endCelebration}
        />
      ) : null}
      <Header view={view} state={state} spectator={spectator} />

      {view.status === 'waiting' ? <Lobby view={view} join={join} busy={busy} run={run} /> : null}

      {view.status !== 'waiting' ? (
        <Scoreboard
          state={myTurn && live ? { ...live, current: state.current } : state}
          meId={me}
        />
      ) : null}

      {view.status === 'playing' && waitingBoard ? (
        <Panel className="text-center text-sm">{t('waitingBoard')}</Panel>
      ) : null}

      {view.status === 'playing' && !waitingBoard ? (
        myTurn ? (
          <Panel>
            <p className="mb-3 font-display text-xl font-bold text-quake">{t('yourTurn')}</p>
            <ScoreEntry
              key={view.visits.length}
              state={state}
              favorite={favorite}
              habits={habits}
              mode={mode}
              onMode={setMode}
              busy={busy}
              onSubmit={submit}
              onLive={setLive}
            />
          </Panel>
        ) : (
          <Panel className="space-y-3 text-center">
            <p className="font-display text-lg font-bold" aria-live="polite">
              {t('throwing', { name: playerName(onTurn?.name ?? '', former) })}
            </p>
            {lastVisit ? (
              <p className="text-sm text-ink/70 dark:text-paper/70">
                {t('lastVisit', {
                  name: playerName(playerOf(state, lastVisit.playerId)?.name ?? '', former),
                  darts: lastVisit.darts.map(dartLabel).join(' · '),
                  total: lastVisit.total,
                })}
              </p>
            ) : null}
            <div className="flex justify-center">
              <Dartboard
                label={t('lastVisitBoard')}
                marks={lastVisit?.darts ?? []}
                className="max-w-xs"
              />
            </div>
          </Panel>
        )
      ) : null}

      {!spectator && lastMine && view.status === 'playing' ? (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            onClick={async () => {
              const ok = await confirm({
                title: t('undoConfirm'),
                body: t('undoBody'),
                confirmLabel: t('undoYes'),
              });
              if (!ok) return;
              if (await run(() => callApi(`/games/${view.id}/visits`, 'DELETE'))) {
                toast(tToast('visitUndone'));
              }
            }}
          >
            {t('undoVisit')}
          </Button>
        </div>
      ) : null}

      <ErrorText>{error}</ErrorText>

      {view.status === 'finished' ? (
        <Result view={view} state={state} busy={busy} run={run} />
      ) : null}

      {state.visits.length ? (
        <ScoreProgress matches={[progressOf(state, String(view.id))]} />
      ) : null}

      {watch && !spectator ? <WatchShare watch={watch} /> : null}

      {view.isOwner && view.mode !== 'tournament' ? (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="ghost"
            className="text-red-700 dark:text-red-400"
            disabled={busy}
            onClick={async () => {
              const ok = await confirm({
                title: t('deleteConfirm'),
                body: t('deleteBody'),
                confirmLabel: t('delete'),
                danger: true,
              });
              if (!ok) return;
              await run(async () => {
                await callApi(`/games/${view.id}`, 'DELETE');
                toast(tToast('gameDeleted'));
                router.push(view.mode === 'practice' ? '/practice' : '/casual');
              });
            }}
          >
            {t('delete')}
          </Button>
        </div>
      ) : null}

      {spectator ? (
        <p className="text-center text-xs text-ink/60 dark:text-paper/60">{t('watching')}</p>
      ) : null}
    </div>
  );
}

function Header({
  view,
  state,
  spectator,
}: {
  view: GameView;
  state: GameState;
  spectator: boolean;
}) {
  const t = useT('play');
  const tAll = useT();
  const hint = useTargetHint(state);
  const back = view.tournament
    ? `/tournaments/${view.tournament.id}`
    : view.mode === 'practice'
      ? '/practice'
      : '/casual';
  return (
    <div className="space-y-2">
      {!spectator || view.tournament ? (
        <Link href={back} className="text-sm text-ink/60 hover:text-quake dark:text-paper/60">
          ← {view.tournament ? view.tournament.name : tAll(`modes.${view.mode}.title`)}
        </Link>
      ) : null}
      <div className="flex items-center gap-3">
        <GameIcon type={view.type} className="size-12 shrink-0" />
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold sm:text-3xl">
            {gameName(tAll, view.type, view.options)}
          </h1>
          <p className="text-sm text-ink/60 dark:text-paper/60">
            {tAll(`modes.${view.mode}.title`)} · {optionsLine(tAll, view.type, view.options)}
            {view.tournament
              ? ` · ${t('roundBoard', {
                  round: view.tournament.round,
                  board: view.tournament.board ?? '–',
                })}`
              : ''}
          </p>
        </div>
      </div>
      {hint && view.status === 'playing' ? (
        <p className="inline-block rounded-md bg-ink px-2 py-1 text-sm font-bold text-paper dark:bg-paper dark:text-ink">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function Lobby({
  view,
  join,
  busy,
  run,
}: {
  view: GameView;
  join: ShareInfo | null;
  busy: boolean;
  run: (change: () => Promise<unknown>) => Promise<boolean>;
}) {
  const t = useT('lobby');
  const tToast = useT('toasts');
  const { toast, confirm } = useFeedback();
  const router = useAppRouter();
  const [random, setRandom] = useState(false);
  const limits = PLAYER_LIMITS[view.type];
  const enough = view.players.length >= limits.min;
  const owner = view.players[0];
  return (
    <div className="space-y-4">
      {join ? (
        <Panel className="grid gap-5 sm:grid-cols-[1fr_auto]">
          <div className="space-y-3">
            <h2 className="font-display text-lg font-semibold">{t('inviteTitle')}</h2>
            <p className="text-sm text-ink/70 dark:text-paper/70">{t('inviteBody')}</p>
            <p className="font-mono text-3xl tracking-widest">{join.code}</p>
            <p className="break-all text-sm text-ink/60 dark:text-paper/60">{join.url}</p>
            <CopyButton text={join.url} />
          </div>
          <div
            className="size-44 justify-self-center overflow-hidden rounded-lg bg-white p-1 [&>svg]:size-full"
            role="img"
            aria-label={t('qr')}
            dangerouslySetInnerHTML={{ __html: join.qr }}
          />
        </Panel>
      ) : null}

      <Panel>
        <h2 className="font-display text-lg font-semibold">
          {t('players', { count: view.players.length, max: limits.max })}
        </h2>
        <ul className="mt-3 divide-y divide-ink/10 dark:divide-paper/10">
          {view.players.map((p, i) => (
            <li key={p.id} className="flex items-center justify-between gap-3 py-2">
              <span>
                <span className="font-medium">{p.name || t('formerPlayer')}</span>
                {p.isMe ? (
                  <span className="text-ink/50 dark:text-paper/50"> · {t('you')}</span>
                ) : null}
                {i === 0 ? (
                  <span className="ml-2 text-xs text-ink/50 dark:text-paper/50">{t('host')}</span>
                ) : null}
              </span>
              {i > 0 && (view.isOwner || p.isMe) ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-red-700 dark:text-red-400"
                  disabled={busy}
                  onClick={async () => {
                    const name = p.name || t('formerPlayer');
                    const ok = await confirm(
                      p.isMe
                        ? {
                            title: t('leaveConfirm'),
                            body: t('leaveBody'),
                            confirmLabel: t('leave'),
                            danger: true,
                          }
                        : {
                            title: t('kickConfirm', { name }),
                            body: t('kickBody'),
                            confirmLabel: t('kick'),
                            danger: true,
                          },
                    );
                    if (!ok) return;
                    const done = await run(async () => {
                      await callApi(`/games/${view.id}/players/${p.id}`, 'DELETE');
                      if (p.isMe) router.push('/casual');
                    });
                    if (done) toast(p.isMe ? tToast('leftGame') : tToast('playerKicked', { name }));
                  }}
                >
                  {p.isMe ? t('leave') : t('kick')}
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
        {view.isOwner ? (
          <div className="mt-4 space-y-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={random}
                onChange={(e) => setRandom(e.target.checked)}
              />
              {t('randomOrder')}
            </label>
            {!enough ? (
              <p className="text-sm text-ink/60 dark:text-paper/60">
                {t('needPlayers', { min: limits.min })}
              </p>
            ) : null}
            <Button
              type="button"
              className="min-h-11"
              disabled={busy || !enough}
              onClick={() =>
                void run(async () => {
                  await callApi(`/games/${view.id}/start`, 'POST', { random });
                  trackEvent('game_started', { game: view.type });
                  toast(tToast('gameStarted'));
                })
              }
            >
              {t('start')}
            </Button>
          </div>
        ) : (
          <p className="mt-4 text-sm text-ink/60 dark:text-paper/60">
            {t('waitingForHost', { name: owner?.name ?? '' })}
          </p>
        )}
      </Panel>
    </div>
  );
}

function Result({
  view,
  state,
  busy,
  run,
}: {
  view: GameView;
  state: GameState;
  busy: boolean;
  run: (change: () => Promise<unknown>) => Promise<boolean>;
}) {
  const t = useT('result');
  const router = useAppRouter();
  const winner = playerOf(state, state.winner);
  const iWon = winner !== null && winner.id === view.me;
  const solo = state.players.length === 1;
  const me = playerOf(state, view.me);
  const again = () =>
    run(async () => {
      const body = view.drillId
        ? { mode: 'practice', drillId: view.drillId }
        : { mode: view.mode, type: view.type, options: view.options };
      const res = await callApi<{ id: number }>('/games', 'POST', body);
      router.push(`/games/${res!.id}`);
    });
  return (
    <Panel className="space-y-3 text-center">
      <svg
        viewBox="0 0 48 48"
        className="mx-auto size-14 text-quake"
        aria-hidden
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
      >
        <path d="M15 8h18v8a9 9 0 0 1-18 0z" />
        <path d="M15 11H9a5 5 0 0 0 6 7M33 11h6a5 5 0 0 1-6 7M24 25v8M17 40h14M19 40l1-7h8l1 7" />
      </svg>
      <h2 className="font-display text-2xl font-bold">
        {solo
          ? t('completed')
          : iWon
            ? t('youWon')
            : winner
              ? t('winner', { name: winner.name || t('formerPlayer') })
              : t('draw')}
      </h2>
      {me ? (
        <p className="text-sm text-ink/70 dark:text-paper/70">
          {t('summary', {
            darts: me.darts,
            visits: state.visits.filter((v) => v.playerId === me.id).length,
          })}
        </p>
      ) : null}
      {view.mode !== 'tournament' && view.isOwner ? (
        <div className="flex flex-wrap justify-center gap-2">
          <Button type="button" onClick={() => void again()} disabled={busy}>
            {t('again')}
          </Button>
          <Link href="/stats" className={buttonClass('secondary')}>
            {t('stats')}
          </Link>
        </div>
      ) : view.tournament ? (
        <Link href={`/tournaments/${view.tournament.id}`} className={buttonClass('secondary')}>
          {t('backToTournament')}
        </Link>
      ) : null}
    </Panel>
  );
}

function WatchShare({ watch }: { watch: ShareInfo }) {
  const t = useT('lobby');
  return (
    <details className="rounded-xl border border-ink/10 bg-white/70 p-4 dark:border-paper/10 dark:bg-paper/5">
      <summary className="cursor-pointer font-display text-lg font-semibold">
        {t('watchTitle')}
      </summary>
      <div className="mt-3 grid gap-4 sm:grid-cols-[1fr_auto]">
        <div className="space-y-2">
          <p className="text-sm text-ink/70 dark:text-paper/70">{t('watchBody')}</p>
          <p className="break-all text-sm text-ink/60 dark:text-paper/60">{watch.url}</p>
          <CopyButton text={watch.url} />
        </div>
        <div
          className="size-36 justify-self-center overflow-hidden rounded-lg bg-white p-1 [&>svg]:size-full"
          role="img"
          aria-label={t('qr')}
          dangerouslySetInnerHTML={{ __html: watch.qr }}
        />
      </div>
    </details>
  );
}

export function CopyButton({ text }: { text: string }) {
  const t = useT('lobby');
  const tToast = useT('toasts');
  const { toast } = useFeedback();
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant="secondary"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          toast(tToast('linkCopied'), 'info');
          setTimeout(() => setCopied(false), 2000);
        } catch {
          // The link is shown next to the button: it can be selected and copied by hand.
          toast(tToast('copyFailed'), 'error');
        }
      }}
    >
      {copied ? t('copied') : t('copy')}
    </Button>
  );
}
