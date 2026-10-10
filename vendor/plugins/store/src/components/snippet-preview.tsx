'use client';

import { cn, useT } from '@devquake/ui';
import { IDEAL, clip } from '../lib/seo';

/** How a page may look in search results: address, title and description, cut where they are. */
export function SnippetPreview({
  url,
  title,
  description,
  className,
}: {
  url: string;
  title: string;
  description: string;
  className?: string;
}) {
  const t = useT('seo');
  let host = url;
  try {
    const u = new URL(url);
    host = `${u.host}${u.pathname.replace(/\//g, ' › ')}`;
  } catch {
    // Shown as typed.
  }
  return (
    <figure
      className={cn(
        'max-w-xl rounded-lg border border-ink/10 bg-white p-4 text-left font-sans dark:border-paper/10',
        className,
      )}
    >
      <figcaption className="mb-2 text-xs font-medium text-ink/60">{t('preview')}</figcaption>
      <p className="truncate text-xs text-[#202124]">{host}</p>
      <p className="truncate text-lg leading-snug text-[#1a0dab]">
        {clip(title, IDEAL.titleMax) || '…'}
      </p>
      <p className="line-clamp-2 text-sm text-[#4d5156]">
        {clip(description, IDEAL.descriptionMax) || '…'}
      </p>
    </figure>
  );
}

/** "42 / 60" under a field, red past the ideal length. */
export function LengthHint({ length, max, min }: { length: number; max: number; min: number }) {
  const t = useT('seo');
  const state = length === 0 ? 'empty' : length < min ? 'short' : length > max ? 'long' : 'good';
  return (
    <span
      className={cn(
        state === 'long' || state === 'short'
          ? 'text-amber-700 dark:text-amber-400'
          : state === 'good'
            ? 'text-green-700 dark:text-green-400'
            : '',
      )}
    >
      {t(`length.${state}`, { length, min, max })}
    </span>
  );
}
