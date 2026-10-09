'use client';

import { useEffect, useState } from 'react';
import { cn } from './cn';
import {
  DEFAULT_SHARE_NETWORKS,
  SOCIAL_NAMES,
  campaignUrl,
  shareUrl,
  type SocialNetwork,
} from './share';

export interface ShareButtonsLabels {
  /** "Share", before the buttons; empty to leave it out. */
  title: string;
  /** The device's own share menu (phones), e.g. "More…". */
  more: string;
  copy: string;
  copied: string;
  /** Accessible name of a network button with `{network}`, e.g. "Share on {network}". */
  on: string;
}

const buttonClass =
  'inline-flex min-h-9 items-center gap-1.5 rounded-full border border-ink/15 px-3 py-1.5 text-sm hover:border-ink/40 hover:bg-ink/5 focus-visible:ring-2 focus-visible:ring-quake focus-visible:outline-none dark:border-paper/20 dark:hover:border-paper/40 dark:hover:bg-paper/10';

/**
 * Share buttons for the site and every app: the device's own share menu first (on phones it
 * holds every app the person uses), a button per network that opens it with the link filled
 * in, and "Copy link". Every link carries campaign parameters (`campaign`) for the statistics.
 * Texts come from the caller, in the page language.
 */
export function ShareButtons({
  url,
  title,
  image,
  campaign,
  networks = DEFAULT_SHARE_NETWORKS,
  labels,
  copyButton = true,
  className,
}: {
  /** The absolute address to share. */
  url: string;
  /** The text that goes with it (post text, pin description). */
  title: string;
  /** A picture for Pinterest, absolute. */
  image?: string | null;
  campaign: string;
  networks?: readonly SocialNetwork[];
  labels: ShareButtonsLabels;
  /** false: no "Copy link" (the page has its own). */
  copyButton?: boolean;
  className?: string;
}) {
  const [canShare, setCanShare] = useState(false);
  const [copied, setCopied] = useState(false);
  // Copying blocked (older browsers, some in-app browsers): the link to select by hand.
  const [manual, setManual] = useState<string | null>(null);
  useEffect(() => setCanShare(typeof navigator !== 'undefined' && 'share' in navigator), []);
  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), 2500);
    return () => window.clearTimeout(id);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(campaignUrl(url, 'copy', campaign));
      setCopied(true);
    } catch {
      setManual(campaignUrl(url, 'copy', campaign));
    }
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {labels.title ? <span className="text-sm font-medium">{labels.title}</span> : null}
      {canShare ? (
        <button
          type="button"
          className={buttonClass}
          onClick={() =>
            navigator
              .share({ title, url: campaignUrl(url, 'native', campaign) })
              .catch(() => undefined)
          }
        >
          {labels.more}
        </button>
      ) : null}
      {networks.map((network) => {
        const href = shareUrl(network, { url, title, image }, { campaign });
        if (!href) return null;
        return (
          <a
            key={network}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClass}
            aria-label={labels.on.replace('{network}', SOCIAL_NAMES[network])}
          >
            {SOCIAL_NAMES[network]}
          </a>
        );
      })}
      {copyButton ? (
        <button type="button" className={buttonClass} onClick={copy} aria-live="polite">
          {copied ? labels.copied : labels.copy}
        </button>
      ) : null}
      {manual ? (
        <input
          readOnly
          value={manual}
          aria-label={labels.copy}
          onFocus={(e) => e.currentTarget.select()}
          autoFocus
          className="min-w-0 flex-1 rounded-md border border-ink/20 bg-white px-2 py-1 text-xs dark:border-paper/20 dark:bg-paper/5"
        />
      ) : null}
    </div>
  );
}
