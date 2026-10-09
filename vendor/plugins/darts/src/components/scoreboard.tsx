'use client';

import { cn, useT } from '@devquake/ui';
import { BULL } from '../lib/engine/darts';
import {
  ATC_SEQUENCE,
  CRICKET_NUMBERS,
  currentTarget,
  shanghaiTarget,
  type GameState,
  type PlayerState,
} from '../lib/engine/engine';
import type {
  CheckoutOptions,
  CountupOptions,
  KillerOptions,
  ShanghaiOptions,
  TargetsOptions,
  X01Options,
} from '../lib/engine/games';
import { targetLabel } from './game-text';
import { CricketMark, Lives } from './icons';

/** X01 three-dart average of a player so far. */
export function average(state: GameState, playerId: number): number | null {
  const mine = state.visits.filter((v) => v.playerId === playerId);
  const darts = mine.reduce((s, v) => s + v.darts.length, 0);
  if (!darts) return null;
  return (mine.reduce((s, v) => s + v.scored, 0) / darts) * 3;
}

export function playerName(name: string, formerLabel: string) {
  return name || formerLabel;
}

/** The players and what counts in the game, the player on turn highlighted. */
export function Scoreboard({ state, meId }: { state: GameState; meId: number | null }) {
  const t = useT('score');
  const former = t('formerPlayer');
  if (state.type === 'cricket') return <CricketBoard state={state} meId={meId} />;

  const legs = 'legs' in state.options ? (state.options as X01Options).legs : 1;
  return (
    <ul
      className={cn(
        'grid gap-2',
        state.players.length === 1 ? 'grid-cols-1' : 'grid-cols-2',
        state.players.length > 4 && 'sm:grid-cols-4',
      )}
    >
      {state.players.map((p) => {
        const onTurn = state.current === p.id;
        return (
          <li
            key={p.id}
            aria-current={onTurn ? 'true' : undefined}
            className={cn(
              'rounded-xl border p-3 transition-colors',
              onTurn
                ? 'border-quake bg-quake/10 ring-2 ring-quake/40'
                : 'border-ink/10 bg-white/70 dark:border-paper/10 dark:bg-paper/5',
              p.out && 'opacity-50',
              state.winner === p.id && 'border-green-600 bg-green-600/10',
            )}
          >
            <p className="flex items-center justify-between gap-2 text-sm">
              <span className="truncate font-medium">
                {playerName(p.name, former)}
                {p.id === meId ? (
                  <span className="text-ink/50 dark:text-paper/50"> · {t('you')}</span>
                ) : null}
              </span>
              {legs > 1 ? (
                <span className="shrink-0 rounded bg-ink/10 px-1.5 text-xs font-bold dark:bg-paper/15">
                  {t('legs', { count: p.legs })}
                </span>
              ) : null}
            </p>
            <PlayerMain state={state} p={p} />
          </li>
        );
      })}
    </ul>
  );
}

function PlayerMain({ state, p }: { state: GameState; p: PlayerState }) {
  const t = useT('score');
  const big = 'mt-1 font-display text-4xl font-bold tabular-nums sm:text-5xl';
  const small = 'mt-1 text-xs text-ink/60 dark:text-paper/60';
  switch (state.type) {
    case 'x01': {
      const avg = average(state, p.id);
      return (
        <>
          <p className={big}>{p.score}</p>
          <p className={small}>
            {t('darts', { count: p.darts })}
            {avg !== null ? ` · ${t('average', { value: avg.toFixed(1) })}` : ''}
            {!p.opened ? ` · ${t('needsDouble')}` : ''}
          </p>
        </>
      );
    }
    case 'shanghai':
    case 'countup': {
      const rounds =
        state.type === 'shanghai'
          ? (state.options as ShanghaiOptions).rounds
          : (state.options as CountupOptions).rounds;
      return (
        <>
          <p className={big}>{p.score}</p>
          <p className={small}>
            {t('points')} · {t('round', { round: Math.min(state.round, rounds), rounds })}
            {state.round > rounds ? ` · ${t('tiebreak')}` : ''}
          </p>
        </>
      );
    }
    case 'atc': {
      const next = ATC_SEQUENCE[p.step];
      return (
        <>
          <Progress value={p.step} max={ATC_SEQUENCE.length} />
          <p className={small}>
            {next === undefined
              ? t('done')
              : t('next', { target: next === BULL ? t('bull') : String(next) })}
          </p>
        </>
      );
    }
    case 'killer': {
      const o = state.options as KillerOptions;
      return (
        <>
          <p className="mt-1 flex items-baseline gap-2">
            <span className="font-display text-4xl font-bold tabular-nums">{p.number ?? '–'}</span>
            {p.killer ? (
              <span className="rounded bg-red-700 px-1.5 text-xs font-bold uppercase text-white">
                {t('killer')}
              </span>
            ) : null}
          </p>
          <p className="mt-1">
            <Lives left={p.score} total={o.lives} label={t('lives', { count: p.score })} />
          </p>
        </>
      );
    }
    case 'targets': {
      const o = state.options as TargetsOptions;
      const target = o.targets[p.step];
      return (
        <>
          <p className={big}>{p.score}</p>
          <p className={small}>
            {t('hits')} ·{' '}
            {target
              ? t('targetOf', {
                  target: targetLabel(target),
                  step: p.step + 1,
                  steps: o.targets.length,
                })
              : t('done')}
          </p>
          <Progress
            value={p.step * o.dartsPerTarget + p.stepUsed}
            max={o.targets.length * o.dartsPerTarget}
          />
        </>
      );
    }
    case 'checkout': {
      const o = state.options as CheckoutOptions;
      const finished = p.step >= o.finishes.length;
      return (
        <>
          <p className={big}>{finished ? p.score : p.remaining}</p>
          <p className={small}>
            {finished
              ? t('finishesDone', { hits: p.score, total: o.finishes.length })
              : t('finishOf', {
                  step: p.step + 1,
                  steps: o.finishes.length,
                  hits: p.score,
                })}
          </p>
          <Progress value={p.step} max={o.finishes.length} />
        </>
      );
    }
    default:
      return null;
  }
}

function Progress({ value, max }: { value: number; max: number }) {
  const pct = max ? Math.min(100, (value / max) * 100) : 0;
  return (
    <svg viewBox="0 0 100 8" preserveAspectRatio="none" className="mt-2 h-2 w-full" aria-hidden>
      <rect width="100" height="8" rx="4" className="fill-ink/10 dark:fill-paper/15" />
      <rect width={pct} height="8" rx="4" fill="#f97316" />
    </svg>
  );
}

function CricketBoard({ state, meId }: { state: GameState; meId: number | null }) {
  const t = useT('score');
  const former = t('formerPlayer');
  const legs = (state.options as { legs: number }).legs;
  return (
    <div className="overflow-x-auto rounded-xl border border-ink/10 bg-white/70 dark:border-paper/10 dark:bg-paper/5">
      <table className="w-full text-center text-sm">
        <thead>
          <tr>
            <th
              scope="col"
              className="p-2 text-left text-xs font-medium text-ink/60 dark:text-paper/60"
            >
              {t('number')}
            </th>
            {state.players.map((p) => (
              <th
                key={p.id}
                scope="col"
                aria-current={state.current === p.id ? 'true' : undefined}
                className={cn(
                  'p-2 font-medium',
                  state.current === p.id && 'bg-quake/15 text-quake',
                  state.winner === p.id && 'text-green-700 dark:text-green-400',
                )}
              >
                <span className="block truncate">
                  {playerName(p.name, former)}
                  {p.id === meId ? ` · ${t('you')}` : ''}
                </span>
                {legs > 1 ? (
                  <span className="text-xs text-ink/60 dark:text-paper/60">
                    {t('legs', { count: p.legs })}
                  </span>
                ) : null}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {CRICKET_NUMBERS.map((n) => {
            const closedByAll = state.players.every((p) => (p.marks[n] ?? 0) >= 3);
            return (
              <tr
                key={n}
                className={cn(
                  'border-t border-ink/10 dark:border-paper/10',
                  closedByAll && 'opacity-40',
                )}
              >
                <th scope="row" className="p-2 text-left font-display text-lg font-bold">
                  {n === BULL ? t('bull') : n}
                </th>
                {state.players.map((p) => (
                  <td key={p.id} className="p-1">
                    <CricketMark
                      marks={p.marks[n] ?? 0}
                      label={t('marks', { count: Math.min(3, p.marks[n] ?? 0) })}
                    />
                  </td>
                ))}
              </tr>
            );
          })}
          <tr className="border-t-2 border-ink/20 dark:border-paper/20">
            <th
              scope="row"
              className="p-2 text-left text-xs font-medium text-ink/60 dark:text-paper/60"
            >
              {t('points')}
            </th>
            {state.players.map((p) => (
              <td key={p.id} className="p-2 font-display text-2xl font-bold tabular-nums">
                {p.score}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

/** The target of the player on turn, for the header ("Aim: 7", "Next finish: 81"...). */
export function useTargetHint(state: GameState): string | null {
  const t = useT('score');
  if (state.finished || state.current === null) return null;
  if (state.type === 'shanghai') {
    const target = shanghaiTarget(state);
    return t('shanghaiTarget', { target: target === BULL ? t('bull') : String(target) });
  }
  const target = currentTarget(state);
  if (state.type === 'atc' && target) {
    return t('aim', { target: target.n === BULL ? t('bull') : targetLabel(target) });
  }
  return null;
}
