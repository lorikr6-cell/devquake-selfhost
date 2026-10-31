'use client';

import { useEffect, useState } from 'react';
import { connectBlocked, connectLabel, useT } from '@devquake/ui';
import { call, errorText, fieldClass } from './client';
import { DartsToggle, ExpensesGroup, UtilitiesChoice } from './link-pickers';
import { Status } from './status';

interface LinkedApp {
  app: string;
  name: string;
  iconUrl: string;
  benefit: string;
  state: 'connected' | 'available' | 'needs-access';
  openUrl: string;
  connectUrl: string;
  npsCost?: number;
  affordable?: boolean;
}

/** The venue's purchasing list in Shopping: chosen here, saved at once (its costs). */
function ShoppingList() {
  const t = useT('links');
  const [lists, setLists] = useState<{ id: number; name: string }[] | null>(null);
  const [chosen, setChosen] = useState<string>('');
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  useEffect(() => {
    fetch('/api/links/shopping', { cache: 'no-store' })
      .then((r) => r.json())
      .then(
        (d: { lists: { id: number; name: string }[] | null; chosen: { ref: string } | null }) => {
          setLists(d.lists ?? []);
          setChosen(d.chosen?.ref ?? '');
        },
      )
      .catch(() => setLists([]));
  }, []);
  if (lists === null) return <p className="text-sm">{t('loading')}</p>;
  return (
    <label className="block text-sm font-medium">
      {t('purchasingList')}
      <select
        value={chosen}
        onChange={async (e) => {
          const value = e.target.value;
          const before = chosen;
          setChosen(value);
          try {
            await call(
              '/api/links/shopping',
              'PUT',
              { listId: value ? Number(value) : null },
              t('failed'),
            );
            setMessage({ text: value ? t('listChosen') : t('listCleared'), ok: true });
          } catch (err) {
            setChosen(before);
            setMessage({ text: errorText(err, t('failed')), ok: false });
          }
        }}
        className={fieldClass}
      >
        <option value="">{t('noList')}</option>
        {lists.map((l) => (
          <option key={l.id} value={String(l.id)}>
            {l.name}
          </option>
        ))}
      </select>
      <span className="mt-1 block font-normal text-ink/60 dark:text-paper/60">
        {t('purchasingHint')}
      </span>
      <Status message={message} />
    </label>
  );
}

/** The apps Venue works with: why, whether connected, and what is chosen in them. */
export function Connections({ apps, dartsOn = false }: { apps: LinkedApp[]; dartsOn?: boolean }) {
  const t = useT('links');
  if (!apps.length) return <p className="text-sm">{t('none')}</p>;
  return (
    <ul className="space-y-3">
      {apps.map((a) => (
        <li
          key={a.app}
          className="flex gap-3 rounded-lg border border-ink/10 p-3 dark:border-paper/10"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={a.iconUrl} alt="" width={36} height={36} className="h-9 w-9 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-2">
            <p className="font-semibold">{a.name}</p>
            <p className="text-sm text-ink/70 dark:text-paper/70">{a.benefit}</p>
            {a.state === 'connected' ? (
              <>
                <p className="text-sm text-green-700 dark:text-green-400">✓ {t('connected')}</p>
                {a.app === 'shopping' ? <ShoppingList /> : null}
                {a.app === 'expenses' ? <ExpensesGroup /> : null}
                {a.app === 'utilities' ? <UtilitiesChoice /> : null}
                {a.app === 'darts' ? <DartsToggle initial={dartsOn} /> : null}
              </>
            ) : connectBlocked(a) ? (
              <button
                type="button"
                disabled
                className="inline-block rounded-md bg-quake px-3 py-1 text-sm font-medium text-white opacity-50"
              >
                {connectLabel(a, t('connect'))}
              </button>
            ) : (
              <a
                href={a.state === 'available' ? a.connectUrl : a.openUrl}
                className="inline-block rounded-md bg-quake px-3 py-1 text-sm font-medium text-white"
              >
                {connectLabel(a, t('connect')) ??
                  (a.state === 'available' ? t('connect') : t('getApp', { name: a.name }))}
              </a>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
