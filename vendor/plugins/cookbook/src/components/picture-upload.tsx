'use client';

import { useId, useRef, useState } from 'react';
import { Button, photoUpload, trackEvent, useT } from '@devquake/ui';
import { callApi } from './call-api';
import { useFeedback } from './feedback';
import { useAppRouter } from './use-app-router';

/**
 * Choose a picture (camera or library), shrink it in the browser and upload it; or remove it.
 * `path` is the API path of the picture (/recipes/:id/photo). `kind` picks the texts.
 */
export function PictureUpload({
  path,
  hasPicture,
  kind,
  name,
}: {
  path: string;
  hasPicture: boolean;
  kind: 'photo';
  /** Whose photo, for screen readers. */
  name?: string;
}) {
  const t = useT('pictures');
  const tErr = useT('errors');
  const router = useAppRouter();
  const { toast, confirm } = useFeedback();
  const input = useRef<HTMLInputElement>(null);
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
      trackEvent('recipe_photo_set');
      toast(t(`${kind}.saved`));
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : tErr('genericShort'), 'error');
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  }

  async function remove() {
    const ok = await confirm({
      title: t(`${kind}.removeTitle`),
      body: t(`${kind}.removeBody`),
      confirmLabel: t(`${kind}.remove`),
      danger: true,
    });
    if (!ok) return;
    setBusy(true);
    try {
      await callApi(path, 'DELETE');
      toast(t(`${kind}.removed`));
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
      <Button
        type="button"
        variant="ghost"
        disabled={busy}
        aria-label={name ? t(`${kind}.labelFor`, { name }) : undefined}
        onClick={() => input.current?.click()}
      >
        {busy ? t('uploading') : hasPicture ? t(`${kind}.change`) : t(`${kind}.add`)}
      </Button>
      {hasPicture ? (
        <Button type="button" variant="ghost" disabled={busy} onClick={remove}>
          {t(`${kind}.remove`)}
        </Button>
      ) : null}
    </span>
  );
}
