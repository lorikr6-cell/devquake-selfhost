/**
 * The geometry of the circle cropper (circle-cropper.tsx), pure and tested: a picture moved and
 * zoomed under a round window. The picture always covers the circle (no empty corners in the
 * saved image); zooming keeps the point under the anchor (the circle's centre, a pinch, the
 * mouse) in place. All positions are in the cropper's own pixels: a square of side `box`, the
 * circle of diameter `circle` in its middle.
 */

export interface CropFrame {
  /** Natural size of the picture. */
  width: number;
  height: number;
  /** Side of the square work area and diameter of the circle in it, in CSS pixels. */
  box: number;
  circle: number;
}

/** Where the picture's top-left corner is and how much it is scaled. */
export interface CropView {
  x: number;
  y: number;
  scale: number;
}

/** Zoom limits: from "the picture just covers the circle" to four times that. */
export function scaleLimits(f: CropFrame): { min: number; max: number } {
  const min = f.circle / Math.min(f.width, f.height);
  return { min, max: min * 4 };
}

/** Keeps the scale within its limits and the circle covered by the picture. */
export function clampView(v: CropView, f: CropFrame): CropView {
  const { min, max } = scaleLimits(f);
  const scale = Math.min(max, Math.max(min, v.scale));
  const edge = (f.box - f.circle) / 2;
  const clampAxis = (pos: number, size: number) =>
    Math.min(edge, Math.max(edge + f.circle - size * scale, pos));
  return { x: clampAxis(v.x, f.width), y: clampAxis(v.y, f.height), scale };
}

/** The starting view: the picture fills the circle, centred. */
export function fitView(f: CropFrame): CropView {
  const { min } = scaleLimits(f);
  return clampView(
    { x: (f.box - f.width * min) / 2, y: (f.box - f.height * min) / 2, scale: min },
    f,
  );
}

/** Zooms to `scale`, keeping the picture point under (ax, ay) where it is (default: centre). */
export function zoomView(
  v: CropView,
  scale: number,
  f: CropFrame,
  ax = f.box / 2,
  ay = f.box / 2,
): CropView {
  const { min, max } = scaleLimits(f);
  const next = Math.min(max, Math.max(min, scale));
  const ratio = next / v.scale;
  return clampView({ x: ax - (ax - v.x) * ratio, y: ay - (ay - v.y) * ratio, scale: next }, f);
}

/** Moves the picture by (dx, dy) on screen. */
export const moveView = (v: CropView, dx: number, dy: number, f: CropFrame): CropView =>
  clampView({ ...v, x: v.x + dx, y: v.y + dy }, f);

/** The square of the picture (in its own pixels) that lies under the circle. */
export function cropSquare(v: CropView, f: CropFrame): { sx: number; sy: number; side: number } {
  const edge = (f.box - f.circle) / 2;
  return { sx: (edge - v.x) / v.scale, sy: (edge - v.y) / v.scale, side: f.circle / v.scale };
}
