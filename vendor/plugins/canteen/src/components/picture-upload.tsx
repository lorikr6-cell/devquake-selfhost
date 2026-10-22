'use client';

import { useId, useRef, useState } from 'react';
import { Button, photoUpload, useT } from '@devquake/ui';
import { callApi } from './call-api';
import { useFeedback } from './feedback';
import { useAppRouter } from './use-app-router';

/**
 * Take a picture with the camera or choose one from the library, shrink it in the browser and
 * upload it (stored encrypted); or remove it. `path` is the API path of the picture
 * (/orgs/:id/people/:personId/documents/photo); `what` names it in the messages ("ID card").
 */
export function PictureUpload({
  path,
  hasPicture,
  what,
}: {
  path: string;
  hasPicture: boolean;
  what: string;
}) {
  const t = useT('pictures');
  const tErr = useT('errors');
  const router = useAppRouter();
  const { toast, confirm } = useFeedback();
  const input = useRef<HTMLInputElement>(null);
  const camera = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const [busy, setBusy] = useState(false);

  async function upload(file: File) {
    setBusy(true);
    try {
      // The picture and its small version (ADR 0040).
      const body = await photoUpload(file).catch(() => {
        throw new Error(tErr('photoPrepare'));
      });
      const res = await fetch(`/api${path}`, { method: 'PUT', body });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? tErr('photoSave', { status: res.status }));
      }
      toast(t('saved', { what }));
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : tErr('genericShort'), 'error');
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
      if (camera.current) camera.current.value = '';
    }
  }

  async function remove() {
    const ok = await confirm({
      title: t('removeTitle', { what }),
      body: t('removeBody'),
      confirmLabel: t('remove'),
      danger: true,
    });
    if (!ok) return;
    setBusy(true);
    try {
      await callApi(path, 'DELETE');
      toast(t('removed', { what }));
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : tErr('genericShort'), 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      <input
        ref={input}
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
        }}
      />
      {/* Opens the camera on phones and tablets (a file chooser elsewhere). */}
      <input
        ref={camera}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
        }}
      />
      <Button
        type="button"
        variant="ghost"
        disabled={busy}
        aria-label={`${what}: ${t('take')}`}
        onClick={() => camera.current?.click()}
      >
        {t('take')}
      </Button>
      <Button
        type="button"
        variant="ghost"
        disabled={busy}
        aria-label={`${what}: ${hasPicture ? t('change') : t('add')}`}
        onClick={() => input.current?.click()}
      >
        {busy ? t('uploading') : hasPicture ? t('change') : t('add')}
      </Button>
      {hasPicture ? (
        <Button type="button" variant="ghost" disabled={busy} onClick={remove}>
          {t('remove')}
        </Button>
      ) : null}
    </span>
  );
}
