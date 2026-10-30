'use client';

/** Opens the browser's print dialog. */
export function PrintButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-md bg-quake px-4 py-2 font-medium text-white"
    >
      🖨️ {label}
    </button>
  );
}
