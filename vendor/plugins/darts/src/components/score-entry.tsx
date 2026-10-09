'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, cn, useT } from '@devquake/ui';
import {
  BULL,
  MISS,
  dartLabel,
  dartValue,
  isDart,
  textToDarts,
  type Dart,
  type Multiplier,
} from '../lib/engine/darts';
import {
  CRICKET_NUMBERS,
  EngineError,
  playerOf,
  preview,
  type EventKind,
  type GameState,
} from '../lib/engine/engine';
import { quickPicks, type QuickPick } from '../lib/engine/quick';
import { suggestions, type Suggestion } from '../lib/engine/suggest';
import type { EntryMode } from '../lib/model';
import { Dartboard } from './dartboard';
import { CricketMark } from './icons';
import { Segmented } from './ui';

/** How long the keypad waits for a second digit ("1" → 1 or 10–19) from the keyboard. */
const DIGIT_WAIT_MS = 700;
const SUGGESTION_ROWS = 3;
const QUICK_SLOTS = 8;

export interface EntryResult {
  ok: boolean;
  over: boolean;
  events: EventKind[];
  /** The game with the darts entered so far (null when they cannot be thrown). */
  state: GameState | null;
}

/**
 * Entering a visit: tap the dartboard, or use the keypad (one tap per dart, with double and
 * treble keys, keyboard shortcuts and one-click visits). Every dart is checked with the rules
 * as it is entered; the scores update at once. The status line, the hints and the error line
 * keep their place, so nothing jumps while the player is entering darts.
 */
export function ScoreEntry({
  state,
  mode,
  onMode,
  favorite,
  habits,
  busy,
  onSubmit,
  onLive,
}: {
  state: GameState;
  /** Board or keypad; kept by the game screen so it stays the same between visits. */
  mode: EntryMode;
  onMode: (mode: EntryMode) => void;
  favorite: number | null;
  /** The player's frequent visits ("T20,20,5"), for the one-click visits. */
  habits: string[];
  busy: boolean;
  /** Sends the visit; resolves true when it was saved. */
  onSubmit: (darts: Dart[]) => Promise<boolean>;
  /** The game with the darts entered so far, for the scoreboard (null: nothing entered). */
  onLive: (state: GameState | null) => void;
}) {
  const t = useT('entry');
  const tErr = useT('errors');
  const [pending, setPending] = useState<Dart[]>([]);
  const [error, setError] = useState('');
  const me = playerOf(state, state.current);

  const result: EntryResult = useMemo(() => {
    try {
      const p = preview(state, pending);
      return { ok: true, over: p.over, events: p.events, state: p.state };
    } catch {
      return { ok: false, over: false, events: [], state: null };
    }
  }, [state, pending]);

  useEffect(() => {
    onLive(pending.length && result.state ? result.state : null);
  }, [pending.length, result.state, onLive]);

  const hints: Suggestion[] = useMemo(
    () => (result.state && !result.over ? suggestions(result.state, pending, favorite) : []),
    [result, pending, favorite],
  );
  const habitDarts = useMemo(() => habits.map(textToDarts), [habits]);
  const picks = useMemo(
    () =>
      mode === 'keypad' && !result.over ? quickPicks(state, pending, habitDarts, favorite) : [],
    [mode, result.over, state, pending, habitDarts, favorite],
  );

  const add = (darts: Dart[]) => {
    setError('');
    if (result.over || pending.length + darts.length > 3) return;
    if (!darts.every(isDart)) return setError(t('invalidNumber'));
    try {
      preview(state, [...pending, ...darts]);
      setPending([...pending, ...darts]);
    } catch (err) {
      setError(tErr(err instanceof EngineError ? err.code : 'invalidDart'));
    }
  };
  const undo = () => {
    setError('');
    setPending(pending.slice(0, -1));
  };
  const ready = result.ok && (result.over || pending.length === 3);
  const submit = async () => {
    if (!ready || busy) return;
    setError('');
    if (await onSubmit(pending)) setPending([]);
  };

  const label = useSubmitLabel(state, result, pending.length);
  const total = pending.reduce((s, d) => s + dartValue(d), 0);
  const live = result.state ? playerOf(result.state, me?.id ?? null) : null;
  const left =
    state.type === 'x01'
      ? (live?.score ?? me?.score)
      : state.type === 'checkout'
        ? (live?.remaining ?? me?.remaining)
        : null;

  return (
    <div className="space-y-3">
      <Segmented
        name="entry-mode"
        label={t('modeLabel')}
        value={mode}
        options={[
          { value: 'board', label: t('board') },
          { value: 'keypad', label: t('keypad') },
        ]}
        onChange={onMode}
      />

      {/* The three darts, the visit's total and (counting down) what is left. */}
      <div className="flex items-stretch gap-2">
        {[0, 1, 2].map((i) => {
          const d = pending[i];
          return (
            <div
              key={i}
              className={cn(
                'flex h-14 flex-1 flex-col items-center justify-center rounded-lg border text-center',
                d
                  ? 'border-ink/30 bg-white dark:border-paper/30 dark:bg-paper/10'
                  : 'border-dashed border-ink/20 dark:border-paper/20',
                i === pending.length && !result.over && 'border-quake ring-1 ring-quake',
              )}
            >
              <span className="text-[10px] uppercase tracking-wide text-ink/50 dark:text-paper/50">
                {t('dart', { n: i + 1 })}
              </span>
              <span className="font-mono text-xl font-bold">{d ? dartLabel(d) : '–'}</span>
            </div>
          );
        })}
        <div className="flex h-14 w-16 flex-col items-center justify-center rounded-lg border border-ink/20 dark:border-paper/20">
          <span className="text-[10px] uppercase tracking-wide text-ink/50 dark:text-paper/50">
            {t('total')}
          </span>
          <span className="font-display text-xl font-bold tabular-nums">{total}</span>
        </div>
        {left !== null && left !== undefined ? (
          <div
            aria-live="polite"
            className={cn(
              'flex h-14 w-20 flex-col items-center justify-center rounded-lg text-paper',
              result.events.includes('bust') ? 'bg-red-700' : 'bg-ink dark:bg-paper dark:text-ink',
            )}
          >
            <span className="text-[10px] uppercase tracking-wide opacity-70">{t('left')}</span>
            <span className="font-display text-2xl font-bold tabular-nums">{left}</span>
          </div>
        ) : null}
      </div>

      {/* Cricket: your marks, updated with every dart. */}
      {state.type === 'cricket' && (live ?? me) ? (
        <CricketStrip marks={(live ?? me)!.marks} before={me?.marks ?? {}} />
      ) : null}

      <StatusLine result={result} thrown={pending.length} />

      <HintsBox hints={hints} over={result.over} label={label} total={total} />

      {mode === 'board' ? (
        <div className="flex justify-center">
          <Dartboard
            label={t('boardLabel')}
            onHit={(d) => add([d])}
            disabled={result.over || busy}
            marks={pending}
            highlight={hints.map((h) => h.darts[0]!).filter(Boolean)}
          />
        </div>
      ) : (
        <>
          <QuickVisits
            picks={picks}
            disabled={busy || result.over}
            onPick={(p) => add(p.darts)}
            scoring={['x01', 'checkout', 'countup'].includes(state.type)}
          />
          <Keypad
            onAdd={(d) => add([d])}
            onUndo={undo}
            onSubmit={submit}
            disabled={result.over || busy}
          />
        </>
      )}

      {/* Reserved line: the layout never moves when an error appears. */}
      <p role="alert" className="min-h-5 text-sm text-red-700 dark:text-red-400">
        {error}
      </p>

      <div className="sticky bottom-0 -mx-1 flex gap-2 bg-paper/95 px-1 py-2 backdrop-blur dark:bg-ink/95">
        <Button
          type="button"
          variant="secondary"
          onClick={() => add([MISS])}
          disabled={result.over || busy || pending.length >= 3}
        >
          {t('miss')}
        </Button>
        <Button type="button" variant="ghost" onClick={undo} disabled={!pending.length || busy}>
          {t('undoDart')}
        </Button>
        <Button
          type="button"
          className={cn(
            'ml-auto min-h-11 min-w-36 truncate',
            ready &&
              result.events.includes('win') &&
              'bg-green-700 text-white hover:bg-green-800 dark:bg-green-600 dark:text-white dark:hover:bg-green-700',
            ready &&
              result.events.includes('bust') &&
              'bg-red-700 text-white hover:bg-red-800 dark:bg-red-600 dark:text-white dark:hover:bg-red-700',
          )}
          onClick={submit}
          disabled={busy || !ready}
        >
          {busy ? t('sending') : label}
        </Button>
      </div>
    </div>
  );
}

/**
 * What sending the visit does, as the button's label: hands over to the next player, starts
 * your next visit, wins the leg or the game, ends it — or how many darts are still to enter.
 */
function useSubmitLabel(base: GameState, result: EntryResult, thrown: number): string {
  const t = useT('entry');
  const tScore = useT('score');
  if (!result.ok) return t('submitFix');
  if (!result.over && thrown < 3) return t('throwMore', { count: 3 - thrown });
  const after = result.state!;
  const solo = base.players.length === 1;
  const next = playerOf(after, after.current);
  const nextName = next?.name || tScore('formerPlayer');
  const e = result.events;
  if (e.includes('win')) return t('submitWin');
  if (after.finished) return solo ? t('submitFinish') : t('submitEnd');
  if (e.includes('leg')) return t('submitLeg');
  if (e.includes('checkout') || e.includes('missed')) return t('submitNextScore');
  if (e.includes('bust')) return solo ? t('submitBustSolo') : t('submitBust', { name: nextName });
  return solo ? t('submitNextVisit') : t('submitNext', { name: nextName });
}

/** One fixed line: what just happened (bust, finish...) or which dart is next. */
function StatusLine({ result, thrown }: { result: EntryResult; thrown: number }) {
  const t = useT('entry');
  const tEv = useT('events');
  const tErr = useT('errors');
  const good: EventKind[] = ['win', 'leg', 'shanghai', 'killer', 'checkout', 'eliminated'];
  return (
    <div aria-live="polite" className="flex h-9 items-center gap-2 overflow-hidden">
      {!result.ok ? (
        <span className="text-sm text-red-700 dark:text-red-400">{tErr('invalidDart')}</span>
      ) : result.events.length ? (
        result.events.map((e, i) => (
          <span
            key={`${e}${i}`}
            className={cn(
              'shrink-0 rounded-full px-3 py-1 text-sm font-bold text-white',
              good.includes(e) ? 'bg-green-600' : 'bg-red-700',
            )}
          >
            {tEv(e)}
          </span>
        ))
      ) : (
        <span className="text-sm text-ink/60 dark:text-paper/60">
          {result.over ? t('visitDone') : t('nextDart', { n: thrown + 1 })}
        </span>
      )}
    </div>
  );
}

/** Cricket marks of the player on turn; the ones added in this visit are highlighted. */
function CricketStrip({
  marks,
  before,
}: {
  marks: Record<number, number>;
  before: Record<number, number>;
}) {
  const t = useT('score');
  return (
    <ul className="grid grid-cols-7 gap-1" aria-label={t('number')}>
      {CRICKET_NUMBERS.map((n) => {
        const now = marks[n] ?? 0;
        const added = now > (before[n] ?? 0);
        return (
          <li
            key={n}
            className={cn(
              'flex h-14 flex-col items-center justify-center rounded-md border',
              added ? 'border-quake bg-quake/10' : 'border-ink/10 dark:border-paper/10',
            )}
          >
            <span className="text-xs font-bold">{n === BULL ? t('bull') : n}</span>
            <CricketMark marks={now} label={t('marks', { count: Math.min(3, now) })} />
          </li>
        );
      })}
    </ul>
  );
}

/** A dart in words: "Treble 20", "Double 16", "Bull (50)", or "7 (any ring)". */
function useDartName() {
  const t = useT('board');
  return (d: Dart, anyRing = false) => {
    if (d.n === 0) return t('miss');
    if (d.n === BULL) return anyRing ? t('anyBull') : d.m === 2 ? t('bull') : t('outerBull');
    if (anyRing) return t('anyRing', { n: d.n });
    return t(d.m === 3 ? 'treble' : d.m === 2 ? 'double' : 'single', { n: d.n });
  };
}

/**
 * Where to aim, in a box of fixed height: three rows (empty rows keep their place) with the
 * darts in words, and the chosen row's explanation below. After the last dart it says the visit
 * is complete and what sending it does.
 */
function HintsBox({
  hints,
  over,
  label,
  total,
}: {
  hints: Suggestion[];
  over: boolean;
  label: string;
  total: number;
}) {
  const t = useT('suggest');
  const tEntry = useT('entry');
  const tScore = useT('score');
  const dartName = useDartName();
  const [chosen, setChosen] = useState(0);
  const pick = Math.min(chosen, Math.max(0, hints.length - 1));
  const values = (h: Suggestion) =>
    Object.fromEntries(
      Object.entries(h.params ?? {}).map(([k, v]) => [
        k,
        (k === 'n' || k === 'target') && v === BULL
          ? t('bull')
          : k === 'name' && v === ''
            ? tScore('formerPlayer')
            : v,
      ]),
    );
  const current = hints[pick];
  return (
    <section aria-label={t('title')} className="rounded-xl border border-quake/40 bg-quake/5 p-3">
      <p className="flex items-baseline justify-between gap-2">
        <span className="font-display text-base font-bold text-quake">{t('title')}</span>
        <span className="hidden text-xs text-ink/50 sm:inline dark:text-paper/50">
          {t('intro')}
        </span>
      </p>
      {over ? (
        <div className="flex h-48 flex-col justify-center text-center">
          <p className="font-display text-lg font-bold">{tEntry('visitTotal', { total })}</p>
          <p className="mt-1 text-sm text-ink/70 dark:text-paper/70">
            {tEntry('sendHint', { action: label })}
          </p>
        </div>
      ) : (
        <>
          <ol className="mt-2 space-y-1">
            {Array.from({ length: SUGGESTION_ROWS }, (_, i) => {
              const h = hints[i];
              return (
                <li key={i} className="h-9">
                  {h ? (
                    <button
                      type="button"
                      onClick={() => setChosen(i)}
                      aria-pressed={i === pick}
                      className={cn(
                        'flex h-9 w-full items-center gap-1.5 overflow-x-auto whitespace-nowrap rounded-md px-1.5 text-left',
                        i === pick ? 'bg-quake/15' : 'hover:bg-quake/10',
                      )}
                    >
                      <span className="w-5 shrink-0 text-xs font-bold text-ink/50 dark:text-paper/50">
                        {i + 1}
                      </span>
                      {h.darts.map((d, k) => (
                        <span key={k} className="contents">
                          {k > 0 ? (
                            <span aria-hidden className="font-bold text-ink/50 dark:text-paper/50">
                              {h.anyOrder ? '+' : '→'}
                            </span>
                          ) : null}
                          <span
                            className={cn(
                              'shrink-0 rounded-md border px-2 py-0.5 text-sm font-semibold',
                              i === 0 && k === 0
                                ? 'border-quake bg-quake text-white'
                                : 'border-ink/20 bg-white dark:border-paper/20 dark:bg-ink',
                            )}
                          >
                            {dartName(d, h.anyRing)}
                          </span>
                        </span>
                      ))}
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ol>
          <p className="mt-2 min-h-15 text-sm text-ink/75 dark:text-paper/75">
            {current ? t(`explain.${current.why}`, values(current)) : t('none')}
          </p>
        </>
      )}
    </section>
  );
}

/** One click enters a whole visit (the darts still to throw); fixed slots so nothing moves. */
function QuickVisits({
  picks,
  disabled,
  onPick,
  scoring,
}: {
  picks: QuickPick[];
  disabled: boolean;
  onPick: (pick: QuickPick) => void;
  scoring: boolean;
}) {
  const t = useT('entry');
  return (
    <section aria-label={t('quick')} className="space-y-1">
      <p className="flex items-baseline justify-between gap-2 text-sm">
        <span className="font-semibold">{t('quick')}</span>
        <span className="text-xs text-ink/50 dark:text-paper/50">{t('quickHint')}</span>
      </p>
      <ul className="grid grid-cols-4 gap-1.5">
        {Array.from({ length: QUICK_SLOTS }, (_, i) => {
          const p = picks[i];
          return (
            <li key={i} className="h-14">
              {p ? (
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onPick(p)}
                  title={t(`quickKind.${p.kind}`)}
                  className={cn(
                    'flex h-14 w-full flex-col items-center justify-center rounded-lg border px-1 transition-colors disabled:opacity-40',
                    p.kind === 'finish'
                      ? 'border-green-600 bg-green-600/10 hover:bg-green-600/20'
                      : p.kind === 'habit'
                        ? 'border-quake bg-quake/10 hover:bg-quake/20'
                        : 'border-ink/15 hover:bg-ink/5 dark:border-paper/15 dark:hover:bg-paper/10',
                  )}
                >
                  {scoring ? (
                    <span className="font-display text-lg font-bold leading-tight tabular-nums">
                      {p.total}
                    </span>
                  ) : null}
                  <span
                    className={cn(
                      'max-w-full truncate font-mono',
                      scoring ? 'text-[11px] text-ink/60 dark:text-paper/60' : 'text-sm font-bold',
                    )}
                  >
                    {p.darts.map(dartLabel).join(' ')}
                  </span>
                </button>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/**
 * One tap per dart: choose Double or Treble first if needed (it applies to the next dart only),
 * then the number. On a keyboard: D or T, then the number (two digits are waited for briefly),
 * B for the bull, O for the outer bull, 0 for a miss, Backspace to undo, Enter to send.
 */
function Keypad({
  onAdd,
  onUndo,
  onSubmit,
  disabled,
}: {
  onAdd: (d: Dart) => void;
  onUndo: () => void;
  onSubmit: () => void;
  disabled: boolean;
}) {
  const t = useT('entry');
  const [m, setM] = useState<Multiplier>(1);
  const digits = useRef('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handlers = useRef({ onAdd, onUndo, onSubmit, m, disabled });
  handlers.current = { onAdd, onUndo, onSubmit, m, disabled };

  const hit = (n: number) => {
    const mult = handlers.current.m;
    handlers.current.onAdd({ n, m: n === 0 ? 1 : mult });
    setM(1);
  };

  useEffect(() => {
    const commit = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
      const n = Number(digits.current);
      digits.current = '';
      if (n === 0 || (n >= 1 && n <= 20) || n === BULL) hit(n);
    };
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      )
        return;
      const k = e.key.toLowerCase();
      if (k === 'enter') {
        e.preventDefault();
        return handlers.current.onSubmit();
      }
      if (k === 'backspace') {
        e.preventDefault();
        return handlers.current.onUndo();
      }
      if (handlers.current.disabled) return;
      if (k === 'd' || k === 't' || k === 's') return setM(k === 't' ? 3 : k === 'd' ? 2 : 1);
      if (k === 'b') return handlers.current.onAdd({ n: BULL, m: 2 });
      if (k === 'o') return handlers.current.onAdd({ n: BULL, m: 1 });
      if (!/^[0-9]$/.test(k)) return;
      e.preventDefault();
      digits.current += k;
      // "0" alone is a miss; 3–9 cannot start a two-digit number; 1x and 20/25 can.
      const first = digits.current[0]!;
      if (digits.current.length === 2 || first === '0' || Number(first) >= 3) return commit();
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(commit, DIGIT_WAIT_MS);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      if (timer.current) clearTimeout(timer.current);
    };
    // hit reads the latest values through handlers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mod = (value: Multiplier, label: string) => (
    <button
      type="button"
      aria-pressed={m === value}
      disabled={disabled}
      onClick={() => setM(m === value ? 1 : value)}
      className={cn(
        'h-12 rounded-lg border text-sm font-bold uppercase tracking-wide transition-colors disabled:opacity-40',
        m === value
          ? 'border-quake bg-quake text-white'
          : 'border-ink/20 hover:bg-ink/5 dark:border-paper/20 dark:hover:bg-paper/10',
      )}
    >
      {label}
    </button>
  );
  const key =
    'h-12 rounded-lg border border-ink/15 bg-white text-lg font-bold tabular-nums transition-colors hover:border-quake hover:bg-quake/10 active:bg-quake/25 disabled:opacity-40 dark:border-paper/15 dark:bg-paper/5';
  const prefix = m === 3 ? 'T' : m === 2 ? 'D' : '';
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-1.5">
        {mod(2, t('double'))}
        {mod(3, t('treble'))}
      </div>
      <div className="grid grid-cols-5 gap-1.5">
        {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
          <button key={n} type="button" className={key} disabled={disabled} onClick={() => hit(n)}>
            {prefix}
            {n}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        <button
          type="button"
          className={key}
          disabled={disabled}
          onClick={() => {
            onAdd({ n: BULL, m: 1 });
            setM(1);
          }}
        >
          25
        </button>
        <button
          type="button"
          className={key}
          disabled={disabled}
          onClick={() => {
            onAdd({ n: BULL, m: 2 });
            setM(1);
          }}
        >
          {t('bull')}
        </button>
        <button type="button" className={key} disabled={disabled} onClick={() => hit(0)}>
          {t('miss')}
        </button>
      </div>
      <p className="hidden text-xs text-ink/50 sm:block dark:text-paper/50">{t('keysHint')}</p>
    </div>
  );
}
