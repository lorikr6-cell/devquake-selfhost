import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';
import { cn } from '@devquake/ui';

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

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(fieldClass, className)} {...props} />;
}

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={cn(
        'rounded-xl border border-ink/10 bg-white/70 p-5 dark:border-paper/10 dark:bg-paper/5',
        className,
      )}
    >
      {children}
    </section>
  );
}

export function ErrorText({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="text-sm text-red-700 dark:text-red-400">
      {children}
    </p>
  );
}

export function Notice({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Panel className="mx-auto max-w-lg text-center">
      <h1 className="font-display text-2xl font-bold">{title}</h1>
      <div className="mt-3 text-sm text-ink/70 dark:text-paper/70">{children}</div>
    </Panel>
  );
}

export function PageTitle({
  title,
  intro,
  action,
}: {
  title: string;
  intro?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="font-display text-3xl font-bold">{title}</h1>
        {intro ? (
          <p className="mt-1 max-w-prose text-sm text-ink/70 dark:text-paper/70">{intro}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

/**
 * A row of mutually exclusive choices (radio buttons that look like a segmented control).
 * Keyboard: arrows move between them (native radio behaviour).
 */
export function Segmented<T extends string | number>({
  name,
  label,
  value,
  options,
  onChange,
  hint,
  className,
}: {
  name: string;
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  /** What the chosen value means; its height is reserved so the form does not jump. */
  hint?: ReactNode;
  className?: string;
}) {
  return (
    <fieldset className={cn('text-sm', className)}>
      <legend className="mb-1 font-medium">{label}</legend>
      <div className="inline-flex flex-wrap gap-1 rounded-lg border border-ink/15 p-1 dark:border-paper/15">
        {options.map((o) => (
          <label
            key={String(o.value)}
            className={cn(
              'cursor-pointer rounded-md px-3 py-1.5 font-medium transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-quake',
              o.value === value
                ? 'bg-ink text-paper dark:bg-paper dark:text-ink'
                : 'hover:bg-ink/5 dark:hover:bg-paper/10',
            )}
          >
            <input
              type="radio"
              name={name}
              className="sr-only"
              checked={o.value === value}
              onChange={() => onChange(o.value)}
            />
            {o.label}
          </label>
        ))}
      </div>
      {hint ? (
        <p
          aria-live="polite"
          className="mt-1.5 min-h-10 max-w-prose text-xs text-ink/60 dark:text-paper/60"
        >
          {hint}
        </p>
      ) : null}
    </fieldset>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="mb-3 font-display text-xl font-bold">{children}</h2>;
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <Panel>
      <p className="text-sm text-ink/70 dark:text-paper/70">{children}</p>
    </Panel>
  );
}
