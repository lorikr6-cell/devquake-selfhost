'use client';

import { localizePath, useLocale, useT } from '@devquake/ui';
import { playersPerRound, roundName } from '../lib/tournament';
import type { MatchView, TournamentView } from '../lib/views';

/**
 * The knock-out as SVG: one column per round, a box per match (both players, their score, the
 * winner in bold), players with a bye, and empty boxes for rounds not drawn yet. Pairs are drawn
 * round by round, so a line joins each winner to the match they play next. Tapping a match opens
 * it (to play when it is yours, otherwise to watch).
 */

const COL = 210;
const GAP_X = 36;
const BOX_H = 58;
const ROW_H = BOX_H / 2;
const GAP_Y = 18;
const PAD = 12;

interface Box {
  key: string;
  round: number;
  y: number;
  kind: 'match' | 'bye' | 'future';
  match?: MatchView;
  byeName?: string;
  byePlayer?: number;
}

export function Bracket({ view }: { view: TournamentView }) {
  const t = useT('bracket');
  const locale = useLocale();
  const plan = playersPerRound(view.players.length);
  const rounds = Math.max(plan.length, view.round);
  if (rounds === 0) return <p className="text-sm text-ink/60 dark:text-paper/60">{t('empty')}</p>;

  const former = t('formerPlayer');
  const columns: Box[][] = [];
  for (let r = 1; r <= rounds; r++) {
    const col: Box[] = [];
    const matches = view.matches.filter((m) => m.round === r);
    for (const m of matches)
      col.push({ key: `m${m.gameId}`, round: r, y: 0, kind: 'match', match: m });
    for (const p of view.players.filter((x) => x.byeRound === r)) {
      col.push({
        key: `b${p.id}`,
        round: r,
        y: 0,
        kind: 'bye',
        byeName: p.name || former,
        byePlayer: p.id,
      });
    }
    if (r > view.round) {
      const expected = Math.floor((plan[r - 1] ?? 2) / 2);
      for (let i = 0; i < expected; i++)
        col.push({ key: `f${r}-${i}`, round: r, y: 0, kind: 'future' });
    }
    columns.push(col);
  }
  const tallest = Math.max(1, ...columns.map((c) => c.length));
  const height = tallest * (BOX_H + GAP_Y) + PAD * 2;
  for (const col of columns) {
    col.forEach((b, i) => {
      b.y = PAD + ((i + 0.5) * (height - PAD * 2)) / col.length - BOX_H / 2;
    });
  }
  const width = rounds * COL + (rounds - 1) * GAP_X + PAD * 2;
  const x = (r: number) => PAD + (r - 1) * (COL + GAP_X);

  // Where each player plays next: a line from the box they won (or their bye) to it.
  const next = (player: number, round: number) =>
    columns[round]?.find(
      (b) => b.match?.sides.includes(player) || (b.kind === 'bye' && b.byePlayer === player),
    );
  const links: { from: Box; to: Box }[] = [];
  columns.forEach((col, i) => {
    for (const b of col) {
      const advancing = b.kind === 'bye' ? b.byePlayer : b.match?.winner;
      if (!advancing) continue;
      const to = next(advancing, i + 1);
      if (to) links.push({ from: b, to });
    }
  });

  const title = (r: number) => {
    const name = roundName(plan[r - 1] ?? 2);
    return name === 'round' ? t('round', { round: r }) : t(name);
  };

  const href = (m: MatchView) =>
    localizePath(
      m.mine && m.status !== 'finished' ? `/games/${m.gameId}` : `/watch/${m.watchCode}`,
      locale,
    );

  return (
    <div className="overflow-x-auto rounded-xl border border-ink/10 bg-white/70 dark:border-paper/10 dark:bg-paper/5">
      <svg
        viewBox={`0 0 ${width} ${height + 28}`}
        width={width}
        height={height + 28}
        role="img"
        aria-label={t('label', { name: view.name })}
        className="block max-w-none text-ink dark:text-paper"
      >
        {columns.map((_, i) => (
          <text
            key={i}
            x={x(i + 1) + COL / 2}
            y={18}
            textAnchor="middle"
            fontSize="12"
            fontWeight="700"
            fill="currentColor"
            opacity=".7"
          >
            {title(i + 1)}
          </text>
        ))}
        <g transform="translate(0 28)">
          {links.map(({ from, to }, i) => {
            const x1 = x(from.round) + COL;
            const y1 = from.y + BOX_H / 2;
            const x2 = x(to.round);
            const y2 = to.y + BOX_H / 2;
            const mid = x1 + GAP_X / 2;
            return (
              <path
                key={i}
                d={`M${x1} ${y1}H${mid}V${y2}H${x2}`}
                fill="none"
                stroke="#f97316"
                strokeWidth="2"
                opacity=".7"
              />
            );
          })}
          {columns.flat().map((b) => (
            <BoxView
              key={b.key}
              box={b}
              x={x(b.round)}
              href={b.match ? href(b.match) : null}
              former={former}
              t={t}
              champion={view.championId}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}

function BoxView({
  box,
  x,
  href,
  former,
  t,
  champion,
}: {
  box: Box;
  x: number;
  href: string | null;
  former: string;
  t: (key: string, params?: Record<string, string | number>) => string;
  champion: number | null;
}) {
  const frame = {
    x,
    y: box.y,
    width: COL,
    height: box.kind === 'bye' ? ROW_H : BOX_H,
    rx: 8,
  };
  if (box.kind === 'future') {
    return <rect {...frame} fill="none" stroke="currentColor" strokeDasharray="5 4" opacity=".3" />;
  }
  if (box.kind === 'bye') {
    return (
      <g>
        <rect
          {...frame}
          fill="currentColor"
          fillOpacity=".05"
          stroke="currentColor"
          strokeOpacity=".25"
        />
        <text
          x={x + 10}
          y={box.y + ROW_H / 2}
          dominantBaseline="central"
          fontSize="13"
          fill="currentColor"
        >
          {truncate(box.byeName!, 20)} · {t('bye')}
        </text>
      </g>
    );
  }
  const m = box.match!;
  const live = m.status === 'playing';
  const row = (i: 0 | 1) => {
    const won = m.winner !== null && m.winner === m.sides[i];
    const lost = m.winner !== null && !won;
    const y = box.y + i * ROW_H + ROW_H / 2;
    return (
      <g key={i} opacity={lost ? 0.5 : 1}>
        <text
          x={x + 10}
          y={y}
          dominantBaseline="central"
          fontSize="13"
          fontWeight={won ? 800 : 500}
          fill="currentColor"
        >
          {won && champion === m.sides[i] ? '🏆 ' : ''}
          {truncate(m.names[i] || former, 18)}
        </text>
        <text
          x={x + COL - 10}
          y={y}
          dominantBaseline="central"
          textAnchor="end"
          fontSize="13"
          fontWeight="700"
          fill={won ? '#f97316' : 'currentColor'}
        >
          {m.score[i]}
        </text>
      </g>
    );
  };
  const body = (
    <g>
      <title>
        {m.names.map((n) => n || former).join(' – ')}
        {m.board ? ` · ${t('board', { board: m.board })}` : ''}
      </title>
      <rect
        {...frame}
        fill={m.mine ? '#f97316' : 'currentColor'}
        fillOpacity={m.mine ? 0.12 : 0.05}
        stroke={live ? '#f97316' : 'currentColor'}
        strokeOpacity={live ? 1 : 0.25}
        strokeWidth={live ? 2 : 1}
      />
      <line
        x1={x}
        x2={x + COL}
        y1={box.y + ROW_H}
        y2={box.y + ROW_H}
        stroke="currentColor"
        strokeOpacity=".15"
      />
      {row(0)}
      {row(1)}
      {live ? (
        <g>
          <circle cx={x + COL - 6} cy={box.y - 1} r="5" fill="#dc2626">
            <animate attributeName="opacity" values="1;.3;1" dur="1.6s" repeatCount="indefinite" />
          </circle>
          {m.board ? (
            <text
              x={x + COL - 16}
              y={box.y - 1}
              textAnchor="end"
              dominantBaseline="central"
              fontSize="10"
              fill="currentColor"
              opacity=".7"
            >
              {t('board', { board: m.board })}
            </text>
          ) : (
            <text
              x={x + COL - 16}
              y={box.y - 1}
              textAnchor="end"
              dominantBaseline="central"
              fontSize="10"
              fill="currentColor"
              opacity=".7"
            >
              {t('waiting')}
            </text>
          )}
        </g>
      ) : null}
    </g>
  );
  return href ? (
    <a
      href={href}
      aria-label={m.names.map((n) => n || former).join(' – ')}
      className="cursor-pointer hover:opacity-80"
    >
      {body}
    </a>
  ) : (
    body
  );
}

const truncate = (s: string, max: number) => (s.length > max ? `${s.slice(0, max - 1)}…` : s);
