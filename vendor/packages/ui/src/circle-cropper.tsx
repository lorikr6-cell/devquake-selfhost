'use client';

import { useEffect, useId, useRef, useState, type PointerEvent, type WheelEvent } from 'react';
import { Button } from './button';
import {
  cropSquare,
  fitView,
  moveView,
  scaleLimits,
  zoomView,
  type CropFrame,
  type CropView,
} from './crop';
import { Sheet } from './sheet';

export interface CircleCropperLabels {
  title: string;
  hint: string;
  zoom: string;
  zoomIn: string;
  zoomOut: string;
  save: string;
  cancel: string;
  /** Shown when the picture cannot be read. */
  unreadable: string;
}

/**
 * A picture placed in a circle before it is saved (profile pictures): the picture opens fitted
 * to the circle; it can be dragged (mouse, finger, arrow keys) and zoomed (slider, buttons,
 * mouse wheel, two fingers, + and -). Only the square under the circle is kept, `size` pixels
 * wide (WebP, JPEG where WebP is not available), so the saved picture is what was shown.
 * Everything happens on the device. Geometry in crop.ts.
 */
export function CircleCropper({
  file,
  onCancel,
  onDone,
  labels,
  size = 512,
}: {
  /** The chosen picture; the cropper is open while it is set. */
  file: File | null;
  onCancel: () => void;
  onDone: (picture: Blob) => void;
  labels: CircleCropperLabels;
  size?: number;
}) {
  const titleId = useId();
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [box, setBox] = useState(320);
  const [view, setView] = useState<CropView | null>(null);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const area = useRef<HTMLDivElement>(null);

  const frame: CropFrame | null = bitmap
    ? { width: bitmap.width, height: bitmap.height, box, circle: Math.round(box * 0.84) }
    : null;

  // Read the picture (turned the way the camera held it) and fit it to the circle.
  useEffect(() => {
    if (!file) return;
    let cancelled = false;
    const side = Math.max(220, Math.min(360, window.innerWidth - 48));
    setBox(side);
    setError(false);
    setView(null);
    createImageBitmap(file, { imageOrientation: 'from-image' })
      .then((b) => {
        if (cancelled) return b.close();
        setBitmap(b);
        const objectUrl = URL.createObjectURL(file);
        setUrl(objectUrl);
        setView(
          fitView({ width: b.width, height: b.height, box: side, circle: Math.round(side * 0.84) }),
        );
      })
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, [file]);

  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url);
    },
    [url],
  );
  useEffect(() => () => bitmap?.close(), [bitmap]);

  const local = (e: { clientX: number; clientY: number }) => {
    const r = area.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, local(e));
  }
  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!frame || !view || !pointers.current.has(e.pointerId)) return;
    const before = [...pointers.current.values()];
    const prev = pointers.current.get(e.pointerId)!;
    const now = local(e);
    pointers.current.set(e.pointerId, now);
    if (before.length >= 2) {
      // Two fingers: zoom by how much they spread, around their middle.
      const other = before.find((p) => p !== prev)!;
      const was = Math.hypot(prev.x - other.x, prev.y - other.y);
      const is = Math.hypot(now.x - other.x, now.y - other.y);
      if (was > 0) {
        setView(
          zoomView(
            view,
            view.scale * (is / was),
            frame,
            (now.x + other.x) / 2,
            (now.y + other.y) / 2,
          ),
        );
      }
      return;
    }
    setView(moveView(view, now.x - prev.x, now.y - prev.y, frame));
  }
  function onPointerUp(e: PointerEvent<HTMLDivElement>) {
    pointers.current.delete(e.pointerId);
  }
  function onWheel(e: WheelEvent<HTMLDivElement>) {
    if (!frame || !view) return;
    const p = local(e);
    setView(zoomView(view, view.scale * Math.exp(-e.deltaY / 500), frame, p.x, p.y));
  }
  function onKey(e: React.KeyboardEvent<HTMLDivElement>) {
    if (!frame || !view) return;
    const step = e.shiftKey ? 20 : 5;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [step, 0],
      ArrowRight: [-step, 0],
      ArrowUp: [0, step],
      ArrowDown: [0, -step],
    };
    if (moves[e.key]) {
      e.preventDefault();
      setView(moveView(view, ...moves[e.key]!, frame));
    } else if (e.key === '+' || e.key === '=') {
      setView(zoomView(view, view.scale * 1.1, frame));
    } else if (e.key === '-') {
      setView(zoomView(view, view.scale / 1.1, frame));
    }
  }

  async function save() {
    if (!bitmap || !frame || !view) return;
    setBusy(true);
    try {
      const { sx, sy, side } = cropSquare(view, frame);
      const canvas = document.createElement('canvas');
      const out = Math.min(size, Math.round(side));
      canvas.width = out;
      canvas.height = out;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, out, out);
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, out, out);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/webp', 0.88),
      );
      const picture =
        blob && blob.type === 'image/webp'
          ? blob
          : await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.88));
      if (!picture) throw new Error('crop failed');
      onDone(picture);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  const limits = frame ? scaleLimits(frame) : null;
  const zoomLevel = limits && view ? (view.scale - limits.min) / (limits.max - limits.min) : 0;
  const circle = frame?.circle ?? 0;

  return (
    <Sheet
      open={file !== null}
      onClose={onCancel}
      labelledBy={titleId}
      header={
        <h2 id={titleId} className="font-display text-xl tracking-tight">
          {labels.title}
        </h2>
      }
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            {labels.cancel}
          </Button>
          <Button type="button" onClick={save} disabled={!view || busy}>
            {labels.save}
          </Button>
        </div>
      }
    >
      <p className="text-sm text-ink/70 dark:text-paper/70">{labels.hint}</p>
      {error ? (
        <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-400">
          {labels.unreadable}
        </p>
      ) : null}
      <div
        ref={area}
        tabIndex={0}
        role="application"
        aria-label={labels.hint}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
        onKeyDown={onKey}
        className="relative mx-auto mt-4 cursor-grab touch-none overflow-hidden rounded-lg bg-ink select-none focus-visible:ring-2 focus-visible:ring-quake focus-visible:outline-none active:cursor-grabbing"
        style={{ width: box, height: box }}
      >
        {url && view && frame ? (
          // A local preview of the chosen file: plain <img> on purpose.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt=""
            draggable={false}
            className="pointer-events-none absolute top-0 left-0 max-w-none origin-top-left"
            style={{
              width: frame.width,
              height: frame.height,
              transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
            }}
          />
        ) : null}
        {/* Darkened outside the circle: what stays is what is inside. */}
        <svg aria-hidden className="pointer-events-none absolute inset-0" width={box} height={box}>
          <defs>
            <mask id={`${titleId}-hole`}>
              <rect width={box} height={box} fill="white" />
              <circle cx={box / 2} cy={box / 2} r={circle / 2} fill="black" />
            </mask>
          </defs>
          <rect width={box} height={box} fill="rgba(0,0,0,0.55)" mask={`url(#${titleId}-hole)`} />
          <circle
            cx={box / 2}
            cy={box / 2}
            r={circle / 2}
            fill="none"
            stroke="white"
            strokeOpacity="0.85"
            strokeWidth="2"
          />
        </svg>
      </div>
      <div className="mx-auto mt-4 flex items-center gap-3" style={{ maxWidth: box }}>
        <button
          type="button"
          aria-label={labels.zoomOut}
          onClick={() => frame && view && setView(zoomView(view, view.scale / 1.2, frame))}
          className="grid size-9 shrink-0 place-items-center rounded-full border border-ink/20 text-lg dark:border-paper/20"
        >
          −
        </button>
        <input
          type="range"
          min={0}
          max={1000}
          value={Math.round(zoomLevel * 1000)}
          aria-label={labels.zoom}
          onChange={(e) => {
            if (!frame || !view || !limits) return;
            const level = Number(e.target.value) / 1000;
            setView(zoomView(view, limits.min + level * (limits.max - limits.min), frame));
          }}
          className="w-full accent-quake"
        />
        <button
          type="button"
          aria-label={labels.zoomIn}
          onClick={() => frame && view && setView(zoomView(view, view.scale * 1.2, frame))}
          className="grid size-9 shrink-0 place-items-center rounded-full border border-ink/20 text-lg dark:border-paper/20"
        >
          +
        </button>
      </div>
    </Sheet>
  );
}
