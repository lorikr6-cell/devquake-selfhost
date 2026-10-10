'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';
import { useT } from '@devquake/ui';
import { gtagScript, gtmScript, metaPixelScript, type Tracking } from '../lib/tracking';
import { S } from './shop-style';

// The owner's tracking tags on the shop's pages, after the buyer's choice (ADR 0058): Google's
// tag loads with Consent Mode v2 and everything denied until the buyer accepts; Tag Manager, the
// Meta pixel and the owner's own snippets load only once they accept. The answer is kept in the
// browser per shop; "Cookie settings" in the footer asks again.

type Consent = 'granted' | 'denied';
const OPEN_EVENT = 'dq-store:open-cookie-settings';
const key = (storeId: number) => `dq-store-consent:${storeId}`;

function readConsent(storeId: number): Consent | null {
  try {
    const v = window.localStorage.getItem(key(storeId));
    return v === 'granted' || v === 'denied' ? v : null;
  } catch {
    return null;
  }
}

function writeConsent(storeId: number, value: Consent) {
  try {
    window.localStorage.setItem(key(storeId), value);
  } catch {
    // The banner asks again next time.
  }
}

/** Puts the owner's HTML into <head> or <body>; its scripts run (createContextualFragment). */
function inject(html: string, target: HTMLElement, marker: string) {
  if (document.querySelector(`[data-dq-snippet="${marker}"]`)) return;
  const holder = document.createElement('template');
  holder.setAttribute('data-dq-snippet', marker);
  target.appendChild(holder);
  target.appendChild(document.createRange().createContextualFragment(html));
}

export function ShopTracking({
  storeId,
  tracking,
  privacyUrl,
}: {
  storeId: number;
  tracking: Tracking;
  privacyUrl: string;
}) {
  const t = useT('cookies');
  const [consent, setConsent] = useState<Consent | null>(null);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const stored = readConsent(storeId);
    setConsent(stored);
    setOpen(stored === null);
    setReady(true);
    const reopen = () => setOpen(true);
    window.addEventListener(OPEN_EVENT, reopen);
    return () => window.removeEventListener(OPEN_EVENT, reopen);
  }, [storeId]);

  const granted = consent === 'granted';
  useEffect(() => {
    if (!granted) return;
    if (tracking.headSnippet) inject(tracking.headSnippet, document.head, `head-${storeId}`);
    if (tracking.bodySnippet) inject(tracking.bodySnippet, document.body, `body-${storeId}`);
  }, [granted, storeId, tracking.headSnippet, tracking.bodySnippet]);

  if (!ready) return null;

  const decide = (value: Consent) => {
    writeConsent(storeId, value);
    setConsent(value);
    setOpen(false);
    const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
    const state = value === 'granted' ? 'granted' : 'denied';
    gtag?.('consent', 'update', {
      analytics_storage: state,
      ad_storage: state,
      ad_user_data: state,
      ad_personalization: state,
    });
    // Tags already running cannot be unloaded: a reload starts without them.
    if (value === 'denied' && consent === 'granted') window.location.reload();
  };

  const google = tracking.ga4 ?? tracking.googleAds;
  return (
    <>
      {google ? (
        <>
          <Script id={`dq-store-gtag-${storeId}`} strategy="afterInteractive">
            {gtagScript(tracking, granted)}
          </Script>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${google}`}
            strategy="afterInteractive"
          />
        </>
      ) : null}
      {granted && tracking.gtm ? (
        <Script id={`dq-store-gtm-${storeId}`} strategy="afterInteractive">
          {gtmScript(tracking.gtm)}
        </Script>
      ) : null}
      {granted && tracking.metaPixel ? (
        <Script id={`dq-store-pixel-${storeId}`} strategy="afterInteractive">
          {metaPixelScript(tracking.metaPixel)}
        </Script>
      ) : null}
      {open ? (
        <div
          role="dialog"
          aria-label={t('dialog')}
          className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-xl rounded-lg border border-ink/15 bg-white p-4 text-sm text-ink shadow-lg sm:p-5 dark:border-paper/15 dark:bg-ink dark:text-paper"
        >
          <p className="font-semibold">{t('title')}</p>
          <p className="mt-1 text-ink/70 dark:text-paper/70">
            {t('body')}{' '}
            <a href={privacyUrl} className="underline underline-offset-2">
              {t('privacy')}
            </a>
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => decide('granted')} className={S.button}>
              {t('accept')}
            </button>
            <button
              type="button"
              onClick={() => decide('denied')}
              className="inline-flex min-h-11 items-center rounded-md border border-ink/20 px-4 py-2 font-medium dark:border-paper/20"
            >
              {t('decline')}
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

/** "Cookie settings" in the shop's footer: asks again. */
export function CookieSettingsLink({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="underline"
      onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))}
    >
      {label}
    </button>
  );
}
