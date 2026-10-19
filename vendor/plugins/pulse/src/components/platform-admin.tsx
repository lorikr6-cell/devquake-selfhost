'use client';

import { useState } from 'react';
import { LOCALE_TAGS, buttonClass, formatDateTime, useLocale, useT } from '@devquake/ui';
import type { PlatformInfo } from '../lib/platform-service';
import { callApi } from './call-api';
import { Panel } from './panel';
import { CopyField, ErrorText } from './ui';
import { useAction } from './use-action';

const STATUS_CLASS: Record<PlatformInfo['websiteKey'], string> = {
  current: 'border-emerald-600/40 bg-emerald-600/10',
  previous: 'border-amber-500/40 bg-amber-500/10',
  other: 'border-red-600/40 bg-red-600/10',
  missing: 'border-amber-500/40 bg-amber-500/10',
};

/**
 * DevQuake's platform service for admins (ADR 0063): its keys, its use, whether the website has
 * the current secret key, and a new secret key (shown once; confirmed in the page itself).
 */
export function PlatformAdmin({ info, timeZone }: { info: PlatformInfo; timeZone: string }) {
  const t = useT('platform');
  const locale = useLocale();
  const number = new Intl.NumberFormat(LOCALE_TAGS[locale]);
  const { busy, error, act } = useAction();
  const [confirming, setConfirming] = useState(false);
  const [secret, setSecret] = useState<string | null>(null);
  const date = (iso: string) => formatDateTime(iso, timeZone, 'datetime', locale);

  return (
    <div className="space-y-6">
      <Panel title={t('keysTitle')}>
        <div className="space-y-3">
          <CopyField value={info.publicKey} label={t('publicKey')} />
          <p className="text-sm">
            {t('secretHint', { hint: info.secretHint, date: date(info.secretRotatedAt) })}
          </p>
          <p className={`rounded-lg border p-3 text-sm ${STATUS_CLASS[info.websiteKey]}`}>
            {t(`website.${info.websiteKey}`)}
          </p>
        </div>
      </Panel>

      <Panel title={t('useTitle')}>
        <dl className="grid gap-3 sm:grid-cols-3">
          <div>
            <dt className="text-sm text-ink/70 dark:text-paper/70">{t('eventsToday')}</dt>
            <dd className="font-display text-2xl font-bold">{number.format(info.eventsToday)}</dd>
          </div>
          <div>
            <dt className="text-sm text-ink/70 dark:text-paper/70">{t('openStreams')}</dt>
            <dd className="font-display text-2xl font-bold">{number.format(info.openStreams)}</dd>
          </div>
          <div>
            <dt className="text-sm text-ink/70 dark:text-paper/70">{t('slots')}</dt>
            <dd className="font-display text-2xl font-bold">
              {t('slotsValue', { reserved: info.reservedStreams, max: info.maxStreams })}
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-sm text-ink/70 dark:text-paper/70">{t('slotsHelp')}</p>
      </Panel>

      <Panel title={t('rotateTitle')}>
        <p className="mb-3 text-sm">{t('rotateBody')}</p>
        {secret ? (
          <div className="space-y-2">
            <CopyField value={secret} label={t('newSecret')} />
            <p className="text-sm font-semibold">{t('newSecretOnce')}</p>
          </div>
        ) : confirming ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              className={buttonClass('primary')}
              onClick={() =>
                act(
                  async () => {
                    const res = await callApi<{ secret: string }>('/admin/platform', 'POST');
                    if (res) setSecret(res.secret);
                  },
                  () => setConfirming(false),
                )
              }
            >
              {t('rotateConfirm')}
            </button>
            <button
              type="button"
              disabled={busy}
              className={buttonClass('secondary')}
              onClick={() => setConfirming(false)}
            >
              {t('cancel')}
            </button>
          </div>
        ) : (
          <button
            type="button"
            className={buttonClass('secondary')}
            onClick={() => setConfirming(true)}
          >
            {t('rotate')}
          </button>
        )}
        {error ? <ErrorText>{error}</ErrorText> : null}
      </Panel>
      <p className="text-xs text-ink/60 dark:text-paper/60">
        {t('created', { date: date(info.createdAt) })}
      </p>
    </div>
  );
}
