'use client';

import { useEffect, useRef, useState, useTransition, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from './cn';

/**
 * A setting that saves when it is ticked or unticked, without a Save button (DevQuake's rule for
 * standalone checkboxes, CLAUDE.md): the box changes at once, `onSave` stores it, and a short
 * message says what happened: switched on, switched off, or that it failed (then the box goes
 * back). Checkboxes that belong to a larger form keep the form's Save button.
 */
export function AutoCheckbox({
  checked,
  onSave,
  label,
  hint,
  messages,
  disabled,
  className,
  name,
}: {
  checked: boolean;
  /** Stores the new value; resolve with an error text (or throw) when it could not be saved. */
  onSave: (on: boolean) => Promise<string | void | null | undefined>;
  label: ReactNode;
  hint?: ReactNode;
  messages: { on: string; off: string; failed: string };
  disabled?: boolean;
  className?: string;
  /** For forms that also read the box (optional). */
  name?: string;
}) {
  const [on, setOn] = useState(checked);
  const [pending, start] = useTransition();
  const [toast, setToast] = useState<{ text: string; error: boolean; id: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    setMounted(true);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);
  useEffect(() => setOn(checked), [checked]);

  const say = (text: string, error: boolean) => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ text, error, id: Date.now() });
    timer.current = setTimeout(() => setToast(null), error ? 6000 : 3500);
  };

  const change = (next: boolean) => {
    setOn(next);
    start(async () => {
      let problem: string | null = null;
      try {
        problem = (await onSave(next)) || null;
      } catch {
        problem = messages.failed;
      }
      if (problem) {
        setOn(!next);
        say(problem, true);
      } else {
        say(next ? messages.on : messages.off, false);
      }
    });
  };

  return (
    <>
      <label className={cn('flex items-start gap-2 text-sm', className)}>
        <input
          type="checkbox"
          name={name}
          checked={on}
          disabled={disabled || pending}
          aria-busy={pending || undefined}
          onChange={(e) => change(e.target.checked)}
          className="mt-0.5 size-4 accent-quake"
        />
        <span>
          <span className="block">{label}</span>
          {hint ? (
            <span className="block text-xs text-ink/60 dark:text-paper/60">{hint}</span>
          ) : null}
        </span>
      </label>
      {mounted && toast
        ? createPortal(
            <div
              key={toast.id}
              role={toast.error ? 'alert' : 'status'}
              className={cn(
                'fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-[100] mx-auto max-w-md rounded-lg px-4 py-3 text-sm shadow-lg',
                toast.error
                  ? 'bg-red-700 text-white'
                  : 'bg-ink text-paper dark:bg-paper dark:text-ink',
              )}
            >
              {toast.text}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
