'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * The day picked on a calendar, the same in every app: clicking a day selects it (the list
 * below shows only that day), clicking it again or changing the view (week / month / year)
 * clears it, so the list shows everything in the period again.
 */
export function useDaySelection(view: string) {
  const [selected, setSelected] = useState<string | null>(null);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setSelected(null);
  }, [view]);
  const toggle = useCallback(
    (day: string) => setSelected((current) => (current === day ? null : day)),
    [],
  );
  const clear = useCallback(() => setSelected(null), []);
  return { selected, toggle, clear };
}
