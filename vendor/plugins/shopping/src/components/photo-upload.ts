'use client';

import { photoUpload, type Translate } from '@devquake/ui';
import { callApi } from './call-api';

/** Shrinks and uploads a product photo with its small version (replaces the previous one); `t` is useT('errors'). */
export async function uploadPhoto(
  listId: number,
  itemId: number,
  file: File,
  t: Translate,
): Promise<void> {
  // The photo and its small version (ADR 0040).
  const body = await photoUpload(file).catch(() => {
    throw new Error(t('photoPrepare'));
  });
  const res = await fetch(`/api/lists/${listId}/items/${itemId}/photo`, { method: 'PUT', body });
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? t('photoSave', { status: res.status }));
  }
}

export function removePhoto(listId: number, itemId: number) {
  return callApi(`/lists/${listId}/items/${itemId}/photo`, 'DELETE');
}
