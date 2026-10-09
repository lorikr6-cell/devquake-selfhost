import type { CSSProperties, SVGProps } from 'react';
import { cn } from './cn';
import { MARK } from './mark';

const VIEWBOX = MARK.viewBox;
const RING_MAIN = MARK.ringMain;
const RING_PIECE = MARK.ringPiece;
const TAIL = MARK.tail;

const QUAKE = 'var(--dq-quake, #E4572E)';

export interface DevQuakeMarkProps extends Omit<SVGProps<SVGSVGElement>, 'children'> {
  /** Width and height in px (or any CSS length). */
  size?: number | string;
  /** Single colour: the tail also uses the current text colour. */
  mono?: boolean;
  /** Accessible name. Pass an empty string when the mark is decorative. */
  title?: string;
}

/**
 * The DevQuake mark. The cracked ring follows the current text colour (`currentColor`), so it
 * adapts to light and dark backgrounds; the seismic tail is always Quake orange unless `mono`.
 */
export function DevQuakeMark({
  size = 32,
  mono = false,
  title = 'DevQuake',
  ...props
}: DevQuakeMarkProps) {
  const decorative = title === '';
  return (
    <svg
      viewBox={VIEWBOX}
      width={size}
      height={size}
      role={decorative ? undefined : 'img'}
      aria-hidden={decorative ? true : undefined}
      {...props}
    >
      {decorative ? null : <title>{title}</title>}
      <path d={RING_MAIN} fill="currentColor" />
      <path d={RING_PIECE} fill="currentColor" />
      <path
        d={TAIL}
        fill="none"
        stroke={mono ? 'currentColor' : QUAKE}
        strokeWidth={7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export interface DevQuakeLogoProps {
  /** Height of the mark in px; the wordmark scales with it. */
  size?: number;
  mono?: boolean;
  className?: string;
}

/** Mark + "devquake" wordmark (Bricolage Grotesque, loaded by the host as --font-brand). */
export function DevQuakeLogo({ size = 32, mono = false, className }: DevQuakeLogoProps) {
  const word: CSSProperties = {
    fontFamily: 'var(--font-brand, system-ui, sans-serif)',
    fontWeight: 800,
    fontSize: size * 0.62,
    letterSpacing: '-0.02em',
    lineHeight: 1,
  };
  return (
    <span className={cn('inline-flex items-center', className)} style={{ gap: size * 0.28 }}>
      <DevQuakeMark size={size} mono={mono} title="" />
      <span style={word} aria-label="DevQuake">
        dev<span style={{ color: mono ? undefined : QUAKE }}>quake</span>
      </span>
    </span>
  );
}
