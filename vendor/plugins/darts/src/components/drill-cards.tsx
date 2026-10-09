'use client';

import { Button, trackEvent, useT } from '@devquake/ui';
import type { DrillView } from '../lib/views';
import { callApi } from './call-api';
import { optionsLine } from './game-text';
import { GameIcon } from './icons';
import { useFeedback } from './feedback';
import { ErrorText } from './ui';
import { useAction } from './use-action';

/** Drills made from the player's weak spots: play one, remove one, or make new ones. */
export function DrillCards({ drills }: { drills: DrillView[] }) {
  const t = useT('drills');
  const tAll = useT();
  const tToast = useT('toasts');
  const { toast, confirm } = useFeedback();
  const { busy, error, act, router } = useAction();
  const generate = () =>
    act(async () => {
      const res = await callApi<{ count: number }>('/drills', 'POST');
      trackEvent('drills_generated');
      toast(tToast('drillsMade', { count: res?.count ?? 0 }));
    });
  return (
    <div className="space-y-3">
      {drills.length === 0 ? (
        <p className="text-sm text-ink/70 dark:text-paper/70">{t('none')}</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {drills.map((d) => (
            <li
              key={d.id}
              className="flex gap-3 rounded-xl border border-ink/10 bg-white/70 p-4 dark:border-paper/10 dark:bg-paper/5"
            >
              <GameIcon type={d.type} className="size-10 shrink-0" />
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-quake">
                  {tAll(`skills.${d.reason}`)}
                </p>
                <p className="font-medium">{t(`titles.${d.type}`)}</p>
                <p className="text-xs text-ink/60 dark:text-paper/60">
                  {optionsLine(tAll, d.type, d.options)}
                </p>
                <p className="text-sm text-ink/70 dark:text-paper/70">{t(`why.${d.reason}`)}</p>
                <p className="text-xs text-ink/50 dark:text-paper/50">
                  {t('played', { count: d.played })}
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      act(
                        async () => {
                          const res = await callApi<{ id: number }>('/games', 'POST', {
                            mode: 'practice',
                            drillId: d.id,
                          });
                          trackEvent('drill_started', { reason: d.reason });
                          router.push(`/games/${res!.id}`);
                        },
                        () => undefined,
                      )
                    }
                  >
                    {t('play')}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={busy}
                    onClick={async () => {
                      const ok = await confirm({
                        title: t('removeConfirm'),
                        body: t('removeBody'),
                        confirmLabel: t('remove'),
                        danger: true,
                      });
                      if (!ok) return;
                      if (await act(() => callApi(`/drills/${d.id}`, 'DELETE'))) {
                        toast(tToast('drillRemoved'));
                      }
                    }}
                  >
                    {t('remove')}
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <ErrorText>{error}</ErrorText>
      <Button type="button" variant="secondary" onClick={generate} disabled={busy}>
        {drills.length ? t('regenerate') : t('generate')}
      </Button>
    </div>
  );
}
