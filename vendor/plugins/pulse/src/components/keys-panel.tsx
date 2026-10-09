'use client';

import { useState } from 'react';
import { buttonClass, useT } from '@devquake/ui';
import { callApi } from './call-api';
import { SecretReveal } from './secret-reveal';
import { useAction } from './use-action';
import { CopyField, ErrorText } from './ui';

/** The public key (copy) and the secret key (only its last characters; rotate for a new one). */
export function KeysPanel({
  appId,
  publicKey,
  secretHint,
}: {
  appId: number;
  publicKey: string;
  secretHint: string;
}) {
  const t = useT('keys');
  const { busy, error, act, router } = useAction();
  const [secret, setSecret] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <p className="text-sm font-medium">{t('publicKey')}</p>
        <CopyField value={publicKey} label={t('publicKey')} />
        <p className="text-xs text-ink/60 dark:text-paper/60">{t('publicKeyHint')}</p>
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">{t('secretKey')}</p>
        {secret ? (
          <SecretReveal
            secret={secret}
            onDone={() => {
              setSecret(null);
              router.refresh();
            }}
          />
        ) : (
          <>
            <p className="font-mono text-sm">sk_…{secretHint}</p>
            <p className="text-xs text-ink/60 dark:text-paper/60">{t('secretKeyHint')}</p>
            <button
              type="button"
              disabled={busy}
              className={buttonClass('secondary', 'mt-1 min-h-11')}
              onClick={() => {
                if (!window.confirm(t('rotateConfirm'))) return;
                void act(
                  async () => {
                    const r = await callApi<{ secret: string }>(`/apps/${appId}/secret`, 'POST');
                    if (r) setSecret(r.secret);
                  },
                  () => undefined,
                );
              }}
            >
              {t('rotate')}
            </button>
          </>
        )}
        <ErrorText>{error}</ErrorText>
      </div>
    </div>
  );
}
