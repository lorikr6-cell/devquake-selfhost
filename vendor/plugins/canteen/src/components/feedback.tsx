'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { Button, Sheet, cn, useT } from '@devquake/ui';

/**
 * The app's feedback: short notifications ("Tournament settings saved") and confirmation
 * dialogs ("Delete this game?") instead of the browser's alert/confirm. Notifications render on
 * <body> at the bottom of the screen, above the score entry's buttons, and disappear by
 * themselves; dialogs use `Sheet` (fits and scrolls on every screen).
 */

export type ToastTone = 'success' | 'error' | 'info';

export interface ConfirmOptions {
  title: string;
  body?: string;
  confirmLabel: string;
  /** A red button, for deleting and removing. */
  danger?: boolean;
}

interface Feedback {
  toast: (message: string, tone?: ToastTone) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const FeedbackContext = createContext<Feedback | null>(null);

const TOAST_MS = 3500;

interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
}

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [dialog, setDialog] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((ok: boolean) => void) | null>(null);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, tone: ToastTone = 'success') => {
      const id = nextId.current++;
      // At most three at a time; the oldest goes first.
      setToasts((list) => [...list.slice(-2), { id, message, tone }]);
      setTimeout(() => dismiss(id), TOAST_MS);
    },
    [dismiss],
  );

  const confirm = useCallback((options: ConfirmOptions) => {
    resolver.current?.(false);
    setDialog(options);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const answer = useCallback((ok: boolean) => {
    resolver.current?.(ok);
    resolver.current = null;
    setDialog(null);
  }, []);
  const cancel = useCallback(() => answer(false), [answer]);

  return (
    <FeedbackContext.Provider value={{ toast, confirm }}>
      {children}
      <ConfirmDialog options={dialog} onCancel={cancel} onConfirm={() => answer(true)} />
      <Toasts toasts={toasts} onDismiss={dismiss} />
    </FeedbackContext.Provider>
  );
}

/** toast(message, tone) and confirm({ title, body, confirmLabel, danger }) → Promise<boolean>. */
export function useFeedback(): Feedback {
  const value = useContext(FeedbackContext);
  if (!value) throw new Error('useFeedback needs a FeedbackProvider (src/layout.tsx)');
  return value;
}

function ConfirmDialog({
  options,
  onCancel,
  onConfirm,
}: {
  options: ConfirmOptions | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const t = useT('feedback');
  const titleId = useId();
  return (
    <Sheet open={options !== null} onClose={onCancel} labelledBy={titleId}>
      {options ? (
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            {options.danger ? (
              <svg
                viewBox="0 0 24 24"
                className="mt-0.5 size-6 shrink-0 text-red-600"
                aria-hidden
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 3 2 20h20L12 3z" />
                <path d="M12 10v4M12 17h.01" />
              </svg>
            ) : null}
            <div className="min-w-0 space-y-1">
              <h2 id={titleId} className="font-display text-xl font-bold">
                {options.title}
              </h2>
              {options.body ? (
                <p className="text-sm text-ink/70 dark:text-paper/70">{options.body}</p>
              ) : null}
            </div>
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" className="min-h-11" onClick={onCancel}>
              {t('cancel')}
            </Button>
            <Button
              type="button"
              className={cn(
                'min-h-11',
                options.danger &&
                  'bg-red-700 text-white hover:bg-red-800 dark:bg-red-600 dark:text-white dark:hover:bg-red-700',
              )}
              onClick={onConfirm}
            >
              {options.confirmLabel}
            </Button>
          </div>
        </div>
      ) : null}
    </Sheet>
  );
}

function Toasts({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  const t = useT('feedback');
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[max(5.5rem,calc(env(safe-area-inset-bottom)+5rem))] z-[105] flex flex-col items-center gap-2 px-4"
    >
      <style>{`@keyframes dq-toast { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: none } }
@media (prefers-reduced-motion: reduce) { .dq-toast { animation: none !important } }`}</style>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role={toast.tone === 'error' ? 'alert' : 'status'}
          className={cn(
            'dq-toast pointer-events-auto flex max-w-md items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium shadow-lg',
            toast.tone === 'error'
              ? 'bg-red-700 text-white'
              : toast.tone === 'info'
                ? 'bg-ink text-paper dark:bg-paper dark:text-ink'
                : 'bg-green-700 text-white',
          )}
          style={{ animation: 'dq-toast .2s ease-out both' }}
        >
          <svg
            viewBox="0 0 24 24"
            className="size-5 shrink-0"
            aria-hidden
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {toast.tone === 'error' ? (
              <path d="M6 6l12 12M18 6 6 18" />
            ) : toast.tone === 'info' ? (
              <path d="M12 8h.01M11 12h1v5h1" />
            ) : (
              <path d="m5 12 5 5 9-10" />
            )}
          </svg>
          <span className="min-w-0 flex-1">{toast.message}</span>
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            aria-label={t('close')}
            className="-mr-1 rounded p-1 opacity-80 hover:opacity-100"
          >
            <svg
              viewBox="0 0 24 24"
              className="size-4"
              aria-hidden
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
      ))}
    </div>,
    document.body,
  );
}
