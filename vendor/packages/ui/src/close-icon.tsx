/**
 * The close mark ("×") drawn as two strokes, so it sits exactly in the middle of a round button
 * (a "×" character sits above the centre in most fonts). Decorative: the button carries the
 * label.
 */
export function CloseIcon({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
    >
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}
