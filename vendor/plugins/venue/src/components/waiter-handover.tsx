'use client';

import { useState } from 'react';
import { useT } from '@devquake/ui';
import { call, errorText } from './client';
import { Status } from './status';

/** Who looks after the table now, and handing it to a colleague (saved at once). */
export function WaiterHandover({ billId, initial }: { billId: number; initial: string | null }) {
  const t = useT('table');
  const [name, setName] = useState(initial);
  const [list, setList] = useState<{ id: number; name: string }[] | null>(null);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span>{name ? t('waiter', { name }) : t('noWaiter')}</span>
      {list === null ? (
        <button
          type="button"
          className="underline"
          onClick={async () => {
            const res = await fetch(`/api/floor/bills/${billId}/waiter`, { cache: 'no-store' });
            setList(
              res.ok
                ? ((await res.json()) as { waiters: { id: number; name: string }[] }).waiters
                : [],
            );
          }}
        >
          {t('handOver')}
        </button>
      ) : (
        <select
          defaultValue=""
          aria-label={t('handOver')}
          onChange={async (e) => {
            const id = Number(e.target.value);
            if (!id) return;
            try {
              const r = await call<{ waiter: { name: string } }>(
                `/api/floor/bills/${billId}/waiter`,
                'PUT',
                { staffId: id },
                t('failed'),
              );
              setName(r.waiter.name);
              setList(null);
              setMessage({ text: t('handedOver', { name: r.waiter.name }), ok: true });
            } catch (err) {
              setMessage({ text: errorText(err, t('failed')), ok: false });
            }
          }}
          className="rounded-md border border-ink/20 bg-white px-2 py-1 dark:border-paper/20 dark:bg-zinc-900"
        >
          <option value="">{t('chooseWaiter')}</option>
          {list.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
      )}
      <Status message={message} />
    </div>
  );
}
