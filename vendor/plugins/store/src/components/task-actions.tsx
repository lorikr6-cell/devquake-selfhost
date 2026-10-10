'use client';

import { useState } from 'react';
import { callApi } from './call-api';
import { useAction } from './use-action';

/** A one-click action on the task board (mark shipped, publish a review…); then refreshes. */
export function QuickAction({
  path,
  method,
  body,
  label,
  done,
  refresh = false,
}: {
  path: string;
  method: 'PATCH' | 'PUT' | 'POST';
  body: unknown;
  label: string;
  /** The notification after it worked. */
  done: string;
  /** Always reload the page (otherwise the row only says it is done until the next visit). */
  refresh?: boolean;
}) {
  const { busy, act } = useAction();
  const [finished, setFinished] = useState(false);
  if (finished) return <span className="text-xs text-green-700 dark:text-green-400">✓ {done}</span>;
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        const ok = await act(() => callApi(path, method, body), {
          success: done,
          after: refresh ? undefined : () => undefined,
        });
        if (ok && !refresh) setFinished(true);
      }}
      className="rounded-full border border-ink/20 px-2.5 py-1 text-xs font-medium hover:border-quake hover:text-quake disabled:opacity-50 dark:border-paper/20"
    >
      {label}
    </button>
  );
}
