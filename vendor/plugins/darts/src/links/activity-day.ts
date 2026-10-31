import {
  activityRange,
  localDayOf,
  utcSearchWindow,
  type ActivityFeedItem,
  type PluginLinkHandlerModule,
} from '@devquake/plugin-sdk';
import { translator } from '../i18n';
import { finishedGamesOf } from '../lib/data/games';

/**
 * Link point "activity.day" (read, ADR 0081): the darts games the member finished from `from` to
 * `to` (their own days): the game and who won, for a connected app such as the habits journal,
 * each with a link to the game.
 */
const handler: PluginLinkHandlerModule['default'] = async (input, ctx) => {
  if (!ctx.db) return { ok: false, error: 'not-found' };
  const range = activityRange(input);
  if (!range) return { ok: false, error: 'invalid-input' };
  const t = translator(ctx.locale);
  const { start, end } = utcSearchWindow(range);
  const items: ActivityFeedItem[] = [];
  for (const g of await finishedGamesOf(ctx.db, ctx.user.id, start, end)) {
    const day = localDayOf(g.finishedAt, ctx.timeZone);
    if (day < range.from || day > range.to) continue;
    items.push({
      id: `game:${g.id}`,
      day,
      icon: '🎯',
      title: t(`games.names.${g.type}`),
      detail: g.won
        ? t('result.youWon')
        : g.winner
          ? t('result.winner', { name: g.winner })
          : t('result.completed'),
      target: 'game',
      params: { id: String(g.id) },
    });
  }
  return { ok: true, data: { items } };
};

export default handler;
