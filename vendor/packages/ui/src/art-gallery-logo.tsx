// The art gallery's logo and picture (ADR 0075, docs/brand.md), shared so apps such as the
// store can show it too; also ArtQuake's name (`text: '{art}quake'`).

import { cn } from './cn';

/**
 * The art gallery's picture: a framed painting on an easel, with an orange landscape (a sun
 * over mountains) on the canvas.
 */
export function GalleryEasel({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Easel legs and the shelf the canvas rests on. */}
      <path d="M13 29 9 38M27 29l4 9M20 29v8M8 29h24" strokeWidth={2.4} />
      {/* The frame. */}
      <rect x={6} y={4} width={28} height={23} rx={2} strokeWidth={2.6} />
      {/* The painting: a sun over mountains, in Quake orange. */}
      <circle cx={26} cy={10.5} r={2.6} fill="var(--dq-quake, #E4572E)" stroke="none" />
      <path
        d="M9.5 24.5 16 15.5l4.5 5.5 3.5-3.5 6.5 7z"
        fill="var(--dq-quake, #E4572E)"
        stroke="var(--dq-quake, #E4572E)"
        strokeWidth={1.2}
      />
    </svg>
  );
}

/**
 * The art gallery's logo (owner's choice): the easel picture and the gallery's name in the
 * brand typeface, with its "art" word in Quake orange, as "quake" is in the DevQuake wordmark,
 * and the rest in the text colour. Each language marks its own "art" word (artGallery.logo:
 * `text` with `{art}`, and `art`), wherever it falls in the name.
 */
export function ArtGalleryLogo({
  size = 32,
  text,
  art,
  className,
}: {
  size?: number;
  /** "{art} gallery", "galeria de {art}"… */
  text: string;
  /** "art", "artă"… */
  art: string;
  className?: string;
}) {
  const [before = '', after = ''] = text.split('{art}');
  return (
    <span className={cn('inline-flex items-center', className)} style={{ gap: size * 0.3 }}>
      <GalleryEasel size={size} />
      <span
        style={{
          fontFamily: 'var(--font-brand, system-ui, sans-serif)',
          fontWeight: 800,
          fontSize: size * 0.62,
          letterSpacing: '-0.02em',
          lineHeight: 1,
        }}
      >
        {before}
        <span style={{ color: 'var(--dq-quake, #E4572E)' }}>{art}</span>
        {after}
      </span>
    </span>
  );
}
