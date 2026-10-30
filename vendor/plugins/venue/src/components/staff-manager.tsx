'use client';

import { useState } from 'react';
import { useT } from '@devquake/ui';
import { STAFF_ROLES, type StaffRole } from '../lib/model';
import { call, dangerLink, errorText, fieldClass, primaryButton } from './client';
import { Status } from './status';

interface StaffMember {
  id: number;
  name: string;
  role: StaffRole;
  hasPin: boolean;
}

/** Staff with their roles and PINs (ADR 0080): a PIN is typed here once and never shown again. */
export function StaffManager({ initial }: { initial: StaffMember[] }) {
  const t = useT('staff');
  const [staff, setStaff] = useState(initial);
  const [name, setName] = useState('');
  const [role, setRole] = useState<StaffRole>('waiter');
  const [pin, setPin] = useState('');
  const [newPin, setNewPin] = useState<{ id: number; pin: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  async function run(url: string, method: 'POST' | 'PUT' | 'DELETE', body: unknown, ok: string) {
    setBusy(true);
    setMessage(null);
    try {
      const data = await call<{ staff: StaffMember[] }>(url, method, body, t('failed'));
      setStaff(data.staff);
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
      {staff.length ? (
        <ul className="divide-y divide-ink/10 rounded-lg border border-ink/10 dark:divide-paper/10 dark:border-paper/10">
          {staff.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center gap-3 p-3">
              <span className="font-medium">{s.name}</span>
              <span className="text-sm text-ink/70 dark:text-paper/70">{t(`roles.${s.role}`)}</span>
              <span className="text-sm text-ink/60 dark:text-paper/60">
                {s.hasPin ? t('pinSet') : t('noPin')}
              </span>
              <span className="ml-auto flex flex-wrap items-center gap-3">
                {newPin?.id === s.id ? (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (
                        await run(`/api/staff/${s.id}`, 'PUT', { pin: newPin.pin }, t('pinSaved'))
                      )
                        setNewPin(null);
                    }}
                    className="flex items-center gap-2"
                  >
                    <input
                      value={newPin.pin}
                      onChange={(e) => setNewPin({ id: s.id, pin: e.target.value })}
                      inputMode="numeric"
                      autoComplete="off"
                      maxLength={6}
                      aria-label={t('pin')}
                      className="w-24 rounded-md border border-ink/20 bg-white px-2 py-1 dark:border-paper/20 dark:bg-zinc-900"
                    />
                    <button type="submit" disabled={busy} className="text-sm underline">
                      {t('savePin')}
                    </button>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setNewPin({ id: s.id, pin: '' })}
                    className="text-sm underline"
                  >
                    {t('changePin')}
                  </button>
                )}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    if (window.confirm(t('removeConfirm', { name: s.name })))
                      void run(`/api/staff/${s.id}`, 'DELETE', undefined, t('removed'));
                  }}
                  className={dangerLink}
                >
                  {t('remove')}
                </button>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-ink/70 dark:text-paper/70">{t('empty')}</p>
      )}
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (await run('/api/staff', 'POST', { name, role, pin }, t('added'))) {
            setName('');
            setPin('');
          }
        }}
        className="grid gap-3 rounded-lg border border-ink/10 p-4 sm:grid-cols-3 dark:border-paper/10"
      >
        <h2 className="font-semibold sm:col-span-3">{t('new')}</h2>
        <label className="text-sm font-medium">
          {t('name')}
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={80}
            className={fieldClass}
          />
        </label>
        <label className="text-sm font-medium">
          {t('role')}
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as StaffRole)}
            className={fieldClass}
          >
            {STAFF_ROLES.map((r) => (
              <option key={r} value={r}>
                {t(`roles.${r}`)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium">
          {t('pin')}
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            required
            inputMode="numeric"
            autoComplete="off"
            maxLength={6}
            className={fieldClass}
          />
        </label>
        <p className="text-sm text-ink/60 sm:col-span-3 dark:text-paper/60">{t('pinHint')}</p>
        <div className="flex flex-wrap items-center gap-3 sm:col-span-3">
          <button type="submit" disabled={busy} className={primaryButton}>
            {t('add')}
          </button>
        </div>
      </form>
      <Status message={message} />
    </div>
  );
}
