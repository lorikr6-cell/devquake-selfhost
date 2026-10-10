'use client';

import { useRef, useState } from 'react';
import { Button, photoUpload, trackEvent, useT } from '@devquake/ui';
import { LIMITS } from '../lib/model';
import { callApi, errorMessage } from './call-api';
import { useFeedback } from './feedback';
import { useAppRouter } from './use-app-router';

/**
 * A product's photos: add (camera or library, shrunk in the browser with a small version,
 * ADR 0040), make one the main photo, remove.
 */
export function PhotoManager({ productId, photoIds }: { productId: number; photoIds: number[] }) {
  const t = useT('photos');
  const tErr = useT('errors');
  const router = useAppRouter();
  const { toast, confirm } = useFeedback();
  const library = useRef<HTMLInputElement>(null);
  const camera = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const base = `/products/${productId}/photos`;
  const full = photoIds.length >= LIMITS.photosPerProduct;

  async function upload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      for (const file of [...files].slice(0, LIMITS.photosPerProduct - photoIds.length)) {
        const body = await photoUpload(file).catch(() => {
          throw new Error(tErr('photoPrepare'));
        });
        const res = await fetch(`/api${base}`, { method: 'POST', body });
        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(data?.error ?? tErr('photoSave', { status: res.status }));
        }
      }
      trackEvent('store_photo_added');
      toast(t('added'));
      router.refresh();
    } catch (err) {
      toast(errorMessage(err, tErr), 'error');
    } finally {
      setBusy(false);
      if (library.current) library.current.value = '';
      if (camera.current) camera.current.value = '';
    }
  }

  async function run(change: () => Promise<unknown>, success: string) {
    setBusy(true);
    try {
      await change();
      toast(success);
      router.refresh();
    } catch (err) {
      toast(errorMessage(err, tErr), 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-ink/60 dark:text-paper/60">
        {t('hint', { max: LIMITS.photosPerProduct })}
      </p>
      {photoIds.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {photoIds.map((id, i) => (
            <li key={id} className="space-y-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api${base}/${id}?size=thumb&v=${id}`}
                alt=""
                className="aspect-square w-full rounded-lg object-cover"
              />
              <div className="flex flex-wrap gap-1">
                {i === 0 ? (
                  <span className="rounded-full bg-quake/10 px-2 py-1 text-xs font-semibold text-quake">
                    {t('first')}
                  </span>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={busy}
                    onClick={() => run(() => callApi(`${base}/${id}`, 'PATCH'), t('first'))}
                  >
                    {t('makeFirst')}
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  disabled={busy}
                  onClick={async () => {
                    const ok = await confirm({
                      title: t('removeTitle'),
                      body: t('removeBody'),
                      confirmLabel: t('remove'),
                      danger: true,
                    });
                    if (ok) run(() => callApi(`${base}/${id}`, 'DELETE'), t('removed'));
                  }}
                >
                  {t('remove')}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
      <input
        ref={library}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => upload(e.target.files)}
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
        onChange={(e) => upload(e.target.files)}
      />
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={busy || full}
          onClick={() => library.current?.click()}
        >
          {busy ? t('uploading') : t('add')}
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={busy || full}
          onClick={() => camera.current?.click()}
        >
          {t('take')}
        </Button>
      </div>
    </div>
  );
}
