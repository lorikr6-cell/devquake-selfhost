// The organisation's header look (migration 0021): font, background, text colour, alignment.
// Pure: tested in header-style.test.ts. Fonts are the device's own (no downloads), so the
// header looks the same offline and in print.

export const HEADER_FONTS = {
  app: 'var(--font-display, ui-sans-serif, system-ui, sans-serif)',
  sans: 'ui-sans-serif, system-ui, "Segoe UI", Roboto, Arial, sans-serif',
  serif: 'Georgia, Cambria, "Times New Roman", Times, serif',
  rounded: 'ui-rounded, "Arial Rounded MT Bold", "Varela Round", "Segoe UI", sans-serif',
  condensed:
    '"Arial Narrow", "Roboto Condensed", "Segoe UI Semibold", sans-serif-condensed, sans-serif',
  slab: '"Rockwell", "Roboto Slab", "Courier New", serif',
  script: '"Segoe Script", "Brush Script MT", "Apple Chancery", cursive',
  mono: 'ui-monospace, Consolas, "Courier New", monospace',
} as const;

export type HeaderFont = keyof typeof HEADER_FONTS;
export const HEADER_FONT_IDS = Object.keys(HEADER_FONTS) as HeaderFont[];
export const isHeaderFont = (v: unknown): v is HeaderFont =>
  typeof v === 'string' && Object.hasOwn(HEADER_FONTS, v);

export const HEADER_TEXT = ['auto', 'dark', 'light'] as const;
export type HeaderText = (typeof HEADER_TEXT)[number];
export const isHeaderText = (v: unknown): v is HeaderText => HEADER_TEXT.includes(v as HeaderText);

export const HEADER_ALIGN = ['left', 'center'] as const;
export type HeaderAlign = (typeof HEADER_ALIGN)[number];
export const isHeaderAlign = (v: unknown): v is HeaderAlign =>
  HEADER_ALIGN.includes(v as HeaderAlign);

const HEX = /^#[0-9a-f]{6}$/;
/** "#RRGGBB" in lower case, or null for anything else. */
export function hexColor(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const c = v.trim().toLowerCase();
  return HEX.test(c) ? c : null;
}

export interface HeaderLook {
  font: HeaderFont;
  /** Null: no colour (the page's own background). */
  bg: string | null;
  text: HeaderText;
  align: HeaderAlign;
  /** Versions the picture's URL; null without one. */
  imageVersion: string | null;
}

export const DEFAULT_LOOK: HeaderLook = {
  font: 'app',
  bg: null,
  text: 'auto',
  align: 'left',
  imageVersion: null,
};

/** Relative luminance of "#rrggbb" (WCAG). */
export function luminance(hex: string): number {
  const ch = (i: number) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * ch(1) + 0.7152 * ch(3) + 0.0722 * ch(5);
}

export const DARK_TEXT = '#1a1a1a';
export const LIGHT_TEXT = '#ffffff';

/**
 * The text colour on the header: the chosen one, or for "auto" whichever reads better on the
 * colour (white on a picture, which gets a dark veil). Null: the page's own text colour (also
 * when there is neither a colour nor a picture).
 */
export function textColour(look: HeaderLook): string | null {
  // Without a colour or picture the page's own colours stay (readable in light and dark mode).
  if (!look.bg && !look.imageVersion) return null;
  if (look.text === 'dark') return DARK_TEXT;
  if (look.text === 'light') return LIGHT_TEXT;
  if (look.imageVersion) return LIGHT_TEXT;
  if (!look.bg) return null;
  // Contrast with white vs. with near-black: pick the larger.
  const l = luminance(look.bg);
  return 1.05 / (l + 0.05) >= (l + 0.05) / (luminance(DARK_TEXT) + 0.05) ? LIGHT_TEXT : DARK_TEXT;
}

/** Whether the look differs from the plain default (then the header is drawn as a coloured card). */
export const isStyled = (look: HeaderLook) => look.bg !== null || look.imageVersion !== null;
