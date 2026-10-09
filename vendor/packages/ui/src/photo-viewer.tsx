'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from './cn';
import { useT } from './i18n-react';
import { thumbUrl } from './photo';

/**
 * A picture shown small (its thumbnail, ADR 0040) that opens in full size on tap: the original,
 * fitted to the screen, on a dark backdrop. Nothing else to do there but close it (the button,
 * Escape, or a tap anywhere). `src` is the full picture's URL.
 */
export function ZoomableImage({
  src,
  alt,
  className,
  imgClassName,
  children,
}: {
  src: string;
  alt: string;
  /** Classes of the button around the picture. */
  className?: string;
  /** Classes of the small picture. */
  imgClassName?: string;
  /** Shown instead of the default small picture (e.g. a styled avatar). */
  children?: ReactNode;
}) {
  const t = useT('common.photoViewer');
  const [open, setOpen] = useState(false);
  const close = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    close.current?.focus();
    const back = opener.current;
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', onKey);
      back?.focus();
    };
  }, [open]);

  return (
    <>
      <button
        ref={opener}
        type="button"
        onClick={() => setOpen(true)}
        aria-label={alt ? `${t('open')}: ${alt}` : t('open')}
        className={cn('cursor-zoom-in', className)}
      >
        {children ?? (
          // eslint-disable-next-line @next/next/no-img-element -- served by the app's own API
          <img src={thumbUrl(src)} alt="" loading="lazy" className={imgClassName} />
        )}
      </button>
      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={alt || t('open')}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-3"
          onClick={() => setOpen(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- served by the app's own API */}
          <img
            src={src}
            alt={alt}
            className="max-h-[calc(100dvh-1.5rem)] max-w-full rounded-md object-contain shadow-2xl"
          />
          <button
            ref={close}
            type="button"
            onClick={() => setOpen(false)}
            aria-label={t('close')}
            className="absolute top-3 right-3 grid size-11 place-items-center rounded-full bg-white/15 text-2xl text-white hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-white"
          >
            ×
          </button>
        </div>
      ) : null}
    </>
  );
}
