import type { ReactNode } from 'react';
import { APP } from '@/generated/app';

/** The frame of the shell's own pages (setup, sign-in, join, instance). */
export function InstanceFrame({
  title,
  children,
  wide,
}: {
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <main className={`mx-auto px-4 py-10 sm:px-6 ${wide ? 'max-w-3xl' : 'max-w-md'}`}>
      <div className="mb-6 flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element -- the instance's own SVG icon */}
        <img src="/instance/icon.svg" alt="" className="size-10" />
        <p className="font-display text-lg font-bold">{APP.name}</p>
      </div>
      <h1 className="font-display text-2xl font-bold">{title}</h1>
      <div className="mt-4 space-y-4">{children}</div>
    </main>
  );
}

export const inputClass =
  'w-full rounded-md border border-ink/15 bg-white px-3 py-2 text-sm dark:border-paper/20 dark:bg-ink';

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {hint ? <span className="block text-xs text-ink/60 dark:text-paper/60">{hint}</span> : null}
    </label>
  );
}

export function ErrorText({ children }: { children?: ReactNode }) {
  return children ? (
    <p role="alert" className="text-sm text-red-700 dark:text-red-400">
      {children}
    </p>
  ) : null;
}
