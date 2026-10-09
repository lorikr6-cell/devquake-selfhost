'use client';

import { useId } from 'react';
import { cn, useT } from '@devquake/ui';
import {
  BOARD_ORDER,
  BULL,
  sameDart,
  segmentKey,
  type Dart,
  type Multiplier,
} from '../lib/engine/darts';

/**
 * The dartboard as SVG: tap a segment to enter a dart, see where the suggested darts go and
 * where the darts of this visit landed, or (on the statistics page) where a player's darts land
 * most. The rings are wider than on a real board so doubles and trebles are easy to tap.
 */

// Radii in board units (the view box is 440 wide).
const R = {
  inner: 12,
  outer: 28,
  trebleIn: 96,
  trebleOut: 122,
  doubleIn: 152,
  doubleOut: 178,
  numbers: 205,
};

const COLORS = {
  dark: '#1f1d1b',
  light: '#efe3c8',
  red: '#c4262e',
  green: '#1f7a45',
  wire: '#9a9a9a',
  bullGreen: '#1f7a45',
  bullRed: '#c4262e',
};

const rad = (deg: number) => (deg * Math.PI) / 180;
const point = (r: number, deg: number) =>
  [r * Math.sin(rad(deg)), -r * Math.cos(rad(deg))] as const;

/** An annular sector from angle a0 to a1 (degrees, clockwise from the top). */
function sector(r0: number, r1: number, a0: number, a1: number): string {
  const [x0, y0] = point(r1, a0);
  const [x1, y1] = point(r1, a1);
  const [x2, y2] = point(r0, a1);
  const [x3, y3] = point(r0, a0);
  return `M${x0} ${y0}A${r1} ${r1} 0 0 1 ${x1} ${y1}L${x2} ${y2}A${r0} ${r0} 0 0 0 ${x3} ${y3}Z`;
}

interface Segment {
  dart: Dart;
  d: string;
  fill: string;
}

function buildSegments(): Segment[] {
  const out: Segment[] = [];
  BOARD_ORDER.forEach((n, i) => {
    const a0 = i * 18 - 9;
    const a1 = i * 18 + 9;
    const even = i % 2 === 0;
    const single = even ? COLORS.dark : COLORS.light;
    const ring = even ? COLORS.red : COLORS.green;
    const rings: [Multiplier, number, number, string][] = [
      [1, R.outer, R.trebleIn, single],
      [3, R.trebleIn, R.trebleOut, ring],
      [1, R.trebleOut, R.doubleIn, single],
      [2, R.doubleIn, R.doubleOut, ring],
    ];
    // Two single areas per number (inner and outer); both enter the same dart.
    for (const [m, r0, r1, fill] of rings) {
      out.push({ dart: { n, m }, d: sector(r0, r1, a0, a1), fill });
    }
  });
  return out;
}

const SEGMENTS = buildSegments();

function markerPoint(d: Dart): readonly [number, number] {
  if (d.n === BULL) return d.m === 2 ? [0, 0] : [0, -(R.inner + R.outer) / 2];
  if (d.n === 0) return [R.numbers - 12, R.numbers - 12];
  const i = BOARD_ORDER.indexOf(d.n as (typeof BOARD_ORDER)[number]);
  const r =
    d.m === 3
      ? (R.trebleIn + R.trebleOut) / 2
      : d.m === 2
        ? (R.doubleIn + R.doubleOut) / 2
        : (R.outer + R.trebleIn) / 2 + 8;
  return point(r, i * 18);
}

export function Dartboard({
  onHit,
  highlight = [],
  marks = [],
  heat,
  disabled = false,
  className,
  label,
}: {
  /** Makes the board tappable. */
  onHit?: (dart: Dart) => void;
  /** Segments to point out (the next suggested dart first). */
  highlight?: Dart[];
  /** Darts already thrown in this visit (numbered markers). */
  marks?: Dart[];
  /** Darts per segment key ("T20", "5", "BULL"...): a heat map. */
  heat?: Record<string, number>;
  disabled?: boolean;
  className?: string;
  label: string;
}) {
  const t = useT('board');
  const glowId = useId();
  const interactive = Boolean(onHit) && !disabled;
  const maxHeat = heat ? Math.max(1, ...Object.values(heat)) : 1;
  const heatOf = (d: Dart) => (heat ? (heat[segmentKey(d)] ?? 0) / maxHeat : 0);
  const name = (d: Dart) =>
    d.n === 0
      ? t('miss')
      : d.n === BULL
        ? d.m === 2
          ? t('bull')
          : t('outerBull')
        : t(d.m === 3 ? 'treble' : d.m === 2 ? 'double' : 'single', { n: d.n });
  const hit = (d: Dart) => (interactive ? () => onHit!(d) : undefined);

  return (
    <svg
      viewBox="-220 -220 440 440"
      role="img"
      aria-label={label}
      className={cn('block w-full max-w-md select-none touch-manipulation', className)}
    >
      <defs>
        <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* The number ring: tapping it is a miss. */}
      <circle
        r={R.numbers + 12}
        fill={COLORS.dark}
        onClick={hit({ n: 0, m: 1 })}
        className={interactive ? 'cursor-pointer' : undefined}
      >
        {interactive ? <title>{t('miss')}</title> : null}
      </circle>
      {BOARD_ORDER.map((n, i) => {
        const [x, y] = point(R.numbers - 12, i * 18);
        return (
          <text
            key={n}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="20"
            fontWeight="700"
            fill="#f5f0e6"
            pointerEvents="none"
          >
            {n}
          </text>
        );
      })}
      {SEGMENTS.map((s, i) => {
        const h = heatOf(s.dart);
        return (
          <path
            key={i}
            d={s.d}
            fill={s.fill}
            stroke={COLORS.wire}
            strokeWidth="1"
            onClick={hit(s.dart)}
            className={cn(
              interactive && 'cursor-pointer hover:brightness-125 active:brightness-150',
            )}
            opacity={heat ? 0.35 + (1 - h) * 0.2 : 1}
          >
            <title>{name(s.dart)}</title>
          </path>
        );
      })}
      {/* Heat map: the more darts, the stronger the orange. */}
      {heat
        ? SEGMENTS.map((s, i) => {
            const h = heatOf(s.dart);
            return h > 0 ? (
              <path
                key={`h${i}`}
                d={s.d}
                fill="#f97316"
                opacity={0.15 + h * 0.8}
                pointerEvents="none"
              />
            ) : null;
          })
        : null}
      <circle
        r={R.outer}
        fill={COLORS.bullGreen}
        stroke={COLORS.wire}
        onClick={hit({ n: BULL, m: 1 })}
        className={cn(interactive && 'cursor-pointer hover:brightness-125')}
      >
        <title>{t('outerBull')}</title>
      </circle>
      <circle
        r={R.inner}
        fill={COLORS.bullRed}
        stroke={COLORS.wire}
        onClick={hit({ n: BULL, m: 2 })}
        className={cn(interactive && 'cursor-pointer hover:brightness-125')}
      >
        <title>{t('bull')}</title>
      </circle>
      {heat
        ? [
            { n: BULL, m: 1 as const, r: R.outer },
            { n: BULL, m: 2 as const, r: R.inner },
          ].map((b) => {
            const h = heatOf(b);
            return h > 0 ? (
              <circle
                key={b.m}
                r={b.r}
                fill="#f97316"
                opacity={0.15 + h * 0.8}
                pointerEvents="none"
              />
            ) : null;
          })
        : null}
      {/* Suggested segments: outlined, the next one glowing. */}
      {highlight.map((d, i) => {
        if (d.n === 0) return null;
        const style = {
          fill: 'none',
          stroke: '#f97316',
          strokeWidth: i === 0 ? 5 : 3,
          strokeDasharray: i === 0 ? undefined : '6 4',
          filter: i === 0 ? `url(#${glowId})` : undefined,
          pointerEvents: 'none' as const,
        };
        if (d.n === BULL) {
          return <circle key={`s${i}`} r={d.m === 2 ? R.inner : R.outer} {...style} />;
        }
        // Singles have two areas on the board: outline both.
        return SEGMENTS.filter((s) => sameDart(s.dart, d)).map((s, k) => (
          <path key={`s${i}-${k}`} d={s.d} {...style} />
        ));
      })}
      {/* Darts of this visit. */}
      {marks.map((d, i) => {
        const [x, y] = markerPoint(d);
        const offset = (i - 1) * 9;
        return (
          <g key={`m${i}`} transform={`translate(${x + offset} ${y})`} pointerEvents="none">
            <circle r="11" fill="#fff" stroke="#111" strokeWidth="2.5" />
            <text
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="13"
              fontWeight="700"
              fill="#111"
            >
              {i + 1}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
