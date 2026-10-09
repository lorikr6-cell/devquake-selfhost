'use client';

import { useEffect } from 'react';

/** Keeps the dq_tz cookie on the browser's time zone, so dates render in it (ADR 0010). */
export function TimeZoneSync() {
  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const current = document.cookie.match(/(?:^|; )dq_tz=([^;]*)/)?.[1];
      if (tz && decodeURIComponent(current ?? '') !== tz) {
        document.cookie = `dq_tz=${encodeURIComponent(tz)}; path=/; max-age=31536000; samesite=lax`;
        if (!current) window.location.reload();
      }
    } catch {
      // Old browsers: dates stay in UTC.
    }
  }, []);
  return null;
}
