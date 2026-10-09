'use client';

import { useRef } from 'react';

/** "Remove" with the instance's own confirmation dialog (never the browser's confirm()). */
export function ConfirmRemove({
  action,
  id,
  name,
  labels,
}: {
  action: (form: FormData) => Promise<void>;
  id: number;
  name: string;
  labels: { remove: string; title: string; body: string; cancel: string };
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        className="text-xs text-red-700 underline hover:opacity-80 dark:text-red-400"
      >
        {labels.remove}
      </button>
      <dialog
        ref={dialog}
        className="m-auto max-w-sm rounded-xl bg-white p-5 text-ink shadow-xl backdrop:bg-black/40 dark:bg-ink dark:text-paper"
      >
        <h2 className="font-display text-lg font-bold">{labels.title}</h2>
        <p className="mt-2 text-sm text-ink/70 dark:text-paper/70">{labels.body}</p>
        <form action={action} className="mt-4 flex justify-end gap-2">
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="name" value={name} />
          <button
            type="button"
            onClick={() => dialog.current?.close()}
            className="rounded-md border border-ink/15 px-3 py-1.5 text-sm dark:border-paper/20"
          >
            {labels.cancel}
          </button>
          <button
            type="submit"
            className="rounded-md bg-red-700 px-3 py-1.5 text-sm font-semibold text-white hover:opacity-90"
          >
            {labels.remove}
          </button>
        </form>
      </dialog>
    </>
  );
}
