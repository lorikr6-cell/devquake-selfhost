'use client';

import { useState } from 'react';

/** A read-only value with a Copy button (an invite link). */
export function CopyField({
  value,
  labels,
}: {
  value: string;
  labels: { copy: string; copied: string };
}) {
  const [done, setDone] = useState(false);
  return (
    <div className="flex gap-2">
      <input
        readOnly
        value={value}
        onFocus={(e) => e.target.select()}
        className="min-w-0 flex-1 rounded-md border border-ink/15 bg-white px-3 py-2 font-mono text-xs dark:border-paper/20 dark:bg-ink"
      />
      <button
        type="button"
        onClick={() =>
          void navigator.clipboard.writeText(value).then(() => {
            setDone(true);
            setTimeout(() => setDone(false), 2000);
          })
        }
        className="rounded-md border border-ink/15 px-3 text-sm hover:border-quake dark:border-paper/20"
      >
        {done ? `✓ ${labels.copied}` : labels.copy}
      </button>
    </div>
  );
}
