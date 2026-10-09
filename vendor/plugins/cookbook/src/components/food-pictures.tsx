'use client';

import { useState } from 'react';
import { Button, ZoomableImage, useT } from '@devquake/ui';
import type { FoodThumb } from '../lib/food-model';
import { callApi, errorMessage } from './call-api';
import { useFeedback } from './feedback';
import { FoodThumbImage } from './food-icon';
import { Panel } from './ui';
import { useAppRouter } from './use-app-router';

export interface PictureVariant {
  id: number;
  url: string;
  /** Already in the staff member's time zone and language. */
  uploadedAt: string;
}

/**
 * Staff choose what everyone sees for a food: the drawn thumbnail (always kept) or one of the
 * pictures members uploaded (a copy is shown, so it stays if the member removes theirs).
 */
export function FoodPictures({
  foodId,
  shown,
  variants,
}: {
  foodId: string;
  /** What everyone sees now (a picture URL, or the drawn icon). */
  shown: FoodThumb;
  variants: PictureVariant[];
}) {
  const t = useT('foodAdmin');
  const tErr = useT('errors');
  const { toast } = useFeedback();
  const router = useAppRouter();
  const [busy, setBusy] = useState(false);

  async function run(call: () => Promise<unknown>, done: string) {
    setBusy(true);
    try {
      await call();
      toast(done);
      router.refresh();
    } catch (err) {
      toast(errorMessage(err, tErr), 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel className="space-y-4">
      <h2 className="font-display text-lg font-bold">{t('picturesTitle')}</h2>
      <div className="flex flex-wrap items-center gap-3">
        <FoodThumbImage thumb={shown} className="size-16 rounded-lg" />
        <p className="text-sm text-ink/70 dark:text-paper/70">
          {shown.photo ? t('showingPhoto') : t('showingIcon')}
        </p>
        {shown.photo ? (
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={() =>
              run(() => callApi(`/admin/foods/${foodId}/photo`, 'DELETE'), t('iconBack'))
            }
          >
            {t('backToIcon')}
          </Button>
        ) : null}
      </div>
      <div>
        <h3 className="text-sm font-medium">{t('variantsTitle')}</h3>
        <p className="mb-2 text-xs text-ink/60 dark:text-paper/60">{t('variantsHint')}</p>
        {variants.length === 0 ? (
          <p className="text-sm text-ink/60 dark:text-paper/60">{t('noVariants')}</p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {variants.map((v) => (
              <li key={v.id} className="space-y-1 text-xs">
                <ZoomableImage
                  src={v.url}
                  alt=""
                  className="block w-full"
                  imgClassName="aspect-square w-full rounded-lg object-cover"
                />
                <p className="text-ink/60 dark:text-paper/60">
                  {t('uploadedAt', { date: v.uploadedAt })}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={busy}
                  onClick={() =>
                    run(
                      () => callApi(`/admin/foods/${foodId}/photo`, 'PUT', { photoId: v.id }),
                      t('photoChosen'),
                    )
                  }
                >
                  {t('useThis')}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Panel>
  );
}
