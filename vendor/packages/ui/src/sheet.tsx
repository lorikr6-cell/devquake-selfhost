'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from './cn';

/**
 * A dialog that always fits the screen: a bottom sheet on phones, a centred box on larger
 * screens. It is rendered at the end of <body> (a portal), because toolbars with a backdrop
 * blur turn `position: fixed` into "fixed to the toolbar" and would cut it off. It is never
 * taller than the visible screen (portrait or landscape, notches included) and scrolls inside
 * when its content does not fit. Esc, the backdrop and `onClose` close it. With `header` and/or
 * `footer` (the title, the action buttons) those stay in view and only the content between them
 * scrolls, so the actions are always reachable.
 */
export function Sheet({
  open,
  onClose,
  labelledBy,
  children,
  className,
  header,
  footer,
  bodyClassName,
}: {
  open: boolean;
  onClose: () => void;
  /** id of the dialog's heading */
  labelledBy: string;
  children: ReactNode;
  className?: string;
  /** Stays at the top (e.g. the heading). */
  header?: ReactNode;
  /** Stays at the bottom (e.g. the action buttons). */
  footer?: ReactNode;
  /** Classes of the scrolling content, when there is a header or footer. */
  bodyClassName?: string;
}) {
  const fixedParts = header != null || footer != null;
  const [mounted, setMounted] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => setMounted(true), []);
  // The latest onClose, without re-running the effect below: callers often pass a new inline
  // function on every render, and re-running it moved the focus away from the field being typed
  // in after each key.
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current();
    };
    document.addEventListener('keydown', onKey);
    // The page behind does not scroll while the dialog is open.
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panel.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
    // Focus moves into the dialog once, when it opens.
  }, [open]);

  if (!open || !mounted) return null;
  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-ink/40 pt-[max(0.5rem,env(safe-area-inset-top))] sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'max-h-[calc(100dvh-max(0.5rem,env(safe-area-inset-top)))] w-full rounded-t-2xl bg-paper p-4 pr-[max(1rem,env(safe-area-inset-right))] pb-[max(1rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] text-ink shadow-xl outline-none sm:max-h-[calc(100dvh-2rem)] sm:max-w-md sm:rounded-2xl dark:bg-ink dark:text-paper',
          fixedParts ? 'flex flex-col overflow-hidden' : 'overflow-y-auto overscroll-contain',
          className,
        )}
      >
        {fixedParts ? (
          <>
            {header != null ? <div className="shrink-0 pb-3">{header}</div> : null}
            <div
              className={cn(
                '-mx-1 min-h-0 flex-1 overflow-y-auto overscroll-contain px-1',
                bodyClassName,
              )}
            >
              {children}
            </div>
            {footer != null ? (
              <div className="mt-3 shrink-0 border-t border-ink/10 pt-3 dark:border-paper/10">
                {footer}
              </div>
            ) : null}
          </>
        ) : (
          children
        )}
      </div>
    </div>,
    document.body,
  );
}
