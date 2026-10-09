import type { PluginPlatformModule } from '@devquake/plugin-sdk';

/** Hooks the platform calls (ADR 0007, 0014). */

export const getStats: PluginPlatformModule['getStats'] = async ({ db }) => {
  if (!db) return [];
  const [row] = await db.query<{
    profiles: number;
    finished: number;
    playing: number;
    tournaments: number;
    running: number;
    drills: number;
  }>(
    `SELECT (SELECT COUNT(*) FROM profiles) AS profiles,
            (SELECT COUNT(*) FROM games WHERE status = 'finished') AS finished,
            (SELECT COUNT(*) FROM games WHERE status = 'playing') AS playing,
            (SELECT COUNT(*) FROM tournaments) AS tournaments,
            (SELECT COUNT(*) FROM tournaments WHERE status = 'running') AS running,
            (SELECT COUNT(*) FROM drills) AS drills`,
  );
  return [
    { label: 'Players with a profile', value: Number(row?.profiles ?? 0) },
    { label: 'Finished games', value: Number(row?.finished ?? 0) },
    { label: 'Games being played', value: Number(row?.playing ?? 0) },
    { label: 'Tournaments', value: Number(row?.tournaments ?? 0) },
    { label: 'Tournaments running', value: Number(row?.running ?? 0) },
    { label: 'Practice drills', value: Number(row?.drills ?? 0) },
  ];
};

/**
 * Removes everything the app keeps about a person, on account deletion, on unsubscribing and
 * after an unused trial: their profile and drills, their practice games, games they own that
 * nobody else played, and the tournaments they organise (players, visits, boards and matches go
 * with them). In games shared with others their name and account id are removed, so the other
 * players keep their own results, against a former player.
 */
export const deleteUserData: PluginPlatformModule['deleteUserData'] = async (userId, { db }) => {
  if (!db) {
    // Without its database the app cannot clean up; refusing keeps nothing behind.
    if (process.env.DARTS_DB_NAME) throw new Error('darts database unavailable');
    return;
  }
  await db.transaction(async (tx) => {
    await tx.execute(
      `DELETE FROM games WHERE owner_user_id = ? AND (mode = 'practice' OR status = 'waiting'
          OR NOT EXISTS (SELECT 1 FROM game_players p WHERE p.game_id = games.id
                          AND (p.user_id IS NULL OR p.user_id <> ?)))`,
      [userId, userId],
    );
    await tx.execute('UPDATE games SET owner_user_id = NULL WHERE owner_user_id = ?', [userId]);
    await tx.execute('DELETE FROM tournaments WHERE owner_user_id = ?', [userId]);
    await tx.execute('DELETE FROM drills WHERE user_id = ?', [userId]);
    await tx.execute('DELETE FROM profiles WHERE user_id = ?', [userId]);
    await tx.execute(
      "UPDATE game_players SET user_id = NULL, display_name = '' WHERE user_id = ?",
      [userId],
    );
    await tx.execute(
      "UPDATE tournament_players SET user_id = NULL, display_name = '' WHERE user_id = ?",
      [userId],
    );
  });
};

/** Housekeeping: casual games nobody joined for two weeks are removed. */
export const scheduled: PluginPlatformModule['scheduled'] = async ({ db }) => {
  if (!db) return;
  const { removeStaleGames } = await import('./lib/data/games');
  await removeStaleGames(db);
};

/** Public totals for the app's card and front page (ADR 0038): counts only, never about a person. */
export const getHighlights: PluginPlatformModule['getHighlights'] = async ({ db }) => {
  if (!db) return [];
  const [row] = await db.query<{ games: number | string; tournaments: number | string }>(
    `SELECT (SELECT COUNT(*) FROM games WHERE status = 'finished') AS games,
            (SELECT COUNT(*) FROM tournaments) AS tournaments`,
  );
  const n = (v: number | string | undefined) => Number(v ?? 0);
  return [
    {
      value: n(row?.games),
      label: {
        en: 'Finished games',
        de: 'Beendete Spiele',
        ro: 'Jocuri terminate',
        hu: 'Befejezett játék',
      },
      icon: '🎯',
    },
    {
      value: n(row?.tournaments),
      label: { en: 'Tournaments', de: 'Turniere', ro: 'Turnee', hu: 'Verseny' },
      icon: '🏆',
    },
  ];
};

/**
 * Something others still see (ADR 0042): a game they played with someone else (not practice),
 * or a place in someone else's tournament.
 */
export const hasContributions: PluginPlatformModule['hasContributions'] = async (
  userId,
  { db },
) => {
  if (!db) return false;
  const [row] = await db.query<{ n: number | string }>(
    `SELECT (EXISTS (SELECT 1 FROM game_players p JOIN games g ON g.id = p.game_id
                      WHERE p.user_id = ? AND g.mode <> 'practice'
                        AND EXISTS (SELECT 1 FROM game_players o WHERE o.game_id = g.id
                                     AND (o.user_id IS NULL OR o.user_id <> ?)))
          OR EXISTS (SELECT 1 FROM tournament_players p JOIN tournaments t ON t.id = p.tournament_id
                      WHERE p.user_id = ? AND t.owner_user_id <> ?)) AS n`,
    [userId, userId, userId, userId],
  );
  return Number(row?.n ?? 0) === 1;
};

/**
 * The account is kept as `alias` (ADR 0042): as deleteUserData, but in games and tournaments
 * with others they stay a player named by the alias, so scores and brackets stay whole.
 */
export const anonymizeUserData: PluginPlatformModule['anonymizeUserData'] = async (
  userId,
  alias,
  { db },
) => {
  if (!db) {
    if (process.env.DARTS_DB_NAME) throw new Error('darts database unavailable');
    return;
  }
  await db.transaction(async (tx) => {
    await tx.execute(
      `DELETE FROM games WHERE owner_user_id = ? AND (mode = 'practice' OR status = 'waiting'
          OR NOT EXISTS (SELECT 1 FROM game_players p WHERE p.game_id = games.id
                          AND (p.user_id IS NULL OR p.user_id <> ?)))`,
      [userId, userId],
    );
    await tx.execute('UPDATE games SET owner_user_id = NULL WHERE owner_user_id = ?', [userId]);
    await tx.execute('DELETE FROM tournaments WHERE owner_user_id = ?', [userId]);
    await tx.execute('DELETE FROM drills WHERE user_id = ?', [userId]);
    await tx.execute('DELETE FROM profiles WHERE user_id = ?', [userId]);
    await tx.execute('UPDATE game_players SET user_id = NULL, display_name = ? WHERE user_id = ?', [
      alias,
      userId,
    ]);
    await tx.execute(
      'UPDATE tournament_players SET user_id = NULL, display_name = ? WHERE user_id = ?',
      [alias, userId],
    );
  });
};
