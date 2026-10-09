import type { ReactNode } from 'react';
import { cn } from '@devquake/ui';

// Server-safe layout pieces.

export function Panel({
  children,
  className,
  title,
  id,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        'scroll-mt-20 rounded-xl border border-ink/10 bg-white/70 p-5 dark:border-paper/10 dark:bg-paper/5',
        className,
      )}
    >
      {title ? <h2 className="mb-3 font-display text-xl font-bold">{title}</h2> : null}
      {children}
    </section>
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
