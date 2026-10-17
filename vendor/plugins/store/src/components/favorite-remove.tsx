'use client';

import { useAppRouter } from './use-app-router';
import { useT } from '@devquake/ui';
import { callApi, errorMessage } from './call-api';
import { useFeedback } from './feedback';
import { S } from './shop-style';

/** Takes one favourite off the list, after asking in the shop's own dialog (ADR 0064). */
export function RemoveFavorite({ slug, id, name }: { slug: string; id: number; name: string }) {
  const t = useT('favorites');
  const tErrors = useT('errors');
  const { toast, confirm } = useFeedback();
  const router = useAppRouter();
  return (
    <button
      type="button"
      className={S.buttonSecondary}
      onClick={async () => {
        const ok = await confirm({
          title: t('removeTitle', { name }),
          body: t('removeBody'),
          confirmLabel: t('remove'),
          danger: true,
        });
        if (!ok) return;
        try {
          await callApi(`/s/${slug}/favorites/${id}`, 'DELETE');
          toast(t('removed'));
          router.refresh();
        } catch (err) {
          toast(errorMessage(err, tErrors), 'error');
        }
      }}
    >
      {t('remove')}
    </button>
  );
}
