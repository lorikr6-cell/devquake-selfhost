'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/** Fade in, about five seconds on screen, fade out. */
const TOTAL_MS = 6200;

/**
 * The end-of-game moment: a trophy with three darts flying into it and sparkles, over the
 * screen. It fades in, stays about five seconds and fades out; a tap closes it sooner. With
 * "reduce motion" it only fades. Rendered on <body> (toolbars would cut a fixed overlay off).
 */
export function Celebration({
  title,
  subtitle,
  onDone,
}: {
  title: string;
  subtitle?: string;
  onDone: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(onDone, TOTAL_MS);
    return () => clearTimeout(timer);
  }, [onDone]);
  if (!mounted) return null;

  return createPortal(
    <div
      role="status"
      aria-live="assertive"
      onClick={onDone}
      className="dq-celebrate fixed inset-0 z-[110] flex cursor-pointer flex-col items-center justify-center bg-ink/70 p-6 text-center text-paper backdrop-blur-sm"
    >
      <style>{CSS}</style>
      <svg viewBox="0 0 200 200" className="dq-trophy size-56 max-h-[45vh] sm:size-72" aria-hidden>
        {/* Sparkles around the cup. */}
        {SPARKS.map(([x, y, delay], i) => (
          <g
            key={i}
            className="dq-spark"
            style={{ animationDelay: `${delay}s` }}
            transform={`translate(${x} ${y})`}
          >
            <path
              d="M0 -7 L1.8 -1.8 L7 0 L1.8 1.8 L0 7 L-1.8 1.8 L-7 0 L-1.8 -1.8Z"
              fill="#fde68a"
            />
          </g>
        ))}
        {/* The trophy. */}
        <g className="dq-cup">
          <path
            d="M62 40h76v34a38 38 0 0 1-76 0z"
            fill="#f59e0b"
            stroke="#b45309"
            strokeWidth="4"
          />
          <path
            d="M62 50H44a18 18 0 0 0 22 26M138 50h18a18 18 0 0 1-22 26"
            fill="none"
            stroke="#b45309"
            strokeWidth="6"
          />
          <path d="M92 110h16v24H92z" fill="#d97706" />
          <path d="M70 150h60l-6-16H76z" fill="#b45309" />
          <rect x="62" y="150" width="76" height="14" rx="4" fill="#78350f" />
          <circle cx="100" cy="70" r="16" fill="#fff7ed" stroke="#b45309" strokeWidth="3" />
          <circle cx="100" cy="70" r="9" fill="none" stroke="#c4262e" strokeWidth="3" />
          <circle cx="100" cy="70" r="3" fill="#1f7a45" />
        </g>
        {/* Three darts landing in the dartboard on the cup. */}
        {[
          [-28, 0],
          [0, 0.25],
          [28, 0.5],
        ].map(([dx, delay], i) => (
          <g key={i} className="dq-dart" style={{ animationDelay: `${0.5 + (delay as number)}s` }}>
            <g
              transform={`translate(${100 + (dx as number) * 0.2} 70) rotate(${-55 + (dx as number)})`}
            >
              <path d="M0 0 L10 0" stroke="#e5e7eb" strokeWidth="2" />
              <path d="M10 0 L30 0" stroke="#111827" strokeWidth="5" strokeLinecap="round" />
              <path d="M30 0 L40 -8 L44 -8 L38 0 L44 8 L40 8Z" fill="#f97316" />
            </g>
          </g>
        ))}
      </svg>
      <p className="dq-title mt-4 font-display text-4xl font-bold drop-shadow sm:text-5xl">
        {title}
      </p>
      {subtitle ? <p className="dq-title mt-2 text-lg opacity-90">{subtitle}</p> : null}
    </div>,
    document.body,
  );
}

const SPARKS: [number, number, number][] = [
  [30, 40, 0.6],
  [170, 36, 0.9],
  [22, 120, 1.2],
  [178, 118, 0.7],
  [60, 14, 1.4],
  [140, 16, 1.1],
  [100, 186, 1.6],
];

const CSS = `
.dq-celebrate { animation: dq-fade ${TOTAL_MS}ms ease-in-out forwards; }
@keyframes dq-fade { 0% { opacity: 0 } 9% { opacity: 1 } 90% { opacity: 1 } 100% { opacity: 0 } }
.dq-cup { transform-origin: 100px 160px; animation: dq-pop .7s cubic-bezier(.2,1.6,.4,1) both; }
@keyframes dq-pop { from { transform: scale(.3) } to { transform: scale(1) } }
.dq-dart { opacity: 0; animation: dq-throw .45s ease-out both; }
@keyframes dq-throw { from { opacity: 0; transform: translate(120px, -120px) } to { opacity: 1; transform: none } }
.dq-spark { opacity: 0; transform-box: fill-box; transform-origin: center; animation: dq-twinkle 1.6s ease-in-out infinite; }
@keyframes dq-twinkle { 0%, 100% { opacity: 0; transform: scale(.4) } 50% { opacity: 1; transform: scale(1.2) } }
.dq-title { animation: dq-rise .8s .3s ease-out both; }
@keyframes dq-rise { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: none } }
@media (prefers-reduced-motion: reduce) {
  .dq-cup, .dq-dart, .dq-spark, .dq-title { animation: none; opacity: 1; }
  .dq-spark { opacity: .8; }
}
`;
