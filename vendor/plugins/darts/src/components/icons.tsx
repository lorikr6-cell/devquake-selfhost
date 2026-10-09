import type { GameType, Mode } from '../lib/engine/games';

/**
 * Line pictograms for the modes and games, drawn for this app (48 × 48, currentColor with the
 * DevQuake orange as accent). Decorative: the text next to them names the game.
 */

const ACCENT = '#f97316';

function Frame({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      aria-hidden
      className={className ?? 'size-12'}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

function Dart({ x, y, angle = -45 }: { x: number; y: number; angle?: number }) {
  // A dart pointing at (x, y): tip, barrel and flight.
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle})`}>
      <path d="M0 0 L4 0" />
      <path d="M4 0 L14 0" strokeWidth="4" />
      <path d="M14 0 L20 0" />
      <path d="M20 0 L26 -5 M20 0 L26 5" stroke={ACCENT} />
    </g>
  );
}

const Target = ({ r = 18 }: { r?: number }) => (
  <>
    <circle cx="24" cy="24" r={r} />
    <circle cx="24" cy="24" r={r * 0.55} />
    <circle cx="24" cy="24" r="2.5" fill="currentColor" />
  </>
);

export function ModeIcon({ mode, className }: { mode: Mode; className?: string }) {
  if (mode === 'practice') {
    return (
      <Frame className={className}>
        <Target />
        <Dart x={25} y={23} />
      </Frame>
    );
  }
  if (mode === 'casual') {
    return (
      <Frame className={className}>
        <Target r={16} />
        <Dart x={22} y={22} angle={-40} />
        <Dart x={27} y={25} angle={-140} />
      </Frame>
    );
  }
  return (
    <Frame className={className}>
      <path d="M15 8h18v8a9 9 0 0 1-18 0z" />
      <path d="M15 11H9a5 5 0 0 0 6 7M33 11h6a5 5 0 0 1-6 7" />
      <path d="M24 25v8M17 40h14M19 40l1-7h8l1 7" />
      <path d="M21 13l2 2 4-4" stroke={ACCENT} />
    </Frame>
  );
}

export function GameIcon({ type, className }: { type: GameType; className?: string }) {
  switch (type) {
    case 'x01':
      return (
        <Frame className={className}>
          <rect x="6" y="10" width="36" height="28" rx="6" />
          <text
            x="24"
            y="29"
            textAnchor="middle"
            fontSize="14"
            fontWeight="800"
            fill="currentColor"
            stroke="none"
          >
            501
          </text>
          <path d="M36 16v6m-3-3 3 3 3-3" stroke={ACCENT} />
        </Frame>
      );
    case 'cricket':
      return (
        <Frame className={className}>
          <path d="M8 16h32M8 32h32M24 8v32" strokeWidth="1.5" opacity=".5" />
          <path d="M12 12l6-6" />
          <path d="M28 6l8 8M36 6l-8 8" />
          <path d="M12 26l6 6M18 26l-6 6" stroke={ACCENT} />
          <circle cx="32" cy="29" r="5" stroke={ACCENT} />
          <path d="M28 25l8 8M36 25l-8 8" />
        </Frame>
      );
    case 'shanghai':
      return (
        <Frame className={className}>
          {['S', 'D', 'T'].map((l, i) => (
            <g key={l}>
              <rect
                x={5 + i * 13}
                y="14"
                width="12"
                height="20"
                rx="3"
                stroke={i === 2 ? ACCENT : 'currentColor'}
              />
              <text
                x={11 + i * 13}
                y="28"
                textAnchor="middle"
                fontSize="11"
                fontWeight="800"
                fill="currentColor"
                stroke="none"
              >
                {l}
              </text>
            </g>
          ))}
        </Frame>
      );
    case 'atc':
      return (
        <Frame className={className}>
          <circle cx="24" cy="24" r="18" />
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i * Math.PI) / 6;
            return (
              <path
                key={i}
                d={`M${24 + 14 * Math.sin(a)} ${24 - 14 * Math.cos(a)} L${24 + 17 * Math.sin(a)} ${24 - 17 * Math.cos(a)}`}
                strokeWidth="1.5"
              />
            );
          })}
          <path d="M24 24V12M24 24l8 5" stroke={ACCENT} />
          <circle cx="24" cy="24" r="2" fill="currentColor" />
        </Frame>
      );
    case 'killer':
      return (
        <Frame className={className}>
          <path d="M24 40S8 30 8 19a8 8 0 0 1 16-2 8 8 0 0 1 16 2c0 11-16 21-16 21z" />
          <circle cx="24" cy="22" r="6" stroke={ACCENT} />
          <path d="M24 12v4M24 28v4M14 22h4M30 22h4" stroke={ACCENT} />
        </Frame>
      );
    case 'countup':
      return (
        <Frame className={className}>
          <path d="M8 40h32" />
          <rect x="10" y="28" width="7" height="12" rx="1" />
          <rect x="20.5" y="20" width="7" height="20" rx="1" />
          <rect x="31" y="10" width="7" height="30" rx="1" stroke={ACCENT} />
        </Frame>
      );
    case 'targets':
      return (
        <Frame className={className}>
          <circle cx="24" cy="24" r="14" />
          <path d="M24 4v10M24 34v10M4 24h10M34 24h10" />
          <circle cx="24" cy="24" r="4" stroke={ACCENT} fill={ACCENT} />
        </Frame>
      );
    case 'checkout':
      return (
        <Frame className={className}>
          <Target />
          <path d="M16 25l6 6 12-13" stroke={ACCENT} strokeWidth="3.5" />
        </Frame>
      );
  }
}

/** Killer lives as small hearts. */
export function Lives({ left, total, label }: { left: number; total: number; label: string }) {
  return (
    <span role="img" aria-label={label} className="inline-flex gap-0.5">
      {Array.from({ length: total }, (_, i) => (
        <svg key={i} viewBox="0 0 24 24" className="size-4" aria-hidden>
          <path
            d="M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11z"
            fill={i < left ? '#c4262e' : 'none'}
            stroke="currentColor"
            strokeWidth="1.5"
            opacity={i < left ? 1 : 0.35}
          />
        </svg>
      ))}
    </span>
  );
}

/** A Cricket mark: one (/), two (X) or three and more (⊗). */
export function CricketMark({ marks, label }: { marks: number; label: string }) {
  const m = Math.min(3, marks);
  return (
    <svg viewBox="0 0 24 24" className="mx-auto size-6" role="img" aria-label={label}>
      <g stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none">
        {m >= 1 ? <path d="M6 18L18 6" /> : null}
        {m >= 2 ? <path d="M6 6l12 12" /> : null}
        {m >= 3 ? <circle cx="12" cy="12" r="9" stroke={ACCENT} /> : null}
      </g>
    </svg>
  );
}
