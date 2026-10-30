'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useT } from '@devquake/ui';
import { TIP_MODES, formatMinor, type TipMode, type TipSettings } from '../lib/model';
import { call, errorText, fieldClass, primaryButton } from './client';
import { Status } from './status';

/**
 * Tips on the bill (the owner's choice): off, a few percentages of the bill before VAT for the
 * guest to pick (15, 20 and 25 % to start with), or a fixed tip.
 */
export function TipSettingsForm({
  tips,
  currency,
  decimals,
}: {
  tips: TipSettings;
  currency: string;
  decimals: number;
}) {
  const t = useT('tipsForm');
  const router = useRouter();
  const [tipMode, setTipMode] = useState<TipMode>(tips.tipMode);
  const [tipPercents, setTipPercents] = useState(tips.tipPercents.map((p) => p / 100).join(', '));
  const [tipFixed, setTipFixed] = useState(
    tips.tipFixedMinor ? formatMinor(tips.tipFixedMinor, decimals) : '',
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  async function save() {
    setBusy(true);
    setMessage(null);
    try {
      await call('/api/tips', 'PUT', { tipMode, tipPercents, tipFixed }, t('failed'));
      setMessage({ text: t('saved'), ok: true });
      router.refresh();
    } catch (err) {
      setMessage({ text: errorText(err, t('failed')), ok: false });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
      className="space-y-3"
    >
      <fieldset className="space-y-1">
        <legend className="text-sm font-medium">{t('mode')}</legend>
        {TIP_MODES.map((m) => (
          <label key={m} className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="tipMode"
              value={m}
              checked={tipMode === m}
              onChange={() => setTipMode(m)}
            />
            {t(`modes.${m}`)}
          </label>
        ))}
      </fieldset>
      {tipMode === 'percent' ? (
        <label className="block text-sm font-medium">
          {t('percents')}
          <input
            value={tipPercents}
            onChange={(e) => setTipPercents(e.target.value)}
            required
            placeholder="15, 20, 25"
            className={fieldClass}
          />
          <span className="mt-1 block font-normal text-ink/60 dark:text-paper/60">
            {t('percentsHint')}
          </span>
        </label>
      ) : null}
      {tipMode === 'fixed' ? (
        <label className="block text-sm font-medium">
          {t('fixed', { currency })}
          <input
            value={tipFixed}
            onChange={(e) => setTipFixed(e.target.value)}
            required
            inputMode="decimal"
            placeholder={decimals ? '2.00' : '500'}
            className={fieldClass}
          />
        </label>
      ) : null}
      <p className="text-sm text-ink/60 dark:text-paper/60">{t('note')}</p>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={busy} className={primaryButton}>
          {t('save')}
        </button>
        <Status message={message} />
      </div>
    </form>
  );
}
