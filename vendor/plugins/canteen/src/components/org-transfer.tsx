'use client';

import { useRef } from 'react';
import { Button, useT } from '@devquake/ui';
import { useFeedback } from './feedback';
import { useAction } from './use-action';

/**
 * Organisers: download the organisation as an Excel file, or upload a changed one. Uploading
 * overwrites data without a backup, so it asks first and says so plainly.
 */
export function OrgTransfer({ orgId }: { orgId: number }) {
  const t = useT();
  const input = useRef<HTMLInputElement>(null);
  const { busy, error, act, confirm } = useAction();
  const { toast } = useFeedback();

  async function upload(file: File) {
    const ok = await confirm({
      title: t('transfer.confirmTitle'),
      body: t('transfer.confirmBody', { file: file.name }),
      confirmLabel: t('transfer.confirm'),
      danger: true,
    });
    if (!ok) {
      if (input.current) input.current.value = '';
      return;
    }
    let summary = '';
    const saved = await act(async () => {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`/api/orgs/${orgId}/import`, { method: 'POST', body: form });
      const data = (await res.json().catch(() => null)) as {
        error?: string;
        updated?: number;
        added?: number;
      } | null;
      if (!res.ok) throw new Error(data?.error ?? t('errors.generic', { status: res.status }));
      summary = t('transfer.done', { updated: data?.updated ?? 0, added: data?.added ?? 0 });
    });
    if (input.current) input.current.value = '';
    if (saved && summary) toast(summary);
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-ink/60 dark:text-paper/60">{t('transfer.intro')}</p>
      <a
        href={`/api/orgs/${orgId}/export`}
        className="inline-block rounded-md border border-ink/20 px-3 py-1.5 text-sm hover:bg-ink/5 dark:border-paper/20 dark:hover:bg-paper/10"
      >
        {t('transfer.export')}
      </a>
      <div>
        <input
          ref={input}
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void upload(file);
          }}
        />
        <Button
          type="button"
          variant="ghost"
          disabled={busy}
          onClick={() => input.current?.click()}
        >
          {busy ? t('transfer.uploading') : t('transfer.upload')}
        </Button>
      </div>
      <p className="text-xs text-red-800 dark:text-red-300">{t('transfer.warning')}</p>
      {error ? (
        <p role="alert" className="text-sm whitespace-pre-line text-red-700 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
