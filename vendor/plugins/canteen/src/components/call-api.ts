import type { Translate } from '@devquake/ui';

/**
 * Calls the app's own API (same origin) and throws an Error with the server's message (the API
 * answers in the visitor's language); `status` is set for errorMessage's fallback.
 */
export async function callApi<T = unknown>(
  path: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
  body?: unknown,
): Promise<T | null> {
  const res = await fetch(`/api${path}`, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store',
  });
  if (res.status === 204) return null;
  const data = (await res.json().catch(() => null)) as ({ error?: string } & T) | null;
  if (!res.ok) {
    throw Object.assign(new Error(data?.error ?? ''), { status: res.status });
  }
  return data;
}

/** The message to show for a failed call; `t` is useT('errors'). */
export function errorMessage(err: unknown, t: Translate): string {
  if (err instanceof Error && err.message) return err.message;
  const status = (err as { status?: number } | null)?.status;
  return status ? t('generic', { status }) : t('genericShort');
}
