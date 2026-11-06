'use client';

import { Button, useT } from '@devquake/ui';
import { callApi } from './call-api';
import { ErrorText } from './ui';
import { useAction } from './use-action';

/** Try the app with a demo group full of sample data (one per person, then reopened). */
export function DemoButton() {
  const t = useT('home.demo');
  const { busy, error, act, router } = useAction();
  return (
    <div className="rounded-xl border border-dashed border-amber-500/60 p-4">
      <p className="text-sm text-ink/70 dark:text-paper/70">{t('intro')}</p>
      <Button
        type="button"
        variant="secondary"
        className="mt-3"
        disabled={busy}
        onClick={() =>
          act(
            async () => {
              const res = await callApi<{ id: number }>('/demo', 'POST', {});
              if (res) router.push(`/groups/${res.id}`);
            },
            { success: t('created'), after: () => undefined },
          )
        }
      >
        {busy ? t('creating') : t('create')}
      </Button>
      <ErrorText>{error}</ErrorText>
    </div>
  );
}
