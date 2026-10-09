'use client';

import {
  useState,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from 'react';
import { cn, useT } from '@devquake/ui';

// Small form primitives in the DevQuake style (docs/brand.md), shared by the app's pages.

export const fieldClass =
  'w-full rounded-md border border-ink/15 bg-white px-3 py-2 text-sm text-ink placeholder:text-ink/40 focus:border-quake focus:outline-none focus:ring-2 focus:ring-quake/30 dark:border-paper/15 dark:bg-ink dark:text-paper dark:placeholder:text-paper/40';

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn('block text-sm', className)}>
      <span className="mb-1 block font-medium">{label}</span>
      {children}
      {hint ? (
        <span className="mt-1 block text-xs text-ink/60 dark:text-paper/60">{hint}</span>
      ) : null}
    </label>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldClass, className)} {...props} />;
}

export function TextArea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldClass, 'min-h-16', className)} {...props} />;
}

export function ErrorText({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="text-sm text-red-700 dark:text-red-400">
      {children}
    </p>
  );
}

/** A switch with a label and an explanation. */
export function Toggle({
  label,
  hint,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm">
      <input
        type="checkbox"
        className="mt-0.5 size-5 shrink-0 accent-quake"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>
        <span className="block font-medium">{label}</span>
        {hint ? <span className="block text-xs text-ink/60 dark:text-paper/60">{hint}</span> : null}
      </span>
    </label>
  );
}

/** A value in monospace with a copy button. */
export function CopyField({ value, label }: { value: string; label?: string }) {
  const t = useT('common');
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-stretch gap-2">
      <code
        aria-label={label}
        className="min-w-0 flex-1 overflow-x-auto rounded-md border border-ink/15 bg-ink/5 px-3 py-2 font-mono text-xs whitespace-nowrap dark:border-paper/15 dark:bg-paper/10"
      >
        {value}
      </code>
      <button
        type="button"
        className="min-h-11 shrink-0 rounded-md border border-ink/15 px-3 text-sm hover:border-quake dark:border-paper/20"
        onClick={() => {
          void navigator.clipboard?.writeText(value).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          });
        }}
      >
        {copied ? t('copied') : t('copy')}
      </button>
    </div>
  );
}

/** A block of code (examples) with a copy button. */
export function CodeBlock({ code, label }: { code: string; label: string }) {
  const t = useT('common');
  const [copied, setCopied] = useState(false);
  return (
    <figure className="overflow-hidden rounded-lg border border-ink/10 dark:border-paper/10">
      <figcaption className="flex items-center justify-between gap-2 bg-ink/5 px-3 py-1.5 text-xs font-medium dark:bg-paper/10">
        <span>{label}</span>
        <button
          type="button"
          className="rounded px-2 py-1 hover:text-quake"
          onClick={() => {
            void navigator.clipboard?.writeText(code).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            });
          }}
        >
          {copied ? t('copied') : t('copy')}
        </button>
      </figcaption>
      <pre className="overflow-x-auto bg-white p-3 font-mono text-xs leading-relaxed dark:bg-ink">
        <code>{code}</code>
      </pre>
    </figure>
  );
}
