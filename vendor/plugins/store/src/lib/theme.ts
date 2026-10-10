// The shop's own look (ADR 0058): colours, font, corners, cards, header and grid. Pure and
// tested (theme.test.ts). Fonts are system font stacks: nothing is loaded from other servers,
// so buyers' addresses are not sent to a font service.

export const FONTS = {
  system: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  rounded: 'ui-rounded, "SF Pro Rounded", "Nunito", "Varela Round", system-ui, sans-serif',
  serif: 'Georgia, Cambria, "Times New Roman", Times, serif',
  elegant: '"Palatino Linotype", Palatino, "Book Antiqua", "URW Palladio L", serif',
  condensed:
    '"Avenir Next Condensed", "Arial Narrow", "Roboto Condensed", sans-serif-condensed, sans-serif',
  mono: 'ui-monospace, "SF Mono", "Cascadia Code", Menlo, Consolas, monospace',
} as const;
export type FontId = keyof typeof FONTS;
export const FONT_IDS = Object.keys(FONTS) as FontId[];

export const RADII = { square: '0.125rem', rounded: '0.75rem', pill: '1.5rem' } as const;
const BUTTON_RADII = { square: '0.125rem', rounded: '0.5rem', pill: '999px' } as const;
export type RadiusId = keyof typeof RADII;
export const RADIUS_IDS = Object.keys(RADII) as RadiusId[];

export const CARD_STYLES = ['bordered', 'shadow', 'flat'] as const;
export type CardStyle = (typeof CARD_STYLES)[number];

export const HEADER_STYLES = ['left', 'center'] as const;
export type HeaderStyle = (typeof HEADER_STYLES)[number];

export const GRID_COLUMNS = [2, 3, 4] as const;
export type GridColumns = (typeof GRID_COLUMNS)[number];

export interface Theme {
  accent: string;
  background: string;
  text: string;
  font: FontId;
  headingFont: FontId;
  radius: RadiusId;
  cards: CardStyle;
  header: HeaderStyle;
  /** Products per row on wide screens. */
  columns: GridColumns;
}

/** Ready-made looks the owner starts from. */
export const PRESETS: Record<string, Theme> = {
  classic: {
    accent: '#e4572e',
    background: '#ffffff',
    text: '#1d1d1f',
    font: 'system',
    headingFont: 'system',
    radius: 'rounded',
    cards: 'bordered',
    header: 'left',
    columns: 4,
  },
  boutique: {
    accent: '#9c6644',
    background: '#faf6f1',
    text: '#2b2118',
    font: 'serif',
    headingFont: 'elegant',
    radius: 'square',
    cards: 'flat',
    header: 'center',
    columns: 3,
  },
  midnight: {
    accent: '#f5b700',
    background: '#111827',
    text: '#f3f4f6',
    font: 'system',
    headingFont: 'condensed',
    radius: 'rounded',
    cards: 'bordered',
    header: 'left',
    columns: 4,
  },
  forest: {
    accent: '#2f855a',
    background: '#f3f7f2',
    text: '#1c2b22',
    font: 'rounded',
    headingFont: 'rounded',
    radius: 'pill',
    cards: 'shadow',
    header: 'left',
    columns: 3,
  },
  ocean: {
    accent: '#0369a1',
    background: '#f0f7fb',
    text: '#0f2533',
    font: 'system',
    headingFont: 'system',
    radius: 'rounded',
    cards: 'shadow',
    header: 'center',
    columns: 4,
  },
  blush: {
    accent: '#be185d',
    background: '#fff5f7',
    text: '#3b1a27',
    font: 'rounded',
    headingFont: 'elegant',
    radius: 'pill',
    cards: 'flat',
    header: 'center',
    columns: 3,
  },
  tech: {
    accent: '#22d3ee',
    background: '#0b1220',
    text: '#e2e8f0',
    font: 'system',
    headingFont: 'mono',
    radius: 'square',
    cards: 'bordered',
    header: 'left',
    columns: 4,
  },
};
export const PRESET_IDS = Object.keys(PRESETS);

const HEX = /^#[0-9a-f]{6}$/;
export const isHexColor = (v: unknown): v is string =>
  typeof v === 'string' && HEX.test(v.toLowerCase());

function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const toHex = (c: [number, number, number]) =>
  `#${c.map((x) => Math.round(x).toString(16).padStart(2, '0')).join('')}`;

/** `a` blended into `b`: weight 1 is all `a`. */
export function mix(a: string, b: string, weight: number): string {
  const [x, y] = [rgb(a), rgb(b)];
  return toHex(
    [0, 1, 2].map((i) => x[i]! * weight + y[i]! * (1 - weight)) as [number, number, number],
  );
}

/** WCAG relative luminance. */
export function luminance(hex: string): number {
  const [r, g, b] = rgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two colours (1 to 21). */
export function contrast(a: string, b: string): number {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (l1 + 0.05) / (l2 + 0.05);
}

/** Black or white, whichever reads better on `background`. */
export const readableOn = (background: string) =>
  contrast(background, '#ffffff') >= contrast(background, '#111111') ? '#ffffff' : '#111111';

/** What the design editor warns about (keys of the design.warn texts). */
export function themeWarnings(t: Theme): Array<'textContrast' | 'accentContrast'> {
  const out: Array<'textContrast' | 'accentContrast'> = [];
  if (contrast(t.text, t.background) < 4.5) out.push('textContrast');
  if (contrast(t.accent, t.background) < 3) out.push('accentContrast');
  return out;
}

/** A theme from the database or a request; null when it is not a complete, valid theme. */
export function parseTheme(value: unknown): Theme | null {
  let v = value;
  if (typeof v === 'string') {
    try {
      v = JSON.parse(v);
    } catch {
      return null;
    }
  }
  if (!v || typeof v !== 'object') return null;
  const o = v as Record<string, unknown>;
  const lower = (x: unknown) => (typeof x === 'string' ? x.toLowerCase() : x);
  const [accent, background, text] = [lower(o.accent), lower(o.background), lower(o.text)];
  if (!isHexColor(accent) || !isHexColor(background) || !isHexColor(text)) return null;
  const pick = <T extends string | number>(x: unknown, list: readonly T[]): T | null =>
    list.includes(x as T) ? (x as T) : null;
  const font = pick(o.font, FONT_IDS);
  const headingFont = pick(o.headingFont, FONT_IDS);
  const radius = pick(o.radius, RADIUS_IDS);
  const cards = pick(o.cards, CARD_STYLES);
  const header = pick(o.header, HEADER_STYLES);
  const columns = pick(Number(o.columns), GRID_COLUMNS);
  if (!font || !headingFont || !radius || !cards || !header || !columns) return null;
  return { accent, background, text, font, headingFont, radius, cards, header, columns };
}

/** The CSS custom properties a themed shop sets (used by the shop's components). */
export function themeVars(t: Theme): Record<string, string> {
  return {
    '--shop-accent': t.accent,
    '--shop-on-accent': readableOn(t.accent),
    '--shop-bg': t.background,
    '--shop-page': t.background,
    '--shop-text': t.text,
    '--shop-muted': mix(t.text, t.background, 0.68),
    '--shop-line': mix(t.text, t.background, 0.14),
    '--shop-surface': mix(t.text, t.background, 0.035),
    '--shop-radius': RADII[t.radius],
    '--shop-button-radius': BUTTON_RADII[t.radius],
    '--shop-font': FONTS[t.font],
    '--shop-heading': FONTS[t.headingFont],
    '--shop-shadow': t.cards === 'shadow' ? '0 6px 20px -8px rgb(0 0 0 / 0.25)' : 'none',
    '--shop-card-line': t.cards === 'bordered' ? mix(t.text, t.background, 0.14) : 'transparent',
  };
}
