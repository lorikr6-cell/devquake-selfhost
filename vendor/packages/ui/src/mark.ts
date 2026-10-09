// Geometry of the DevQuake mark ("Cracked Q"). Source of truth: docs/brand.md.
// Plain data (no React) so server code such as the QR generator can use it too.
export const MARK = {
  viewBox: '8.5 4.5 108.3 108.3',
  ringMain:
    'M83.47 87.77A42 42 0 1 1 39.49 17.38L36.08 23.05L47.52 26.7L45.38 31.17A27 27 0 1 0 73.66 76.42L72.99 81.33L84.99 81.34L83.47 87.77Z',
  ringPiece:
    'M45.24 15.4A42 42 0 0 1 87.77 83.47L88.34 76.88L76.47 78.61L76.42 73.66A27 27 0 0 0 49.08 29.9L51.84 25.79L41.05 20.52L45.24 15.4Z',
  tail: 'M84.28 84.28L90.28 78.28L97.28 103.28L103.28 90.28L111.28 90.28',
  tailWidth: 7,
} as const;

export const BRAND_COLORS = { ink: '#16181D', paper: '#F4F1EA', quake: '#E4572E' } as const;
