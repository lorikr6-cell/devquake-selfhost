'use client';

import { useState, type FormEvent } from 'react';
import { Button, cn, trackEvent, useLocale, LOCALE_TAGS, useT } from '@devquake/ui';
import {
  DEFAULT_OPTIONS,
  GAMES_BY_MODE,
  type GameOptions,
  type GameType,
} from '../lib/engine/games';
import { CURRENCIES, formatMoney } from '../lib/model';
import { MAX_BOARDS, pot } from '../lib/tournament';
import { callApi } from './call-api';
import { GameOptionsEditor } from './game-options';
import { GameIcon } from './icons';
import { useFeedback } from './feedback';
import { ErrorText, Field, Input, Panel, Select } from './ui';
import { useAction } from './use-action';

/** A new tournament: name, game, entry fee and the organiser's share, boards. */
export function TournamentForm({ defaultCurrency }: { defaultCurrency: string }) {
  const t = useT('newTournament');
  const tAll = useT();
  const locale = useLocale();
  const { toast } = useFeedback();
  const { busy, error, act, router } = useAction();
  const games = GAMES_BY_MODE.tournament;
  const [name, setName] = useState('');
  const [type, setType] = useState<GameType>(games[0]!);
  const [options, setOptions] = useState<GameOptions>(DEFAULT_OPTIONS[games[0]!]);
  const [fee, setFee] = useState('0');
  const [currency, setCurrency] = useState(defaultCurrency);
  const [pct, setPct] = useState('0');
  const [boards, setBoards] = useState('2');
  const [playToo, setPlayToo] = useState(false);

  const feeCents = Math.round(Number(fee.replace(',', '.')) * 100) || 0;
  const example = pot(feeCents, 8, Number(pct) || 0);
  const money = (cents: number) => formatMoney(cents, currency, LOCALE_TAGS[locale]);

  function create(event: FormEvent) {
    event.preventDefault();
    act(
      async () => {
        const res = await callApi<{ id: number }>('/tournaments', 'POST', {
          name,
          type,
          options,
          fee,
          currency,
          organizerPct: Number(pct),
          boards: Number(boards),
          play: playToo,
        });
        trackEvent('tournament_created', { game: type });
        toast(tAll('toasts.tournamentCreated'));
        router.push(`/tournaments/${res!.id}`);
      },
      () => undefined,
    );
  }

  return (
    <form onSubmit={create} className="space-y-5">
      <Panel className="space-y-4">
        <Field label={t('name')}>
          <Input required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <div>
          <p className="mb-2 text-sm font-medium">{t('game')}</p>
          <ul
            role="radiogroup"
            aria-label={t('game')}
            className="grid grid-cols-2 gap-2 sm:grid-cols-5"
          >
            {games.map((g) => (
              <li key={g}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={g === type}
                  onClick={() => {
                    setType(g);
                    setOptions(DEFAULT_OPTIONS[g]);
                  }}
                  className={cn(
                    'flex w-full flex-col items-center gap-1 rounded-xl border p-2 text-sm font-medium',
                    g === type ? 'border-quake bg-quake/10' : 'border-ink/10 dark:border-paper/10',
                  )}
                >
                  <GameIcon type={g} className="size-8" />
                  {tAll(`games.names.${g}`)}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <GameOptionsEditor type={type} options={options} onChange={setOptions} />
      </Panel>

      <Panel className="space-y-4">
        <h2 className="font-display text-lg font-bold">{t('feeTitle')}</h2>
        <p className="text-sm text-ink/70 dark:text-paper/70">{t('feeIntro')}</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label={t('fee')}>
            <Input inputMode="decimal" value={fee} onChange={(e) => setFee(e.target.value)} />
          </Field>
          <Field label={t('currency')}>
            <Select value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {CURRENCIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </Field>
          <Field label={t('organizerPct')} hint={t('organizerPctHint')}>
            <Input
              type="number"
              min={0}
              max={100}
              value={pct}
              onChange={(e) => setPct(e.target.value)}
            />
          </Field>
        </div>
        {feeCents > 0 ? (
          <p className="text-sm text-ink/70 dark:text-paper/70">
            {t('example', {
              total: money(example.total),
              organizer: money(example.organizer),
              prize: money(example.prize),
            })}
          </p>
        ) : null}
      </Panel>

      <Panel className="space-y-4">
        <Field label={t('boards')} hint={t('boardsHint')} className="max-w-40">
          <Input
            type="number"
            min={1}
            max={MAX_BOARDS}
            value={boards}
            onChange={(e) => setBoards(e.target.value)}
          />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={playToo} onChange={(e) => setPlayToo(e.target.checked)} />
          {t('playToo')}
        </label>
      </Panel>

      <ErrorText>{error}</ErrorText>
      <Button type="submit" disabled={busy} className="min-h-11">
        {busy ? t('creating') : t('create')}
      </Button>
    </form>
  );
}
