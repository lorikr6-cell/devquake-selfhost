'use client';

import { buttonClass, useT } from '@devquake/ui';
import { CopyField } from './ui';

/** A secret key, shown this once: copy it now, it cannot be shown again. */
export function SecretReveal({ secret, onDone }: { secret: string; onDone: () => void }) {
  const t = useT('secret');
  return (
    <div
      role="status"
      className="space-y-3 rounded-xl border border-amber-500/50 bg-amber-500/10 p-4 text-sm"
    >
      <p className="font-semibold">{t('title')}</p>
      <p>{t('body')}</p>
      <CopyField value={secret} label={t('title')} />
      <button type="button" className={buttonClass('primary', 'min-h-11')} onClick={onDone}>
        {t('done')}
      </button>
    </div>
  );
}
