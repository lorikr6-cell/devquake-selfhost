'use client';

import { useState } from 'react';
import { useT } from '@devquake/ui';
import { errorMessage } from './call-api';
import { useFeedback } from './feedback';
import { useAppRouter } from './use-app-router';

/**
 * Runs an API call, shows `success` as a notification, then re-renders the server page (or runs
 * `after`); keeps the error for the form and shows it as an error notification too.
 */
export function useAction() {
  const router = useAppRouter();
  const tErr = useT('errors');
  const { toast, confirm } = useFeedback();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function act(
    change: () => Promise<unknown>,
    options: { success?: string; after?: () => void } = {},
  ): Promise<boolean> {
    setBusy(true);
    setError('');
    try {
      await change();
      if (options.success) toast(options.success);
      if (options.after) options.after();
      else router.refresh();
      return true;
    } catch (err) {
      const message = errorMessage(err, tErr);
      setError(message);
      toast(message, 'error');
      return false;
    } finally {
      setBusy(false);
    }
  }
  return { busy, error, setError, act, router, confirm };
}
