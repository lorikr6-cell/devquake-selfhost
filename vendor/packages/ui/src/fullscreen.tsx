'use client';

import { useEffect, useState } from 'react';
import { cn } from './cn';

// Safari (iPad) still uses the webkit-prefixed Fullscreen API.
type WebkitDocument = Document & {
  webkitFullscreenEnabled?: boolean;
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};
type WebkitElement = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void };

function fullscreenElement(): Element | null {
  const d = document as WebkitDocument;
  return d.fullscreenElement ?? d.webkitFullscreenElement ?? null;
}

/**
 * Toolbar button that shows the whole page in the browser's full screen mode, and back. Hidden
 * where the browser does not allow it (e.g. Safari on iPhone). Labels come from the page's own
 * translations; the current one is the tooltip and the accessible name.
 */
export function FullscreenButton({
  enterLabel,
  exitLabel,
  className,
}: {
  enterLabel: string;
  exitLabel: string;
  className?: string;
}) {
  const [supported, setSupported] = useState(false);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const d = document as WebkitDocument;
    setSupported(Boolean(d.fullscreenEnabled || d.webkitFullscreenEnabled));
    const sync = () => setActive(fullscreenElement() !== null);
    sync();
    document.addEventListener('fullscreenchange', sync);
    document.addEventListener('webkitfullscreenchange', sync);
    return () => {
      document.removeEventListener('fullscreenchange', sync);
      document.removeEventListener('webkitfullscreenchange', sync);
    };
  }, []);

  if (!supported) return null;

  const toggle = async () => {
    const d = document as WebkitDocument;
    const root = document.documentElement as WebkitElement;
    try {
      if (fullscreenElement()) {
        await (d.exitFullscreen ? d.exitFullscreen() : d.webkitExitFullscreen?.());
      } else {
        await (root.requestFullscreen
          ? root.requestFullscreen()
          : root.webkitRequestFullscreen?.());
      }
    } catch {
      // Refused by the browser (e.g. not started by a tap): nothing to do.
    }
  };

  const label = active ? exitLabel : enterLabel;
  return (
    <button
      type="button"
      onClick={() => void toggle()}
      aria-pressed={active}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex size-9 items-center justify-center rounded-md text-current opacity-75 transition hover:opacity-100 focus-visible:ring-2 focus-visible:ring-quake focus-visible:outline-none',
        className,
      )}
    >
      <svg
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {active ? (
          <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
        ) : (
          <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
        )}
      </svg>
    </button>
  );
}
