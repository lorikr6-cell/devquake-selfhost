import type { PluginLinkHandlerModule } from '@devquake/plugin-sdk';
import { translator } from '../i18n';
import { openTournamentsOf } from '../lib/data/tournaments';

/**
 * Link point "tournaments.open" (read, ADR 0035): the tournaments the member runs that are not
 * finished: name, game, status, entry fee and how many play, with the code to join, e.g. for a
 * venue's public page. No players' names leave the app.
 */
const handler: PluginLinkHandlerModule['default'] = async (_input, ctx) => {
  if (!ctx.db) return { ok: false, error: 'not-found' };
  const t = translator(ctx.locale);
  const tournaments = (await openTournamentsOf(ctx.db, ctx.user.id)).map((x) => ({
    ...x,
    gameName: t(`games.names.${x.game}`),
  }));
  return { ok: true, data: { tournaments } };
};

export default handler;
