'use client';

import { useT } from '@devquake/ui';
import { Select } from './ui';
import { useAppRouter } from './use-app-router';

/** Jumps to another of the visitor's groups, on the same tab. */
export function GroupSwitch({
  current,
  groups,
  path,
}: {
  current: number;
  groups: { id: number; name: string; icon: string }[];
  /** The tab's path after /groups/:id ("", "/balances", …). */
  path: string;
}) {
  const t = useT('group');
  const router = useAppRouter();
  if (groups.length < 2) return null;
  return (
    <Select
      aria-label={t('switch')}
      title={t('switch')}
      value={current}
      className="w-auto max-w-full sm:max-w-xs"
      onChange={(e) => router.push(`/groups/${e.target.value}${path}`)}
    >
      {groups.map((g) => (
        <option key={g.id} value={g.id}>
          {`${g.icon} ${g.name}`}
        </option>
      ))}
    </Select>
  );
}
