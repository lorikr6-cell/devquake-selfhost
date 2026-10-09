'use client';

import { useState } from 'react';
import { Button, cn, trackEvent, useT } from '@devquake/ui';
import {
  DEFAULT_OPTIONS,
  GAMES_BY_MODE,
  PLAYER_LIMITS,
  type GameOptions,
  type GameType,
  type Mode,
} from '../lib/engine/games';
import { callApi } from './call-api';
import { GameOptionsEditor } from './game-options';
import { GameIcon } from './icons';
import { useFeedback } from './feedback';
import { ErrorText, Panel } from './ui';
import { useAction } from './use-action';

/** Choosing a game (cards with its rules) and its options, then starting it. */
export function NewGame({ mode }: { mode: Extract<Mode, 'practice' | 'casual'> }) {
  const t = useT();
  const { toast } = useFeedback();
  const { busy, error, act, router } = useAction();
  const games = GAMES_BY_MODE[mode];
  const [type, setType] = useState<GameType>(games[0]!);
  const [options, setOptions] = useState<GameOptions>(DEFAULT_OPTIONS[games[0]!]);

  const choose = (next: GameType) => {
    setType(next);
    setOptions(DEFAULT_OPTIONS[next]);
  };

  const start = () =>
    act(
      async () => {
        const res = await callApi<{ id: number }>('/games', 'POST', { mode, type, options });
        trackEvent('game_created', { mode, game: type });
        toast(t(mode === 'practice' ? 'toasts.practiceStarted' : 'toasts.gameCreated'));
        router.push(`/games/${res!.id}`);
      },
      () => undefined,
    );

  const limits = PLAYER_LIMITS[type];
  return (
    <div className="space-y-4">
      <ul
        role="radiogroup"
        aria-label={t('newGame.pick')}
        className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4"
      >
        {games.map((g) => (
          <li key={g}>
            <button
              type="button"
              role="radio"
              aria-checked={g === type}
              onClick={() => choose(g)}
              className={cn(
                'flex h-full w-full flex-col items-center gap-1 rounded-xl border p-3 text-center transition-colors focus-visible:outline-2 focus-visible:outline-quake',
                g === type
                  ? 'border-quake bg-quake/10'
                  : 'border-ink/10 bg-white/70 hover:border-quake/60 dark:border-paper/10 dark:bg-paper/5',
              )}
            >
              <GameIcon type={g} className="size-10" />
              <span className="font-display font-bold">{t(`games.names.${g}`)}</span>
              <span className="text-xs text-ink/60 dark:text-paper/60">
                {t(`games.short.${g}`)}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <Panel className="space-y-4">
        <div>
          <h3 className="font-display text-lg font-bold">{t(`games.names.${type}`)}</h3>
          <p className="mt-1 text-sm text-ink/70 dark:text-paper/70">{t(`games.rules.${type}`)}</p>
          {mode === 'casual' ? (
            <p className="mt-1 text-xs text-ink/60 dark:text-paper/60">
              {t('newGame.players', { min: limits.min, max: limits.max })}
            </p>
          ) : null}
        </div>
        <GameOptionsEditor type={type} options={options} onChange={setOptions} />
        <ErrorText>{error}</ErrorText>
        <Button type="button" onClick={start} disabled={busy} className="min-h-11">
          {busy
            ? t('newGame.starting')
            : mode === 'practice'
              ? t('newGame.startPractice')
              : t('newGame.create')}
        </Button>
      </Panel>
    </div>
  );
}
