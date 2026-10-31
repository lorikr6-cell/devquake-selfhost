'use client';

import { useEffect, useState } from 'react';
import { useT } from '@devquake/ui';
import { call, errorText, fieldClass } from './client';
import { Status } from './status';

type Message = { text: string; ok: boolean } | null;

/** Where the venue's costs are booked in Expenses: chosen here, saved at once. */
export function ExpensesGroup() {
  const t = useT('links');
  const [groups, setGroups] = useState<{ id: number; name: string; currency: string }[] | null>(
    null,
  );
  const [chosen, setChosen] = useState('');
  const [message, setMessage] = useState<Message>(null);
  useEffect(() => {
    fetch('/api/links/expenses', { cache: 'no-store' })
      .then((r) => r.json())
      .then(
        (d: {
          groups: { id: number; name: string; currency: string }[] | null;
          chosen: { ref: string } | null;
        }) => {
          setGroups(d.groups ?? []);
          setChosen(d.chosen?.ref ?? '');
        },
      )
      .catch(() => setGroups([]));
  }, []);
  if (groups === null) return <p className="text-sm">{t('loading')}</p>;
  return (
    <label className="block text-sm font-medium">
      {t('expensesGroup')}
      <select
        value={chosen}
        onChange={async (e) => {
          const value = e.target.value;
          const before = chosen;
          setChosen(value);
          try {
            await call(
              '/api/links/expenses',
              'PUT',
              { groupId: value ? Number(value) : null },
              t('failed'),
            );
            setMessage({ text: value ? t('groupChosen') : t('groupCleared'), ok: true });
          } catch (err) {
            setChosen(before);
            setMessage({ text: errorText(err, t('failed')), ok: false });
          }
        }}
        className={fieldClass}
      >
        <option value="">{t('noList')}</option>
        {groups.map((g) => (
          <option key={g.id} value={String(g.id)}>
            {g.name} ({g.currency})
          </option>
        ))}
      </select>
      <span className="mt-1 block font-normal text-ink/60 dark:text-paper/60">
        {t('expensesHint')}
      </span>
      <Status message={message} />
    </label>
  );
}

/** The venue's utilities (running costs): each tick saves at once and says so. */
export function UtilitiesChoice() {
  const t = useT('links');
  const [list, setList] = useState<{ id: number; name: string; currency: string }[] | null>(null);
  const [chosen, setChosen] = useState<number[]>([]);
  const [message, setMessage] = useState<Message>(null);
  useEffect(() => {
    fetch('/api/links/utilities', { cache: 'no-store' })
      .then((r) => r.json())
      .then(
        (d: {
          utilities: { id: number; name: string; currency: string }[] | null;
          chosen: number[];
        }) => {
          setList(d.utilities ?? []);
          setChosen(d.chosen ?? []);
        },
      )
      .catch(() => setList([]));
  }, []);
  if (list === null) return <p className="text-sm">{t('loading')}</p>;
  if (!list.length) return <p className="text-sm">{t('noUtilities')}</p>;
  return (
    <fieldset className="space-y-1 text-sm">
      <legend className="font-medium">{t('utilitiesTitle')}</legend>
      {list.map((u) => (
        <label key={u.id} className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={chosen.includes(u.id)}
            onChange={async (e) => {
              const before = chosen;
              const next = e.target.checked ? [...chosen, u.id] : chosen.filter((x) => x !== u.id);
              setChosen(next);
              try {
                await call('/api/links/utilities', 'PUT', { ids: next }, t('failed'));
                setMessage({
                  text: e.target.checked
                    ? t('utilityOn', { name: u.name })
                    : t('utilityOff', { name: u.name }),
                  ok: true,
                });
              } catch (err) {
                setChosen(before);
                setMessage({ text: errorText(err, t('failed')), ok: false });
              }
            }}
          />
          {u.name} ({u.currency})
        </label>
      ))}
      <Status message={message} />
    </fieldset>
  );
}

/** Show the owner's open darts tournaments on the public menu: saves at once and says so. */
export function DartsToggle({ initial }: { initial: boolean }) {
  const t = useT('links');
  const [on, setOn] = useState(initial);
  const [message, setMessage] = useState<Message>(null);
  return (
    <div className="space-y-1 text-sm">
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={on}
          onChange={async (e) => {
            const next = e.target.checked;
            setOn(next);
            try {
              const r = await call<{ tournaments: unknown[] }>(
                '/api/links/darts',
                'PUT',
                { on: next },
                t('failed'),
              );
              setMessage({
                text: next ? t('dartsOn', { count: r.tournaments.length }) : t('dartsOff'),
                ok: true,
              });
            } catch (err) {
              setOn(!next);
              setMessage({ text: errorText(err, t('failed')), ok: false });
            }
          }}
        />
        {t('dartsShow')}
      </label>
      <Status message={message} />
    </div>
  );
}

/** "Book in Expenses" for a month's purchases or utility bills (once; again adds nothing). */
export function BookButton({
  kind,
  month,
  label,
}: {
  kind: 'purchases' | 'utilities';
  month: string;
  label: string;
}) {
  const t = useT('links');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<Message>(null);
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={busy}
        className="rounded-md border border-ink/20 px-3 py-1 text-sm disabled:opacity-50 dark:border-paper/20"
        onClick={async () => {
          setBusy(true);
          setMessage(null);
          try {
            const r = await call<{
              created: boolean;
              amount: number;
              currency: string;
              group: string;
            }>('/api/links/expenses', 'POST', { kind, month }, t('failed'));
            setMessage({
              text: r.created
                ? t('booked', { amount: `${r.amount.toFixed(2)} ${r.currency}`, group: r.group })
                : t('alreadyBooked', { group: r.group }),
              ok: true,
            });
          } catch (err) {
            setMessage({ text: errorText(err, t('failed')), ok: false });
          } finally {
            setBusy(false);
          }
        }}
      >
        {label}
      </button>
      <Status message={message} />
    </span>
  );
}
