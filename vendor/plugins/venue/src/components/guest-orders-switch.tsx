'use client';

import { AutoCheckbox, useT } from '@devquake/ui';
import { call, errorText } from './client';

/** The owner's setting: guests may order from the table; saves when ticked (rule 13). */
export function GuestOrdersSwitch({ on }: { on: boolean }) {
  const t = useT('order');
  return (
    <AutoCheckbox
      checked={on}
      label={t('settingLabel')}
      hint={t('settingHint')}
      messages={{ on: t('settingOn'), off: t('settingOff'), failed: t('failed') }}
      onSave={async (next) => {
        try {
          await call('/api/venue/guest-orders', 'PUT', { on: next }, t('failed'));
          return null;
        } catch (err) {
          return errorText(err, t('failed'));
        }
      }}
    />
  );
}
