'use client';

import { useId, useMemo, useState, type PointerEvent } from 'react';
import { cn, useT } from '@devquake/ui';
import {
  matchesName,
  playerSummary,
  type ProgressMatch,
  type ProgressPlayer,
} from '../lib/progress';

/**
 * How matches went, visit by visit: a line chart of every player's score after each visit and
 * the visits in order, with a search by player name. For one game (its screen) or all matches
 * of a tournament. Searching shows the matches of the players found, only their visits, and a
 * summary: how they scored and whom they played.
 */

// Categorical colours (validated for colour blindness in both themes; one per seat, never
// by rank). Lines also carry their player's name, and the table has every value.
const VIZ_CSS = `
.dq-viz { --s1:#2a78d6; --s2:#eb6834; --s3:#1baf7a; --s4:#eda100; --s5:#e87ba4; --s6:#008300; --s7:#4a3aa7; --s8:#e34948; --viz-surface:#fcfcfb; }
@media (prefers-color-scheme: dark) {
  :root:where(:not([data-theme="light"])) .dq-viz { --s1:#3987e5; --s2:#d95926; --s3:#199e70; --s4:#c98500; --s5:#d55181; --s6:#008300; --s7:#9085e9; --s8:#e66767; --viz-surface:#1a1a19; }
}
:root[data-theme="dark"] .dq-viz { --s1:#3987e5; --s2:#d95926; --s3:#199e70; --s4:#c98500; --s5:#d55181; --s6:#008300; --s7:#9085e9; --s8:#e66767; --viz-surface:#1a1a19; }
`;
const seriesColor = (seat: number) => `var(--s${(seat % 8) + 1})`;

export function ScoreProgress({
  matches,
  tournament = false,
}: {
  matches: ProgressMatch[];
  /** Many matches: each in its own collapsible block with its round and board. */
  tournament?: boolean;
}) {
  const t = useT('progress');
  const [query, setQuery] = useState('');
  const searchId = useId();
  const names = useMemo(
    () => new Set(matches.flatMap((m) => m.players.map((p) => p.name)).filter(Boolean)),
    [matches],
  );
  const searchable = names.size > 1;
  const q = query.trim();
  const shown = q
    ? matches.filter((m) => m.players.some((p) => p.name && matchesName(p.name, q)))
    : matches;

  return (
    <section className="dq-viz space-y-4" aria-labelledby={`${searchId}-title`}>
      <style>{VIZ_CSS}</style>
      <h2 id={`${searchId}-title`} className="font-display text-xl font-bold">
        {t('title')}
      </h2>

      {searchable ? (
        <div className="space-y-1">
          <label htmlFor={searchId} className="block text-sm font-medium">
            {t('searchLabel')}
          </label>
          <div className="relative max-w-md">
            <svg
              viewBox="0 0 24 24"
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink/50 dark:text-paper/50"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-4-4" />
            </svg>
            <input
              id={searchId}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              autoComplete="off"
              className="w-full rounded-md border border-ink/15 bg-white py-2 pr-3 pl-9 text-sm focus:border-quake focus:ring-2 focus:ring-quake/30 focus:outline-none dark:border-paper/15 dark:bg-ink"
            />
          </div>
          {/* Reserved line: the results below do not jump when it appears. */}
          <p aria-live="polite" className="min-h-5 text-xs text-ink/60 dark:text-paper/60">
            {q
              ? shown.length
                ? t('results', { count: shown.length, query: q })
                : t('none', { query: q })
              : ''}
          </p>
        </div>
      ) : null}

      {shown.map((m) =>
        tournament ? (
          <details
            key={m.key}
            open={Boolean(q) || matches.length === 1}
            className="rounded-xl border border-ink/10 bg-white/70 p-4 dark:border-paper/10 dark:bg-paper/5"
          >
            <summary className="cursor-pointer">
              <MatchTitle match={m} />
            </summary>
            <div className="mt-3">
              <MatchProgress match={m} query={q} />
            </div>
          </details>
        ) : (
          <div
            key={m.key}
            className="rounded-xl border border-ink/10 bg-white/70 p-4 dark:border-paper/10 dark:bg-paper/5"
          >
            <MatchProgress match={m} query={q} />
          </div>
        ),
      )}
    </section>
  );
}

const nameOf = (p: ProgressPlayer | undefined, former: string) => (p?.name ? p.name : former);

function MatchTitle({ match }: { match: ProgressMatch }) {
  const t = useT('progress');
  const former = t('formerPlayer');
  const winner = match.players.find((p) => p.id === match.winnerId);
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-2">
      <span className="font-semibold">
        {match.players.map((p) => nameOf(p, former)).join(' – ')}
      </span>
      <span className="text-xs text-ink/60 dark:text-paper/60">
        {match.round ? t('round', { round: match.round }) : ''}
        {match.board ? ` · ${t('board', { board: match.board })}` : ''}
        {winner ? ` · ${t('winner', { name: nameOf(winner, former) })}` : ''}
        {!winner && match.visits.length === 0 ? ` · ${t('notStarted')}` : ''}
      </span>
    </span>
  );
}

function MatchProgress({ match, query }: { match: ProgressMatch; query: string }) {
  const t = useT('progress');
  const tEv = useT('events');
  const former = t('formerPlayer');
  const found = query ? match.players.filter((p) => p.name && matchesName(p.name, query)) : [];
  const focus = new Set(found.map((p) => p.id));
  const rows = query ? match.visits.filter((v) => focus.has(v.playerId)) : match.visits;
  const seat = (id: number) => match.players.findIndex((p) => p.id === id);

  return (
    <div className="space-y-4">
      {found.map((p) => (
        <PlayerSummaryLine key={p.id} match={match} player={p} />
      ))}

      {match.visits.length ? (
        <ProgressChart match={match} focus={focus} />
      ) : (
        <p className="text-sm text-ink/60 dark:text-paper/60">{t('empty')}</p>
      )}

      {rows.length ? (
        <div className="max-h-96 overflow-auto rounded-lg border border-ink/10 dark:border-paper/10">
          <table className="w-full text-sm">
            <caption className="sr-only">{t('tableCaption')}</caption>
            <thead className="sticky top-0 bg-paper text-left text-xs text-ink/60 dark:bg-ink dark:text-paper/60">
              <tr>
                <th scope="col" className="px-2 py-1.5 font-medium">
                  #
                </th>
                <th scope="col" className="px-2 py-1.5 font-medium">
                  {t('player')}
                </th>
                <th scope="col" className="px-2 py-1.5 font-medium">
                  {t('darts')}
                </th>
                <th scope="col" className="px-2 py-1.5 text-right font-medium">
                  {t('total')}
                </th>
                <th scope="col" className="px-2 py-1.5 text-right font-medium">
                  {t(`after.${match.type}`)}
                </th>
                <th scope="col" className="px-2 py-1.5 font-medium">
                  <span className="sr-only">{t('events')}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((v, i) => {
                const newLeg = i > 0 && rows[i - 1]!.leg !== v.leg;
                const p = match.players[seat(v.playerId)];
                return (
                  <tr
                    key={v.n}
                    className={cn(
                      'border-t border-ink/10 dark:border-paper/10',
                      newLeg && 'border-t-2 border-t-quake/60',
                    )}
                  >
                    <td className="px-2 py-1.5 text-xs text-ink/50 tabular-nums dark:text-paper/50">
                      {v.n}
                    </td>
                    <td className="max-w-32 truncate px-2 py-1.5">
                      <span
                        aria-hidden
                        className="mr-1.5 inline-block size-2.5 rounded-full align-middle"
                        style={{ background: seriesColor(seat(v.playerId)) }}
                      />
                      {nameOf(p, former)}
                    </td>
                    <td className="px-2 py-1.5 font-mono whitespace-nowrap">{v.darts}</td>
                    <td className="px-2 py-1.5 text-right font-bold tabular-nums">{v.total}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{v.after}</td>
                    <td className="px-2 py-1.5 text-xs whitespace-nowrap">
                      {v.events.map((e) => tEv(e)).join(' ')}
                      {newLeg || (i === 0 && v.leg > 1) ? (
                        <span className="ml-1 text-ink/50 dark:text-paper/50">
                          {t('leg', { leg: v.leg })}
                        </span>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

/** One player's match in numbers, and whom they played. */
function PlayerSummaryLine({ match, player }: { match: ProgressMatch; player: ProgressPlayer }) {
  const t = useT('progress');
  const former = t('formerPlayer');
  const s = playerSummary(match, player.id);
  const others = match.players.filter((p) => p.id !== player.id).map((p) => nameOf(p, former));
  const result =
    match.players.length === 1
      ? null
      : match.winnerId === null
        ? t(match.visits.length ? 'playing' : 'notStarted')
        : match.winnerId === player.id
          ? t('won')
          : t('lost');
  const chips = [
    t('visits', { count: s.visits }),
    t('dartsCount', { count: s.darts }),
    s.average !== null ? t('average', { value: s.average.toFixed(1) }) : null,
    t('best', { value: s.best }),
    s.bestFinish !== null ? t('bestFinish', { value: s.bestFinish }) : null,
    s.busts ? t('busts', { count: s.busts }) : null,
  ].filter(Boolean);
  return (
    <div className="rounded-lg bg-quake/10 p-3">
      <p className="font-semibold">
        {player.name}
        {others.length ? (
          <span className="font-normal text-ink/70 dark:text-paper/70">
            {' '}
            · {t('against', { names: others.join(', ') })}
          </span>
        ) : null}
        {result ? <span className="ml-2 text-sm font-bold text-quake">{result}</span> : null}
      </p>
      <p className="mt-1 flex flex-wrap gap-1.5">
        {chips.map((c) => (
          <span
            key={c}
            className="rounded-md bg-white px-2 py-0.5 text-xs tabular-nums dark:bg-ink"
          >
            {c}
          </span>
        ))}
      </p>
    </div>
  );
}

const W = 640;
const H = 220;
const PAD = { l: 40, r: 92, t: 14, b: 26 };

/**
 * Every player's score after each visit (x: the visit's order in the match). Thin lines,
 * 8 px markers with a ring, each line labelled with its player at its end, a legend for two or
 * more players, leg changes marked, and a crosshair with the visit's details on hover or tap.
 */
function ProgressChart({ match, focus }: { match: ProgressMatch; focus: Set<number> }) {
  const t = useT('progress');
  const former = t('formerPlayer');
  const [hover, setHover] = useState<number | null>(null);
  const n = match.visits.length;
  const maxY = Math.max(
    1,
    ...match.players.map((p) => p.start),
    ...match.visits.map((v) => v.after),
  );
  const x = (i: number) => PAD.l + (i / Math.max(1, n)) * (W - PAD.l - PAD.r);
  const y = (value: number) => PAD.t + (1 - value / maxY) * (H - PAD.t - PAD.b);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(maxY * f));
  const legStarts = match.visits.filter((v, i) => i > 0 && match.visits[i - 1]!.leg !== v.leg);

  const series = match.players.map((p, seat) => {
    const points = [{ i: 0, value: p.start, visit: null as (typeof match.visits)[number] | null }];
    for (const v of match.visits)
      if (v.playerId === p.id) points.push({ i: v.n, value: v.after, visit: v });
    return { p, seat, points };
  });
  const dim = (id: number) => focus.size > 0 && !focus.has(id);

  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const i = Math.round(((px - PAD.l) / (W - PAD.l - PAD.r)) * n);
    setHover(i >= 1 && i <= n ? i : null);
  };
  const hovered = hover ? match.visits[hover - 1] : null;
  const hoveredSeat = hovered ? match.players.findIndex((p) => p.id === hovered.playerId) : -1;

  // Direct labels at the end of each line, nudged apart so they never overlap.
  const labels = series
    .map((s) => ({ s, y: y(s.points[s.points.length - 1]!.value) }))
    .sort((a, b) => a.y - b.y);
  for (let i = 1; i < labels.length; i++)
    labels[i]!.y = Math.max(labels[i]!.y, labels[i - 1]!.y + 14);

  return (
    <div className="relative">
      {match.players.length > 1 ? (
        <ul className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs" aria-label={t('legend')}>
          {series.map((s) => (
            <li
              key={s.p.id}
              className={cn('flex items-center gap-1.5', dim(s.p.id) && 'opacity-40')}
            >
              <span
                aria-hidden
                className="inline-block h-0.5 w-4 rounded"
                style={{ background: seriesColor(s.seat) }}
              />
              {nameOf(s.p, former)}
            </li>
          ))}
        </ul>
      ) : null}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full touch-pan-y text-ink dark:text-paper"
        role="img"
        aria-label={t('chartLabel', {
          names: match.players.map((p) => nameOf(p, former)).join(', '),
        })}
        onPointerMove={onMove}
        onPointerDown={onMove}
        onPointerLeave={() => setHover(null)}
      >
        {/* Recessive grid and axis. */}
        {ticks.map((v) => (
          <g key={v}>
            <line
              x1={PAD.l}
              x2={W - PAD.r}
              y1={y(v)}
              y2={y(v)}
              stroke="currentColor"
              strokeOpacity=".08"
            />
            <text
              x={PAD.l - 6}
              y={y(v)}
              textAnchor="end"
              dominantBaseline="central"
              fontSize="10"
              fill="currentColor"
              opacity=".55"
            >
              {v}
            </text>
          </g>
        ))}
        <text x={PAD.l} y={H - 6} fontSize="10" fill="currentColor" opacity=".55">
          {t('start')}
        </text>
        <text
          x={W - PAD.r}
          y={H - 6}
          textAnchor="end"
          fontSize="10"
          fill="currentColor"
          opacity=".55"
        >
          {t('visitAxis', { count: n })}
        </text>
        {legStarts.map((v) => (
          <g key={`leg${v.n}`}>
            <line
              x1={x(v.n - 0.5)}
              x2={x(v.n - 0.5)}
              y1={PAD.t}
              y2={H - PAD.b}
              stroke="currentColor"
              strokeOpacity=".3"
              strokeDasharray="3 3"
            />
            <text x={x(v.n - 0.5) + 3} y={PAD.t + 8} fontSize="10" fill="currentColor" opacity=".6">
              {t('leg', { leg: v.leg })}
            </text>
          </g>
        ))}
        {hover ? (
          <line
            x1={x(hover)}
            x2={x(hover)}
            y1={PAD.t}
            y2={H - PAD.b}
            stroke="currentColor"
            strokeOpacity=".35"
          />
        ) : null}
        {series.map((s) => (
          <g key={s.p.id} opacity={dim(s.p.id) ? 0.25 : 1}>
            <polyline
              points={s.points.map((pt) => `${x(pt.i)},${y(pt.value)}`).join(' ')}
              fill="none"
              stroke={seriesColor(s.seat)}
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {s.points.slice(1).map((pt) => (
              <circle
                key={pt.i}
                cx={x(pt.i)}
                cy={y(pt.value)}
                r={hover === pt.i ? 5.5 : 4}
                fill={seriesColor(s.seat)}
                stroke="var(--viz-surface)"
                strokeWidth="2"
              />
            ))}
          </g>
        ))}
        {labels.map(({ s, y: ly }) => (
          <text
            key={s.p.id}
            x={W - PAD.r + 6}
            y={ly}
            dominantBaseline="central"
            fontSize="11"
            fontWeight="600"
            fill="currentColor"
            opacity={dim(s.p.id) ? 0.35 : 0.9}
          >
            {truncate(nameOf(s.p, former), 13)}
          </text>
        ))}
      </svg>
      {/* Tooltip: the visit under the crosshair. */}
      {hovered ? (
        <div
          role="status"
          className="pointer-events-none absolute top-8 z-10 max-w-60 rounded-lg border border-ink/10 bg-paper px-3 py-2 text-xs shadow-lg dark:border-paper/15 dark:bg-ink"
          style={
            hover && hover > n / 2
              ? { right: `${((W - x(hover)) / W) * 100 + 2}%` }
              : { left: `${(x(hover ?? 0) / W) * 100 + 2}%` }
          }
        >
          <p className="flex items-center gap-1.5 font-semibold">
            <span
              aria-hidden
              className="inline-block size-2.5 rounded-full"
              style={{ background: seriesColor(hoveredSeat) }}
            />
            {nameOf(match.players[hoveredSeat], former)} · {t('visitN', { n: hovered.n })}
          </p>
          <p className="mt-0.5 font-mono">
            {hovered.darts} = {hovered.total}
          </p>
          <p className="text-ink/70 dark:text-paper/70">
            {t(`after.${match.type}`)}: {hovered.after}
          </p>
        </div>
      ) : null}
    </div>
  );
}

const truncate = (s: string, max: number) => (s.length > max ? `${s.slice(0, max - 1)}…` : s);
