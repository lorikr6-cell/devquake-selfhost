'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { callApi } from './call-api';

const POLL_MS = 5000;

/**
 * Keeps a server-rendered screen current without reloading: every few seconds (while the tab is
 * visible, and right when it becomes visible again) it asks /api/changes whether anything on the
 * user's lists changed, and re-renders the page data if so. Tabs, calendar view and scroll
 * position stay as they are.
 */
export function LiveRefresh({ fingerprint }: { fingerprint: string }) {
  const router = useRouter();
  const known = useRef(fingerprint);

  useEffect(() => {
    known.current = fingerprint;
  }, [fingerprint]);

  useEffect(() => {
    let stopped = false;
    const check = async () => {
      if (document.visibilityState !== 'visible') return;
      const res = await callApi<{ fingerprint: string }>('/changes').catch(() => null);
      if (!stopped && res && res.fingerprint !== known.current) {
        known.current = res.fingerprint;
        router.refresh();
      }
    };
    const timer = setInterval(check, POLL_MS);
    document.addEventListener('visibilitychange', check);
    return () => {
      stopped = true;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', check);
    };
  }, [router]);

  return null;
}
