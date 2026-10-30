'use client';

import { useState } from 'react';
import { formatDateTime, useLocale, useT } from '@devquake/ui';
import { call, dangerLink, errorText, fieldClass, primaryButton } from './client';
import { Status } from './status';

interface Tablet {
  id: number;
  name: string;
  lastUsedAt: string | null;
  createdAt: string;
}

/**
 * The venue's tablets (ADR 0080): this browser is enabled with a name, and any tablet can be
 * disabled at once (a lost or replaced one).
 */
export function TabletManager({ initial, timeZone }: { initial: Tablet[]; timeZone: string }) {
  const t = useT('tablets');
  const locale = useLocale();
  const [tablets, setTablets] = useState(initial);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  async function run(url: string, method: 'POST' | 'DELETE', body: unknown, ok: string) {
    setBusy(true);
    setMessage(null);
    try {
      const data = await call<{ tablets: Tablet[] }>(url, method, body, t('failed'));
      setTablets(data.tablets);
      setMessage({ text: ok, ok: true });
      return true;
    } catch (err) {
      setMessage({ text: errorText(err, t('failed')), ok: false });
      return false;
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {tablets.length ? (
        <ul className="divide-y divide-ink/10 rounded-lg border border-ink/10 dark:divide-paper/10 dark:border-paper/10">
          {tablets.map((tab) => (
            <li key={tab.id} className="flex flex-wrap items-center gap-3 p-3">
              <span className="font-medium">{tab.name}</span>
              <span className="text-sm text-ink/60 dark:text-paper/60">
                {t('enabledOn', {
                  date: formatDateTime(tab.createdAt, timeZone, 'date', locale),
                })}
                {' · '}
                {tab.lastUsedAt
                  ? t('lastUsed', {
                      date: formatDateTime(tab.lastUsedAt, timeZone, 'datetime', locale),
                    })
                  : t('neverUsed')}
              </span>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  if (window.confirm(t('disableConfirm', { name: tab.name })))
                    void run(`/api/tablets/${tab.id}`, 'DELETE', undefined, t('disabled'));
                }}
                className={`ml-auto ${dangerLink}`}
              >
                {t('disable')}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-ink/70 dark:text-paper/70">{t('empty')}</p>
      )}
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (await run('/api/tablets', 'POST', { name }, t('enabled'))) setName('');
        }}
        className="space-y-3 rounded-lg border border-ink/10 p-4 dark:border-paper/10"
      >
        <h2 className="font-semibold">{t('enableThis')}</h2>
        <p className="text-sm text-ink/70 dark:text-paper/70">{t('enableHint')}</p>
        <label className="block text-sm font-medium">
          {t('name')}
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={80}
            placeholder={t('namePlaceholder')}
            className={fieldClass}
          />
        </label>
        <button type="submit" disabled={busy} className={primaryButton}>
          {t('enable')}
        </button>
      </form>
      <Status message={message} />
    </div>
  );
}
