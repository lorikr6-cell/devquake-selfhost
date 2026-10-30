'use client';

/** What happened after a save: a status, or an alert when it failed. */
export function Status({ message }: { message: { text: string; ok: boolean } | null }) {
  if (!message) return null;
  return (
    <span
      role={message.ok ? 'status' : 'alert'}
      className={message.ok ? 'text-sm' : 'text-sm text-red-700 dark:text-red-400'}
    >
      {message.text}
    </span>
  );
}
