'use client';

import { Button, localizePath, useLocale, useT } from '@devquake/ui';
import { useRouter } from 'next/navigation';
import { callApi } from './call-api';
import { ErrorText } from './ui';
import { useAction } from './use-action';

/** Try the app with a demo organisation full of sample data (one per person). */
export function DemoButton() {
  const t = useT('demo');
  const locale = useLocale();
  const router = useRouter();
  const { busy, error, act } = useAction();
  return (
    <div className="mt-6 rounded-xl border border-dashed border-amber-500/60 p-4">
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
              if (res) router.push(localizePath(`/orgs/${res.id}`, locale));
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
