import QRCode from 'qrcode';
import { BRAND_COLORS, MARK } from './mark';

/**
 * QR codes with the DevQuake mark in the middle. The code uses the highest error correction
 * level (H: up to ~30% of it may be unreadable) and only a small centre square (under 10% of
 * the modules, never a finder pattern) is cleared for the logo, so it still scans reliably.
 * Server-side only (import from "@devquake/ui/qr").
 */

export interface BrandedQrLayout {
  /** Modules per side, including the quiet zone. */
  size: number;
  /** True for a dark module at (x, y), quiet zone and logo area excluded. */
  isDark(x: number, y: number): boolean;
  /** The cleared square for the logo, in modules. */
  logo: { x: number; y: number; size: number };
}

/** Share of the code's width used by the logo square. */
const LOGO_RATIO = 0.22;

export function brandedQrLayout(text: string, margin = 2): BrandedQrLayout {
  const qr = QRCode.create(text, { errorCorrectionLevel: 'H' });
  const n = qr.modules.size;
  // Odd width so the square is exactly centred on the (odd-sized) symbol.
  let k = Math.round(n * LOGO_RATIO);
  if (k % 2 === 0) k += 1;
  const start = (n - k) / 2;
  const inLogo = (x: number, y: number) =>
    x >= start && x < start + k && y >= start && y < start + k;
  return {
    size: n + margin * 2,
    isDark(x, y) {
      const mx = x - margin;
      const my = y - margin;
      if (mx < 0 || my < 0 || mx >= n || my >= n || inLogo(mx, my)) return false;
      return qr.modules.get(my, mx) === 1;
    },
    logo: { x: start + margin, y: start + margin, size: k },
  };
}

export interface BrandedQrOptions {
  /** Quiet zone in modules (default 2). */
  margin?: number;
  /** Accessible label; omit when the surrounding element already has one. */
  title?: string;
}

/** Inline SVG string: dark modules on white, the mark on a white rounded plate in the middle. */
export function brandedQrSvg(text: string, options: BrandedQrOptions = {}): string {
  const layout = brandedQrLayout(text, options.margin ?? 2);
  let d = '';
  for (let y = 0; y < layout.size; y++) {
    for (let x = 0; x < layout.size; x++) {
      if (layout.isDark(x, y)) d += `M${x} ${y}h1v1h-1z`;
    }
  }
  const { x, y, size } = layout.logo;
  const pad = size * 0.1;
  const escape = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${layout.size} ${layout.size}" shape-rendering="crispEdges">` +
    (options.title ? `<title>${escape(options.title)}</title>` : '') +
    `<rect width="100%" height="100%" fill="#FFFFFF"/>` +
    `<path d="${d}" fill="${BRAND_COLORS.ink}"/>` +
    `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${size * 0.18}" fill="#FFFFFF"/>` +
    `<svg x="${x + pad}" y="${y + pad}" width="${size - pad * 2}" height="${size - pad * 2}" viewBox="${MARK.viewBox}" shape-rendering="geometricPrecision">` +
    `<path d="${MARK.ringMain}" fill="${BRAND_COLORS.ink}"/>` +
    `<path d="${MARK.ringPiece}" fill="${BRAND_COLORS.ink}"/>` +
    `<path d="${MARK.tail}" fill="none" stroke="${BRAND_COLORS.quake}" stroke-width="${MARK.tailWidth}" stroke-linecap="round" stroke-linejoin="round"/>` +
    `</svg></svg>`
  );
}
