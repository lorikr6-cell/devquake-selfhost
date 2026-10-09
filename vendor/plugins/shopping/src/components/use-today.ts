'use client';

import { useEffect, useState } from 'react';
import { toIsoDate, type IsoDate } from '../lib/dates';

/**
 * Today's date in the visitor's own timezone. The server does not know it, so the first render
 * uses the server's guess (`fallback`) and the browser corrects it right after; it also rolls
 * over at midnight while the page is open.
 */
export function useToday(fallback: IsoDate): IsoDate {
  const [today, setToday] = useState<IsoDate>(fallback);
  useEffect(() => {
    const update = () => setToday(toIsoDate(new Date()));
    update();
    const timer = setInterval(update, 60_000);
    return () => clearInterval(timer);
  }, []);
  return today;
}
