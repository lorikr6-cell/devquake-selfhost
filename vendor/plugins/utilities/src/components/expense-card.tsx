'use client';

import { useState } from 'react';
import { Button, buttonClass, trackEvent, useT } from '@devquake/ui';
import { callApi, errorMessage } from './call-api';
import { useFeedback } from './feedback';
import { Field, Select } from './ui';

export interface ExpenseGroupChoice {
  id: number;
  name: string;
}

/**
 * "Add to Shared expenses" (ADR 0035, 0055): with the Shared expenses app connected, the owner
 * picks one of their groups that everyone on the bill is in; otherwise a link to connect.
 */
export function ExpenseCard({
  billId,
  groups,
  connectUrl,
  ready,
}: {
  billId: number;
  /** Groups the bill fits in, or null when the apps are not connected. */
  groups: ExpenseGroupChoice[] | null;
  connectUrl: string | null;
  /** Every share is known (meter readings are in). */
  ready: boolean;
}) {
  const t = useT('expenseLink');
  const tErr = useT('errors');
  const { toast } = useFeedback();
  const [groupId, setGroupId] = useState(groups?.[0] ? String(groups[0].id) : '');
  const [busy, setBusy] = useState(false);
  const [openUrl, setOpenUrl] = useState<string | null>(null);

  if (!groups) {
    if (!connectUrl) return null;
    return (
      <div className="space-y-2 text-sm">
        <h2 className="font-display text-lg font-semibold">{t('title')}</h2>
        <p className="text-ink/70 dark:text-paper/70">{t('connectIntro')}</p>
        <a href={connectUrl} className={buttonClass('secondary')}>
          {t('connect')}
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-3 text-sm">
      <h2 className="font-display text-lg font-semibold">{t('title')}</h2>
      <p className="text-ink/70 dark:text-paper/70">{t('intro')}</p>
      {!ready ? (
        <p className="text-amber-800 dark:text-amber-300">{t('notReady')}</p>
      ) : groups.length === 0 ? (
        <p className="text-ink/70 dark:text-paper/70">{t('noGroups')}</p>
      ) : (
        <div className="flex flex-wrap items-end gap-3">
          <Field label={t('group')} className="min-w-48 flex-1">
            <Select value={groupId} onChange={(e) => setGroupId(e.target.value)}>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </Select>
          </Field>
          <Button
            type="button"
            disabled={busy || !groupId}
            onClick={async () => {
              setBusy(true);
              try {
                const res = await callApi<{ created: boolean; url: string | null }>(
                  `/bills/${billId}/expense`,
                  'POST',
                  { groupId: Number(groupId) },
                );
                const name = groups.find((g) => String(g.id) === groupId)?.name ?? '';
                toast(res?.created ? t('added', { group: name }) : t('already', { group: name }));
                if (res?.created) trackEvent('utilities_bill_to_expenses');
                setOpenUrl(res?.url ?? null);
              } catch (err) {
                toast(errorMessage(err, tErr), 'error');
              } finally {
                setBusy(false);
              }
            }}
          >
            {t('add')}
          </Button>
          {openUrl ? (
            <a href={openUrl} className={buttonClass('secondary')}>
              {t('open')}
            </a>
          ) : null}
        </div>
      )}
    </div>
  );
}
