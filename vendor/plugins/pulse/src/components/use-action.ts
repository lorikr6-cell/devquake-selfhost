'use client';

import { useState } from 'react';
import { useT } from '@devquake/ui';
import { errorMessage } from './call-api';
import { useAppRouter } from './use-app-router';

/** Runs an API call, then re-renders the server page (or runs `after`); keeps the error. */
export function useAction() {
  const router = useAppRouter();
  const tErr = useT('errors');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function act(change: () => Promise<unknown>, after?: () => void): Promise<boolean> {
    setBusy(true);
    setError('');
    try {
      await change();
      if (after) after();
      else router.refresh();
      return true;
    } catch (err) {
      setError(errorMessage(err, tErr));
      return false;
    } finally {
      setBusy(false);
    }
  }
  return { busy, error, setError, act, router };
}
