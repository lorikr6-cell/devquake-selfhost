'use client';

import { useRef, useState, type FormEvent } from 'react';
import { Button, formatDateTime, photoUpload, useLocale, useT } from '@devquake/ui';
import type { MedPaper } from '../lib/med-papers';
import { callApi } from './call-api';
import { ErrorText, Field, Input, Panel } from './ui';
import { useAction } from './use-action';

/** Discharge letters, results and prescriptions: a PDF or a photo (shrunk before upload). */
export function MedPapers({
  path,
  papers,
  timeZone,
}: {
  path: string;
  papers: MedPaper[];
  timeZone: string;
}) {
  const t = useT();
  const locale = useLocale();
  const [title, setTitle] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  const { busy, error, act, confirm } = useAction();

  async function upload(e: FormEvent) {
    e.preventDefault();
    const file = fileInput.current?.files?.[0];
    if (!file) return;
    const ok = await act(
      async () => {
        const form = new FormData();
        form.append('title', title);
        if (file.type === 'application/pdf') {
          form.append('file', file, 'paper.pdf');
        } else {
          const shrunk = (
            await photoUpload(file).catch(() => {
              throw new Error(t('errors.photoPrepare'));
            })
          ).get('photo');
          form.append('file', shrunk as Blob, 'paper.jpg');
        }
        const res = await fetch(`/api${path}`, { method: 'POST', body: form });
        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(data?.error ?? t('errors.generic', { status: res.status }));
        }
      },
      { success: t('medPapers.saved') },
    );
    if (ok) {
      setTitle('');
      if (fileInput.current) fileInput.current.value = '';
    }
  }

  async function remove(p: MedPaper) {
    const ok = await confirm({
      title: t('medPapers.removeTitle', { title: p.title }),
      body: t('medPapers.removeBody'),
      confirmLabel: t('staff.remove'),
      danger: true,
    });
    if (ok)
      await act(() => callApi(`${path}/${p.id}`, 'DELETE'), { success: t('medPapers.removed') });
  }

  return (
    <Panel>
      <h2 className="font-semibold">{t('medPapers.title')}</h2>
      <p className="mt-1 text-xs text-ink/60 dark:text-paper/60">{t('medPapers.intro')}</p>
      {papers.length ? (
        <ul className="mt-3 divide-y divide-ink/10 dark:divide-paper/10">
          {papers.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-2 py-2 text-sm">
              <a
                href={`/api${path}/${p.id}`}
                target="_blank"
                rel="noopener"
                className="min-w-0 flex-1 font-medium underline hover:text-quake"
              >
                {p.mime === 'application/pdf' ? '📄' : '🖼'} {p.title}
              </a>
              <span className="text-xs text-ink/60 dark:text-paper/60">
                {formatDateTime(p.uploadedAt, timeZone, 'date', locale)} ·{' '}
                {Math.max(1, Math.round(p.bytes / 1024))} KB
              </span>
              <Button type="button" variant="ghost" disabled={busy} onClick={() => remove(p)}>
                {t('staff.remove')}
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-ink/70 dark:text-paper/70">{t('medPapers.empty')}</p>
      )}
      <form
        onSubmit={upload}
        className="mt-4 flex flex-wrap items-end gap-3 border-t border-ink/10 pt-4 dark:border-paper/10"
      >
        <Field label={t('fields.paperTitle')} className="min-w-56 flex-1">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            required
          />
        </Field>
        <Field label={t('fields.paperFile')}>
          <input
            ref={fileInput}
            type="file"
            accept="application/pdf,image/jpeg,image/png,image/webp"
            required
            className="text-sm"
          />
        </Field>
        <Button type="submit" disabled={busy}>
          {busy ? t('pictures.uploading') : t('medPapers.upload')}
        </Button>
      </form>
      <ErrorText>{error}</ErrorText>
    </Panel>
  );
}
