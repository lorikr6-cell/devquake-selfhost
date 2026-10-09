'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Button, Sheet, cn, trackEvent, useT } from '@devquake/ui';
import { CURRENCIES, TOURNAMENT_POLL_MS } from '../lib/model';
import type { Pairing } from '../lib/tournament';
import type { BoardView, TournamentPlayerView, TournamentView } from '../lib/views';
import { callApi } from './call-api';
import { useFeedback } from './feedback';
import { CopyButton } from './game-screen';
import { ErrorText, Field, Input, Panel, Select } from './ui';
import { useAction } from './use-action';
import { useAppRouter } from './use-app-router';

/** Re-renders the tournament page when anything in it changed (asks every few seconds). */
export function TournamentLive({ id, version }: { id: number; version: number }) {
  const router = useAppRouter();
  const known = useRef(version);
  useEffect(() => {
    known.current = version;
  }, [version]);
  useEffect(() => {
    const check = async () => {
      if (document.visibilityState !== 'visible') return;
      const res = await callApi<{ changed: boolean; version: number }>(
        `/tournaments/${id}?v=${known.current}`,
      ).catch(() => null);
      if (res?.changed) {
        known.current = res.version;
        router.refresh();
      }
    };
    const timer = setInterval(check, TOURNAMENT_POLL_MS);
    document.addEventListener('visibilitychange', check);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', check);
    };
  }, [id, router]);
  return null;
}

interface Suggestion {
  round: number;
  pairing: Pairing;
  players: { id: number; name: string; rating: number }[];
}

/**
 * Drawing the next round: the app suggests pairs of players of similar strength; tap one
 * player and then another to swap them (the bye too), then start the round.
 */
export function RoundDrawer({ tournamentId, label }: { tournamentId: number; label: string }) {
  const t = useT('rounds');
  const tToast = useT('toasts');
  const { toast } = useFeedback();
  const { busy, error, setError, act } = useAction();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Suggestion | null>(null);
  const [picked, setPicked] = useState<number | null>(null);

  const load = () =>
    act(
      async () => {
        const res = await callApi<Suggestion>(`/tournaments/${tournamentId}/rounds`);
        setDraft(res);
        setPicked(null);
        setOpen(true);
      },
      () => undefined,
    );

  // Slots: every pair position, then the bye.
  const slots = draft
    ? [...draft.pairing.pairs.flat(), ...(draft.pairing.bye === null ? [] : [draft.pairing.bye])]
    : [];
  const fromSlots = (list: number[]): Pairing => {
    const pairs: [number, number][] = [];
    const n = draft!.pairing.pairs.length;
    for (let i = 0; i < n; i++) pairs.push([list[i * 2]!, list[i * 2 + 1]!]);
    return { pairs, bye: draft!.pairing.bye === null ? null : list[n * 2]! };
  };
  const tap = (index: number) => {
    if (picked === null) return setPicked(index);
    if (picked !== index) {
      const list = [...slots];
      [list[picked], list[index]] = [list[index]!, list[picked]!];
      setDraft({ ...draft!, pairing: fromSlots(list) });
    }
    setPicked(null);
  };
  const who = (id: number) => draft!.players.find((p) => p.id === id);
  const chip = (id: number, index: number) => {
    const p = who(id);
    return (
      <button
        type="button"
        onClick={() => tap(index)}
        aria-pressed={picked === index}
        className={cn(
          'flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm',
          picked === index
            ? 'border-quake bg-quake/15'
            : 'border-ink/15 hover:border-quake/60 dark:border-paper/15',
        )}
      >
        <span className="truncate font-medium">{p?.name || t('formerPlayer')}</span>
        <span className="shrink-0 text-xs text-ink/60 dark:text-paper/60">
          {t('rating', { value: (p?.rating ?? 0).toFixed(1) })}
        </span>
      </button>
    );
  };

  return (
    <>
      <Button type="button" className="min-h-11" onClick={load} disabled={busy}>
        {label}
      </Button>
      {!open ? <ErrorText>{error}</ErrorText> : null}
      <Sheet open={open && draft !== null} onClose={() => setOpen(false)} labelledBy="round-title">
        {draft ? (
          <div className="space-y-4">
            <h2 id="round-title" className="font-display text-xl font-bold">
              {t('title', { round: draft.round })}
            </h2>
            <p className="text-sm text-ink/70 dark:text-paper/70">{t('intro')}</p>
            <ol className="space-y-2">
              {draft.pairing.pairs.map(([a, b], i) => (
                <li key={i} className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                  {chip(a, i * 2)}
                  <span className="text-xs font-bold text-ink/50 dark:text-paper/50">
                    {t('vs')}
                  </span>
                  {chip(b, i * 2 + 1)}
                </li>
              ))}
            </ol>
            {draft.pairing.bye !== null ? (
              <div>
                <p className="mb-1 text-sm font-medium">{t('bye')}</p>
                {chip(draft.pairing.bye, draft.pairing.pairs.length * 2)}
              </div>
            ) : null}
            <ErrorText>{error}</ErrorText>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                className="min-h-11"
                disabled={busy}
                onClick={() =>
                  act(async () => {
                    await callApi(`/tournaments/${tournamentId}/rounds`, 'POST', draft.pairing);
                    trackEvent('tournament_round_started', { round: draft.round });
                    setOpen(false);
                    toast(tToast('roundStarted', { round: draft.round }));
                  })
                }
              >
                {t('start')}
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={busy}
                onClick={() => {
                  setError('');
                  void load();
                }}
              >
                {t('suggestAgain')}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                {t('cancel')}
              </Button>
            </div>
          </div>
        ) : null}
      </Sheet>
    </>
  );
}

/** The organiser's boards: code and QR code to print, rename, remove, add one. */
export function BoardsPanel({
  view,
  qrs,
  baseUrl,
}: {
  view: TournamentView;
  /** QR code SVG per board id (made on the server). */
  qrs: Record<number, string>;
  baseUrl: string;
}) {
  const t = useT('boards');
  const tToast = useT('toasts');
  const { toast } = useFeedback();
  const { busy, error, act } = useAction();
  return (
    <Panel className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <h2 className="font-display text-lg font-bold">{t('title')}</h2>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={() => window.print()}>
            {t('print')}
          </Button>
          {view.status !== 'finished' ? (
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={async () => {
                if (await act(() => callApi(`/tournaments/${view.id}/boards`, 'POST'))) {
                  toast(tToast('boardAdded'));
                }
              }}
            >
              {t('add')}
            </Button>
          ) : null}
        </div>
      </div>
      <p className="text-sm text-ink/70 dark:text-paper/70 print:hidden">{t('intro')}</p>
      <ErrorText>{error}</ErrorText>
      <ul className="grid gap-3 sm:grid-cols-2 print:grid-cols-2">
        {view.boards.map((b) => (
          <BoardCard
            key={b.id}
            board={b}
            tournamentId={view.id}
            name={view.name}
            qr={qrs[b.id] ?? ''}
            url={`${baseUrl}/join/${b.code}`}
          />
        ))}
      </ul>
    </Panel>
  );
}

function BoardCard({
  board,
  tournamentId,
  name,
  qr,
  url,
}: {
  board: BoardView;
  tournamentId: number;
  name: string;
  qr: string;
  url: string;
}) {
  const t = useT('boards');
  const tToast = useT('toasts');
  const { toast, confirm } = useFeedback();
  const { busy, error, act } = useAction();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(board.name);
  const save = (e: FormEvent) => {
    e.preventDefault();
    void act(async () => {
      await callApi(`/tournaments/${tournamentId}/boards/${board.id}`, 'PATCH', { name: value });
      setEditing(false);
      toast(tToast('boardRenamed'));
    });
  };
  return (
    <li className="flex gap-3 rounded-xl border border-ink/10 p-3 break-inside-avoid dark:border-paper/10">
      <div
        className="size-28 shrink-0 overflow-hidden rounded-lg bg-white p-1 [&>svg]:size-full"
        role="img"
        aria-label={t('qr', { board: board.name })}
        dangerouslySetInnerHTML={{ __html: qr }}
      />
      <div className="min-w-0 flex-1 space-y-1">
        <p className="hidden text-xs print:block">{name}</p>
        {editing ? (
          <form onSubmit={save} className="flex gap-1 print:hidden">
            <Input
              value={value}
              maxLength={40}
              onChange={(e) => setValue(e.target.value)}
              aria-label={t('name')}
            />
            <Button type="submit" disabled={busy}>
              {t('save')}
            </Button>
          </form>
        ) : (
          <p className="font-display text-xl font-bold">{t('board', { board: board.name })}</p>
        )}
        <p className="font-mono text-lg tracking-widest">{board.code}</p>
        <p className="text-xs text-ink/60 dark:text-paper/60 print:hidden">
          {t('players', { count: board.players })}
          {board.gameId ? ` · ${t('busy')}` : ''}
        </p>
        <div className="flex flex-wrap gap-1 print:hidden">
          <CopyButton text={url} />
          <Button type="button" variant="ghost" onClick={() => setEditing(!editing)}>
            {t('rename')}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="text-red-700 dark:text-red-400"
            disabled={busy || board.gameId !== null}
            onClick={async () => {
              const ok = await confirm({
                title: t('removeConfirm', { board: board.name }),
                body: t('removeBody'),
                confirmLabel: t('remove'),
                danger: true,
              });
              if (!ok) return;
              const done = await act(() =>
                callApi(`/tournaments/${tournamentId}/boards/${board.id}`, 'DELETE'),
              );
              if (done) toast(tToast('boardRemoved'));
            }}
          >
            {t('remove')}
          </Button>
        </div>
        <ErrorText>{error}</ErrorText>
      </div>
    </li>
  );
}

/** Players: board, entry fee paid, remove (before the first round). */
export function PlayersPanel({ view }: { view: TournamentView }) {
  const t = useT('players');
  const tToast = useT('toasts');
  const { toast, confirm } = useFeedback();
  const { busy, error, act, router } = useAction();
  const registration = view.status === 'registration';
  const patch = async (p: TournamentPlayerView, body: object) => {
    if (await act(() => callApi(`/tournaments/${view.id}/players/${p.id}`, 'PATCH', body))) {
      toast(tToast('playerSaved', { name: p.name || t('formerPlayer') }));
    }
  };
  return (
    <Panel>
      <h2 className="font-display text-lg font-bold">
        {t('title', { count: view.players.length })}
      </h2>
      {view.players.length === 0 ? (
        <p className="mt-2 text-sm text-ink/60 dark:text-paper/60">{t('none')}</p>
      ) : (
        <ul className="mt-3 divide-y divide-ink/10 dark:divide-paper/10">
          {view.players.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-2">
              <span className={cn('min-w-0 flex-1', p.eliminatedRound !== null && 'opacity-50')}>
                <span className="font-medium">{p.name || t('formerPlayer')}</span>
                {p.isMe ? (
                  <span className="text-ink/50 dark:text-paper/50"> · {t('you')}</span>
                ) : null}
                <span className="block text-xs text-ink/60 dark:text-paper/60">
                  {t('rating', { value: p.rating.toFixed(1) })}
                  {p.eliminatedRound !== null ? ` · ${t('out', { round: p.eliminatedRound })}` : ''}
                  {view.championId === p.id ? ` · ${t('champion')}` : ''}
                </span>
              </span>
              {view.isOrganizer ? (
                <>
                  <Select
                    aria-label={t('board')}
                    className="w-28"
                    value={p.boardId ?? ''}
                    disabled={busy}
                    onChange={(e) => patch(p, { boardId: Number(e.target.value) })}
                  >
                    {p.boardId === null ? <option value="">–</option> : null}
                    {view.boards.map((b) => (
                      <option key={b.id} value={b.id}>
                        {t('boardName', { board: b.name })}
                      </option>
                    ))}
                  </Select>
                  {view.feeCents > 0 ? (
                    <label className="flex items-center gap-1 text-sm">
                      <input
                        type="checkbox"
                        checked={p.paid}
                        disabled={busy}
                        onChange={(e) => patch(p, { paid: e.target.checked })}
                      />
                      {t('paid')}
                    </label>
                  ) : null}
                </>
              ) : null}
              {registration && (view.isOrganizer || p.isMe) ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-red-700 dark:text-red-400"
                  disabled={busy}
                  onClick={async () => {
                    const leaving = p.isMe && !view.isOrganizer;
                    const name = p.name || t('formerPlayer');
                    const ok = await confirm({
                      title: leaving ? t('leaveConfirm') : t('removeConfirm', { name }),
                      body: leaving ? t('leaveBody') : t('removeBody'),
                      confirmLabel: leaving ? t('leave') : t('remove'),
                      danger: true,
                    });
                    if (!ok) return;
                    const done = await act(
                      () => callApi(`/tournaments/${view.id}/players/${p.id}`, 'DELETE'),
                      leaving ? () => router.push('/tournaments') : undefined,
                    );
                    if (done) {
                      toast(leaving ? tToast('leftTournament') : tToast('playerRemoved', { name }));
                    }
                  }}
                >
                  {p.isMe && !view.isOrganizer ? t('leave') : t('remove')}
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      <ErrorText>{error}</ErrorText>
    </Panel>
  );
}

/** The organiser's settings: name, fee and share (before the first round), delete. */
export function TournamentSettings({ view, joinUrl }: { view: TournamentView; joinUrl: string }) {
  const t = useT('newTournament');
  const tS = useT('tournament');
  const tToast = useT('toasts');
  const { toast, confirm } = useFeedback();
  const { busy, error, act, router } = useAction();
  const locked = view.status !== 'registration';
  const [name, setName] = useState(view.name);
  const [fee, setFee] = useState(String(view.feeCents / 100));
  const [currency, setCurrency] = useState(view.currency);
  const [pct, setPct] = useState(String(view.organizerPct));
  const save = (e: FormEvent) => {
    e.preventDefault();
    void act(async () => {
      await callApi(`/tournaments/${view.id}`, 'PATCH', {
        name,
        fee,
        currency,
        organizerPct: Number(pct),
      });
      toast(tToast('settingsSaved'));
    });
  };
  return (
    <Panel className="space-y-4 print:hidden">
      <h2 className="font-display text-lg font-bold">{tS('settings')}</h2>
      <div className="space-y-1">
        <p className="text-sm font-medium">{tS('joinCode')}</p>
        <p className="font-mono text-2xl tracking-widest">{view.joinCode}</p>
        <p className="break-all text-xs text-ink/60 dark:text-paper/60">{joinUrl}</p>
        <CopyButton text={joinUrl} />
      </div>
      <form onSubmit={save} className="space-y-3">
        <Field label={t('name')}>
          <Input required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label={t('fee')}>
            <Input
              inputMode="decimal"
              disabled={locked}
              value={fee}
              onChange={(e) => setFee(e.target.value)}
            />
          </Field>
          <Field label={t('currency')}>
            <Select
              disabled={locked}
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              {CURRENCIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </Field>
          <Field label={t('organizerPct')}>
            <Input
              type="number"
              min={0}
              max={100}
              disabled={locked}
              value={pct}
              onChange={(e) => setPct(e.target.value)}
            />
          </Field>
        </div>
        {locked ? (
          <p className="text-xs text-ink/60 dark:text-paper/60">{tS('feeLocked')}</p>
        ) : null}
        <ErrorText>{error}</ErrorText>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={busy}>
            {tS('save')}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="ml-auto text-red-700 dark:text-red-400"
            disabled={busy}
            onClick={async () => {
              const ok = await confirm({
                title: tS('deleteConfirm', { name: view.name }),
                body: tS('deleteBody'),
                confirmLabel: tS('delete'),
                danger: true,
              });
              if (!ok) return;
              const done = await act(
                () => callApi(`/tournaments/${view.id}`, 'DELETE'),
                () => router.push('/tournaments'),
              );
              if (done) toast(tToast('tournamentDeleted'));
            }}
          >
            {tS('delete')}
          </Button>
        </div>
      </form>
    </Panel>
  );
}
