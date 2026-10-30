'use client';

/** Calls the venue's API; the error in the visitor's language (or `fallback`) when it fails. */
export async function call<T = unknown>(
  url: string,
  method: 'POST' | 'PUT' | 'DELETE',
  body: unknown,
  fallback: string,
): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = (await res.json().catch(() => null)) as (T & { error?: string }) | null;
  if (!res.ok) throw new Error(data?.error || fallback);
  return data as T;
}

export const errorText = (err: unknown, fallback: string) =>
  err instanceof Error && err.message ? err.message : fallback;

export const fieldClass =
  'mt-1 block w-full rounded-md border border-ink/20 bg-white px-3 py-2 dark:border-paper/20 dark:bg-zinc-900';

export const primaryButton =
  'rounded-md bg-quake px-4 py-2 font-medium text-white disabled:opacity-50';

export const dangerLink = 'text-sm text-red-700 underline disabled:opacity-50 dark:text-red-400';
