// Wording of list activity for the in-app notifications (pure, tested).
import type { Translate } from '@devquake/ui';

export interface ActivityEvent {
  id: number;
  listId: number;
  listName: string;
  userName: string | null;
  kind: string;
  itemName: string | null;
  /** ISO timestamp (UTC). */
  at: string;
}

const KINDS = new Set([
  'item_added',
  'item_done',
  'item_dropped',
  'item_removed',
  'price_set',
  'price_corrected',
  'photo_added',
  'member_joined',
  'member_left',
]);

/** "Ana picked up Milk". A deleted account shows as "Someone". `t` is useT('events'). */
export function describeEvent(
  e: Pick<ActivityEvent, 'kind' | 'userName' | 'itemName'>,
  t: Translate,
): string {
  const who = e.userName ?? t('someone');
  const what = e.itemName ?? t('anItem');
  return t(KINDS.has(e.kind) ? e.kind : 'other', { who, what });
}

/** "just now", "5 min ago", "3 h ago", "2 d ago". `t` is useT('events'). */
export function timeAgo(iso: string, t: Translate, now: Date = new Date()): string {
  const seconds = Math.max(0, Math.round((now.getTime() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return t('justNow');
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return t('minutes', { count: minutes });
  const hours = Math.round(minutes / 60);
  if (hours < 24) return t('hours', { count: hours });
  return t('days', { count: Math.round(hours / 24) });
}
