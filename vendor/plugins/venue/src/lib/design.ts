import type { PluginDatabase } from '@devquake/plugin-sdk';
import type { Check } from './model';

// The menu's own design (venue migration 0004): settings checked here, the flattened background
// picture kept in the database. Pure parts are tested.

type Db = Omit<PluginDatabase, 'transaction'>;

export const DESIGN_FONTS = ['serif', 'sans', 'hand', 'classic', 'modern'] as const;
export type DesignFont = (typeof DESIGN_FONTS)[number];
export const PANELS = ['none', 'light', 'dark'] as const;
export type Panel = (typeof PANELS)[number];

/** The pictures the owner may place before they are flattened into one background. */
export const DESIGN_PICTURES_MAX = 5;
/** The flattened background: at most this many bytes. */
export const BG_MAX_BYTES = 2 * 1024 * 1024;

/**
 * The menu's page shapes (owner's request): A4, or a ratio for screens, posters and social posts.
 * Each is width:height; the flattened background's longest side is 1754 px (A4 at 150 dpi).
 */
export const FORMATS = [
  { id: 'a4', w: 210, h: 297 },
  { id: '1:1', w: 1, h: 1 },
  { id: '4:3', w: 4, h: 3 },
  { id: '3:4', w: 3, h: 4 },
  { id: '16:9', w: 16, h: 9 },
  { id: '9:16', w: 9, h: 16 },
  { id: '3:2', w: 3, h: 2 },
  { id: '2:3', w: 2, h: 3 },
  { id: '5:4', w: 5, h: 4 },
  { id: '4:5', w: 4, h: 5 },
] as const;
export type MenuFormat = (typeof FORMATS)[number]['id'];
export const isFormat = (v: unknown): v is MenuFormat => FORMATS.some((f) => f.id === v);

const LONG_SIDE = 1754;

/** The background's pixel size for a format (the longest side 1754 px). */
export function formatSize(format: MenuFormat): { width: number; height: number } {
  const f = FORMATS.find((x) => x.id === format) ?? FORMATS[0];
  return f.w >= f.h
    ? { width: LONG_SIDE, height: Math.round((LONG_SIDE * f.h) / f.w) }
    : { width: Math.round((LONG_SIDE * f.w) / f.h), height: LONG_SIDE };
}

/** The printed page for a format: A4, or the ratio with its long side 297 mm. */
export function formatPage(format: MenuFormat): string {
  if (format === 'a4') return 'A4';
  const f = FORMATS.find((x) => x.id === format)!;
  const long = 297;
  const [w, h] =
    f.w >= f.h ? [long, Math.round((long * f.h) / f.w)] : [Math.round((long * f.w) / f.h), long];
  return `${w}mm ${h}mm`;
}

export interface MenuDesign {
  title: string;
  subtitle: string;
  /** The page shape (A4 or a ratio). */
  format: MenuFormat;
  font: DesignFont;
  textColor: string;
  accentColor: string;
  panel: Panel;
  columns: 1 | 2;
  showAllergens: boolean;
  onPublic: boolean;
  /** The background's version (seconds of its last change), or null without one. */
  background: number | null;
}

export const DEFAULT_DESIGN: MenuDesign = {
  title: '',
  subtitle: '',
  format: 'a4',
  font: 'serif',
  textColor: '#1f1f1f',
  accentColor: '#b4532a',
  panel: 'light',
  columns: 1,
  showAllergens: true,
  onPublic: true,
  background: null,
};

/** The CSS font stacks (system fonts only: nothing to download, also when printing). */
export const DESIGN_FONT_STACK: Record<DesignFont, string> = {
  serif: 'Georgia, "Times New Roman", serif',
  sans: '"Helvetica Neue", Arial, sans-serif',
  hand: '"Segoe Print", "Bradley Hand", "Comic Sans MS", cursive',
  classic: '"Palatino Linotype", Palatino, "Book Antiqua", serif',
  modern: '"Trebuchet MS", "Gill Sans", "Segoe UI", sans-serif',
};

const COLOR = /^#[0-9a-f]{6}$/;
const line = (v: unknown, max: number) =>
  typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '';

export function checkDesign(raw: Record<string, unknown>): Check<Omit<MenuDesign, 'background'>> {
  const font = DESIGN_FONTS.includes(raw.font as DesignFont) ? (raw.font as DesignFont) : null;
  if (!font) return { ok: false, error: 'designFont', field: 'font' };
  const panel = PANELS.includes(raw.panel as Panel) ? (raw.panel as Panel) : null;
  if (!panel) return { ok: false, error: 'designPanel', field: 'panel' };
  const colors = [raw.textColor, raw.accentColor].map((c) => String(c ?? '').toLowerCase());
  if (colors.some((c) => !COLOR.test(c)))
    return { ok: false, error: 'designColor', field: 'color' };
  return {
    ok: true,
    value: {
      title: line(raw.title, 80),
      subtitle: line(raw.subtitle, 120),
      format: isFormat(raw.format) ? raw.format : 'a4',
      font,
      textColor: colors[0]!,
      accentColor: colors[1]!,
      panel,
      columns: Number(raw.columns) === 2 ? 2 : 1,
      showAllergens: raw.showAllergens !== false,
      onPublic: raw.onPublic !== false,
    },
  };
}

/** A background picture's type from its first bytes (JPEG, PNG or WebP only). */
export function sniffImage(bytes: Uint8Array): 'image/jpeg' | 'image/png' | 'image/webp' | null {
  if (bytes.length < 12) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47)
    return 'image/png';
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.slice(from, to));
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'image/webp';
  return null;
}

// --- the database ---------------------------------------------------------------------------------

export async function designOf(db: Db, venueId: number): Promise<MenuDesign> {
  const [r] = await db.query<{
    title: string | null;
    subtitle: string | null;
    format: string;
    font: DesignFont;
    text_color: string;
    accent_color: string;
    panel: Panel;
    columns: number;
    show_allergens: number;
    on_public: number;
    v: number | null;
  }>(
    `SELECT title, subtitle, format, font, text_color, accent_color, panel, columns, show_allergens,
            on_public, IF(bg_data IS NULL, NULL, UNIX_TIMESTAMP(updated_at)) AS v
       FROM menu_designs WHERE venue_id = ?`,
    [venueId],
  );
  if (!r) return DEFAULT_DESIGN;
  return {
    title: r.title ?? '',
    subtitle: r.subtitle ?? '',
    format: isFormat(r.format) ? r.format : 'a4',
    font: r.font,
    textColor: r.text_color,
    accentColor: r.accent_color,
    panel: r.panel,
    columns: Number(r.columns) === 2 ? 2 : 1,
    showAllergens: Number(r.show_allergens) === 1,
    onPublic: Number(r.on_public) === 1,
    background: r.v === null ? null : Number(r.v),
  };
}

export async function saveDesign(db: Db, venueId: number, d: Omit<MenuDesign, 'background'>) {
  await db.execute(
    `INSERT INTO menu_designs (venue_id, title, subtitle, format, font, text_color, accent_color,
                               panel, columns, show_allergens, on_public)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE title = VALUES(title), subtitle = VALUES(subtitle),
       format = VALUES(format), font = VALUES(font),
       text_color = VALUES(text_color), accent_color = VALUES(accent_color), panel = VALUES(panel),
       columns = VALUES(columns), show_allergens = VALUES(show_allergens),
       on_public = VALUES(on_public)`,
    [
      venueId,
      d.title || null,
      d.subtitle || null,
      d.format,
      d.font,
      d.textColor,
      d.accentColor,
      d.panel,
      d.columns,
      d.showAllergens ? 1 : 0,
      d.onPublic ? 1 : 0,
    ],
  );
}

/** Stores (or replaces) the flattened background; null removes it. */
export async function saveBackground(
  db: Db,
  venueId: number,
  image: { mime: string; data: Uint8Array } | null,
) {
  await db.execute(
    `INSERT INTO menu_designs (venue_id, bg_mime, bg_data, bg_bytes) VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE bg_mime = VALUES(bg_mime), bg_data = VALUES(bg_data),
       bg_bytes = VALUES(bg_bytes), updated_at = CURRENT_TIMESTAMP`,
    [venueId, image?.mime ?? null, image?.data ?? null, image?.data.length ?? 0],
  );
}

export async function readBackground(db: Db, venueId: number) {
  const [r] = await db.query<{ bg_mime: string | null; bg_data: Uint8Array | null }>(
    'SELECT bg_mime, bg_data FROM menu_designs WHERE venue_id = ?',
    [venueId],
  );
  return r?.bg_mime && r.bg_data ? { mime: r.bg_mime, data: r.bg_data } : null;
}
