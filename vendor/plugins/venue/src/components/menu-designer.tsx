'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Link, useT } from '@devquake/ui';
import {
  BG_MAX_BYTES,
  DESIGN_FONTS,
  FORMATS,
  formatSize,
  DESIGN_FONT_STACK,
  DESIGN_PICTURES_MAX,
  PANELS,
  type MenuDesign,
} from '../lib/design';
import { ALLERGENS } from '../lib/model';
import { errorText, fieldClass, primaryButton } from './client';
import { MenuSheet, type SheetMenu } from './menu-sheet';
import { Status } from './status';

/** A picture placed on the page: its centre (% of the page) and width (% of the page width). */
interface Layer {
  id: number;
  url: string;
  image: HTMLImageElement;
  x: number;
  y: number;
  width: number;
}

const loadImage = (url: string) =>
  new Promise<HTMLImageElement>((done, fail) => {
    const img = new Image();
    img.onload = () => done(img);
    img.onerror = fail;
    img.src = url;
  });

/**
 * Designing the printable menu: up to 5 pictures placed by dragging and sized with a slider,
 * over the current background (kept or not), with the menu's texts on top. Saving flattens the
 * pictures into ONE background picture (A4 at 150 dpi) in the browser and stores it.
 */
export function MenuDesigner({
  initial,
  backgroundUrl,
  menu,
}: {
  initial: MenuDesign;
  backgroundUrl: string | null;
  menu: SheetMenu;
}) {
  const t = useT('design');
  const tm = useT('menu');
  const router = useRouter();
  const [design, setDesign] = useState(initial);
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [keepBackground, setKeepBackground] = useState(backgroundUrl !== null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const page = useRef<HTMLDivElement>(null);
  const file = useRef<HTMLInputElement>(null);
  const drag = useRef<{ id: number; x: number; y: number; at: Layer } | null>(null);
  const set = <K extends keyof MenuDesign>(k: K, v: MenuDesign[K]) =>
    setDesign((d) => ({ ...d, [k]: v }));
  const nextId = useRef(1);

  async function addPictures(files: FileList) {
    const room = DESIGN_PICTURES_MAX - layers.length;
    const added: Layer[] = [];
    for (const f of [...files].slice(0, room)) {
      if (!/^image\/(jpeg|png|webp)$/.test(f.type)) continue;
      const url = URL.createObjectURL(f);
      try {
        const image = await loadImage(url);
        added.push({
          id: nextId.current++,
          url,
          image,
          x: 50,
          y: 30 + added.length * 10,
          width: 40,
        });
      } catch {
        URL.revokeObjectURL(url);
      }
    }
    setLayers((l) => [...l, ...added]);
    if (added.length) setSelected(added[added.length - 1]!.id);
    if (files.length > room)
      setMessage({ text: t('tooMany', { max: DESIGN_PICTURES_MAX }), ok: false });
  }

  const update = (id: number, patch: Partial<Layer>) =>
    setLayers((l) => l.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  /** Flattens the background (if kept) and the pictures into one A4 image. */
  async function flatten(): Promise<Blob> {
    const canvas = document.createElement('canvas');
    const { width: BG_WIDTH, height: BG_HEIGHT } = formatSize(design.format);
    canvas.width = BG_WIDTH;
    canvas.height = BG_HEIGHT;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, BG_WIDTH, BG_HEIGHT);
    if (keepBackground && backgroundUrl) {
      const bg = await loadImage(backgroundUrl);
      ctx.drawImage(bg, 0, 0, BG_WIDTH, BG_HEIGHT);
    }
    for (const l of layers) {
      const w = (l.width / 100) * BG_WIDTH;
      const h = (w * l.image.naturalHeight) / l.image.naturalWidth;
      ctx.drawImage(l.image, (l.x / 100) * BG_WIDTH - w / 2, (l.y / 100) * BG_HEIGHT - h / 2, w, h);
    }
    const encode = (type: string, q?: number) =>
      new Promise<Blob | null>((done) => canvas.toBlob(done, type, q));
    for (const q of [0.85, 0.72, 0.6]) {
      const webp = await encode('image/webp', q);
      if (webp?.type === 'image/webp' && webp.size <= BG_MAX_BYTES) return webp;
      if (webp?.type !== 'image/webp') break;
    }
    for (const q of [0.85, 0.7, 0.55]) {
      const jpeg = await encode('image/jpeg', q);
      if (jpeg && jpeg.size <= BG_MAX_BYTES) return jpeg;
    }
    throw new Error(t('tooLarge'));
  }

  async function save() {
    setBusy(true);
    setMessage(null);
    try {
      const pictures = layers.length > 0 || (!keepBackground && backgroundUrl !== null);
      if (pictures) {
        if (layers.length === 0) {
          const res = await fetch('/api/menu/design/background', { method: 'DELETE' });
          if (!res.ok) throw new Error(t('failed'));
        } else {
          const blob = await flatten();
          const res = await fetch('/api/menu/design/background', {
            method: 'PUT',
            headers: { 'Content-Type': blob.type },
            body: blob,
          });
          const data = (await res.json().catch(() => null)) as { error?: string } | null;
          if (!res.ok) throw new Error(data?.error || t('failed'));
        }
      }
      const res = await fetch('/api/menu/design', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(design),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(data?.error || t('failed'));
      for (const l of layers) URL.revokeObjectURL(l.url);
      setLayers([]);
      setMessage({ text: t('saved'), ok: true });
      router.refresh();
    } catch (err) {
      setMessage({ text: errorText(err, t('failed')), ok: false });
    } finally {
      setBusy(false);
    }
  }

  const current = layers.find((l) => l.id === selected) ?? null;
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div>
        <div
          ref={page}
          className="relative w-full overflow-hidden rounded-md shadow-lg"
          style={{
            aspectRatio: `${formatSize(design.format).width} / ${formatSize(design.format).height}`,
            touchAction: layers.length ? 'none' : undefined,
          }}
          onPointerMove={(e) => {
            const d = drag.current;
            const box = page.current?.getBoundingClientRect();
            if (!d || !box) return;
            update(d.id, {
              x: Math.min(100, Math.max(0, d.at.x + ((e.clientX - d.x) * 100) / box.width)),
              y: Math.min(100, Math.max(0, d.at.y + ((e.clientY - d.y) * 100) / box.height)),
            });
          }}
          onPointerUp={() => {
            drag.current = null;
          }}
        >
          <MenuSheet
            menu={menu}
            design={design}
            backgroundUrl={keepBackground ? backgroundUrl : null}
            allergenName={(a) => tm(`allergens.${a}`)}
            soldOut={tm('soldOut')}
            className="absolute inset-0 overflow-hidden p-[6%] text-[0.62rem] sm:text-xs"
          />
          {layers.map((l) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={l.id}
              src={l.url}
              alt=""
              draggable={false}
              onPointerDown={(e) => {
                e.currentTarget.parentElement?.setPointerCapture(e.pointerId);
                setSelected(l.id);
                drag.current = { id: l.id, x: e.clientX, y: e.clientY, at: l };
              }}
              className={`absolute cursor-grab select-none ${selected === l.id ? 'outline outline-2 outline-quake' : ''}`}
              style={{
                left: `${l.x}%`,
                top: `${l.y}%`,
                width: `${l.width}%`,
                transform: 'translate(-50%, -50%)',
                opacity: 0.92,
              }}
            />
          ))}
        </div>
        <p className="mt-2 text-xs text-ink/60 dark:text-paper/60">{t('previewNote')}</p>
      </div>

      <aside className="space-y-5">
        <section className="space-y-2">
          <h2 className="font-semibold">{t('pictures', { max: DESIGN_PICTURES_MAX })}</h2>
          <input
            ref={file}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            className="sr-only"
            onChange={(e) => {
              if (e.target.files) void addPictures(e.target.files);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            disabled={layers.length >= DESIGN_PICTURES_MAX}
            onClick={() => file.current?.click()}
            className="rounded-md border border-ink/20 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-paper/20"
          >
            🖼️ {t('addPicture')}
          </button>
          {backgroundUrl ? (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={keepBackground}
                onChange={(e) => setKeepBackground(e.target.checked)}
              />
              {t('keepBackground')}
            </label>
          ) : null}
          {current ? (
            <div className="space-y-2 rounded-lg border border-ink/10 p-3 text-sm dark:border-paper/10">
              <label className="block">
                {t('size')} <span className="tabular-nums">{Math.round(current.width)} %</span>
                <input
                  type="range"
                  min={5}
                  max={150}
                  value={current.width}
                  onChange={(e) => update(current.id, { width: Number(e.target.value) })}
                  className="block w-full accent-quake"
                />
              </label>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className="underline"
                  onClick={() =>
                    setLayers((l) => [...l.filter((x) => x.id !== current.id), current])
                  }
                >
                  {t('toFront')}
                </button>
                <button
                  type="button"
                  className="text-red-700 underline dark:text-red-400"
                  onClick={() => {
                    URL.revokeObjectURL(current.url);
                    setLayers((l) => l.filter((x) => x.id !== current.id));
                    setSelected(null);
                  }}
                >
                  {t('removePicture')}
                </button>
              </div>
            </div>
          ) : layers.length ? (
            <p className="text-xs text-ink/60 dark:text-paper/60">{t('dragHint')}</p>
          ) : null}
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold">{t('format')}</h2>
          <div className="grid grid-cols-5 gap-2" role="radiogroup" aria-label={t('format')}>
            {FORMATS.map((f) => {
              // Each choice drawn to scale in a 40 px box.
              const scale = 40 / Math.max(f.w, f.h);
              return (
                <button
                  key={f.id}
                  type="button"
                  role="radio"
                  aria-checked={design.format === f.id}
                  title={f.id === 'a4' ? 'A4' : f.id}
                  onClick={() => set('format', f.id)}
                  className={`flex flex-col items-center gap-1 rounded-md border p-1.5 text-xs ${
                    design.format === f.id
                      ? 'border-quake ring-2 ring-quake'
                      : 'border-ink/15 dark:border-paper/20'
                  }`}
                >
                  <span className="flex h-10 w-10 items-center justify-center">
                    <span
                      className="block rounded-sm border-2 border-current"
                      style={{ width: f.w * scale, height: f.h * scale }}
                    />
                  </span>
                  {f.id === 'a4' ? 'A4' : f.id}
                </button>
              );
            })}
          </div>
          {design.format !== initial.format && backgroundUrl ? (
            <p className="text-xs text-ink/60 dark:text-paper/60">{t('formatChanged')}</p>
          ) : null}
        </section>

        <section className="space-y-3">
          <h2 className="font-semibold">{t('texts')}</h2>
          <label className="block text-sm font-medium">
            {t('title')}
            <input
              value={design.title}
              onChange={(e) => set('title', e.target.value)}
              maxLength={80}
              placeholder={menu.name}
              className={fieldClass}
            />
          </label>
          <label className="block text-sm font-medium">
            {t('subtitle')}
            <input
              value={design.subtitle}
              onChange={(e) => set('subtitle', e.target.value)}
              maxLength={120}
              className={fieldClass}
            />
          </label>
          <label className="block text-sm font-medium">
            {t('font')}
            <select
              value={design.font}
              onChange={(e) => set('font', e.target.value as MenuDesign['font'])}
              className={fieldClass}
              style={{ fontFamily: DESIGN_FONT_STACK[design.font] }}
            >
              {DESIGN_FONTS.map((f) => (
                <option key={f} value={f} style={{ fontFamily: DESIGN_FONT_STACK[f] }}>
                  {t(`fonts.${f}`)}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            {(['textColor', 'accentColor'] as const).map((k) => (
              <label key={k} className="text-sm font-medium">
                {t(k)}
                <input
                  type="color"
                  value={design[k]}
                  onChange={(e) => set(k, e.target.value)}
                  className="mt-1 block h-10 w-full rounded-md border border-ink/20"
                />
              </label>
            ))}
          </div>
          <label className="block text-sm font-medium">
            {t('panel')}
            <select
              value={design.panel}
              onChange={(e) => set('panel', e.target.value as MenuDesign['panel'])}
              className={fieldClass}
            >
              {PANELS.map((p) => (
                <option key={p} value={p}>
                  {t(`panels.${p}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium">
            {t('columns')}
            <select
              value={design.columns}
              onChange={(e) => set('columns', Number(e.target.value) === 2 ? 2 : 1)}
              className={fieldClass}
            >
              <option value={1}>1</option>
              <option value={2}>2</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={design.showAllergens}
              onChange={(e) => set('showAllergens', e.target.checked)}
            />
            {t('showAllergens', { count: ALLERGENS.length })}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={design.onPublic}
              onChange={(e) => set('onPublic', e.target.checked)}
            />
            {t('onPublic')}
          </label>
        </section>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => void save()}
            className={primaryButton}
          >
            {busy ? t('saving') : t('save')}
          </button>
          <Link href="/menu/print" className="text-sm underline">
            🖨️ {t('print')}
          </Link>
        </div>
        <Status message={message} />
      </aside>
    </div>
  );
}
