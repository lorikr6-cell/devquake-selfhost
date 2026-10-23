'use client';

import { localizePath, useLocale, useT } from '@devquake/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ROLES, type Role } from '../lib/roles';
import { callApi } from './call-api';

/** "View as" in a demo organisation: its maker switches role to see each role's pages. */
export function DemoRoleSwitch({ orgId, role }: { orgId: number; role: Role }) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <label className="mt-2 inline-flex flex-wrap items-center gap-2 rounded-md bg-amber-100 px-3 py-1.5 text-sm text-amber-950 dark:bg-amber-900/60 dark:text-amber-100">
      <span className="font-medium">{t('demo.badge')}</span>
      <span>{t('demo.viewAs')}</span>
      <select
        value={role}
        disabled={busy}
        onChange={async (e) => {
          setBusy(true);
          try {
            await callApi(`/orgs/${orgId}/demo-role`, 'PUT', { role: e.target.value });
            router.push(localizePath(`/orgs/${orgId}`, locale));
            router.refresh();
          } finally {
            setBusy(false);
          }
        }}
        className="rounded border border-amber-900/30 bg-white px-2 py-0.5 dark:bg-ink"
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {t(`roles.${r}`)}
          </option>
        ))}
      </select>
    </label>
  );
}
