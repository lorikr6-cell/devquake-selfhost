import type { PluginPlatformModule } from '@devquake/plugin-sdk';
import { LIBRARY } from './lib/library';

/** Hooks the platform calls (ADR 0007): dashboard numbers and removing a user's data. */

export const getStats: PluginPlatformModule['getStats'] = async ({ db }) => {
  if (!db) return [];
  const [row] = await db.query<{
    recipes: number;
    authors: number;
    shared: number;
    favourites: number;
  }>(
    `SELECT (SELECT COUNT(*) FROM recipes) AS recipes,
            (SELECT COUNT(DISTINCT owner_user_id) FROM recipes) AS authors,
            (SELECT COUNT(*) FROM recipes WHERE share_code IS NOT NULL) AS shared,
            (SELECT COUNT(*) FROM favourites) AS favourites`,
  );
  return [
    { label: 'Own recipes', value: Number(row?.recipes ?? 0) },
    { label: 'Authors', value: Number(row?.authors ?? 0) },
    { label: 'Shared recipes', value: Number(row?.shared ?? 0) },
    { label: 'Favourites', value: Number(row?.favourites ?? 0) },
  ];
};

/**
 * Removes everything this app stores about a user: on account deletion and when they
 * unsubscribe from the app. Their recipes go with their ingredients, steps, photos, share links,
 * who opened them, recommendations and comments (the database cascades); their favourites, their
 * recommendations and comments on others' recipes, their ingredient pictures and the shared
 * recipes they opened are
 * forgotten, and favourites others had of their recipes are removed. NPS points already earned
 * stay on DevQuake.
 */
export const deleteUserData: PluginPlatformModule['deleteUserData'] = async (userId, { db }) => {
  if (!db) {
    // Without its database the app cannot clean up; refusing keeps nothing behind.
    if (process.env.COOKBOOK_DB_NAME) throw new Error('cookbook database unavailable');
    return;
  }
  await db.transaction(async (tx) => {
    await tx.execute(
      `DELETE f FROM favourites f JOIN recipes r ON f.recipe_ref = CAST(r.id AS CHAR)
        WHERE r.owner_user_id = ?`,
      [userId],
    );
    await tx.execute('DELETE FROM recipes WHERE owner_user_id = ?', [userId]);
    await tx.execute('DELETE FROM recipe_access WHERE user_id = ?', [userId]);
    await tx.execute('DELETE FROM favourites WHERE user_id = ?', [userId]);
    // Their recommendations and comments on other members' public recipes (migration 0002).
    await tx.execute('DELETE FROM recipe_recommendations WHERE user_id = ?', [userId]);
    await tx.execute('DELETE FROM recipe_comments WHERE user_id = ?', [userId]);
    // Their own pictures of ingredients (migration 0004); a copy staff chose for everyone stays.
    await tx.execute('DELETE FROM food_photos WHERE user_id = ?', [userId]);
  });
};

/** Notices per run (the host runs this every few minutes). */
const NOTICES_PER_RUN = 50;

/**
 * Background work (ADR 0014, 0037):
 * - a comment on a member's public recipe reaches them as a notification and in their messages
 *   on devquake.com (no email); each comment is claimed (notified_at) before it is sent;
 * - every 100 recommendations of a recipe earn its author one NPS point, once per hundred (the
 *   host's award key "recipe:<id>:<hundreds>" makes it idempotent), with a notification.
 */
export const scheduled: PluginPlatformModule['scheduled'] = async ({ db, mail, baseUrl, nps }) => {
  if (!db) return;
  const [data, { commentEmail, pointEmail }] = await Promise.all([
    import('./lib/data'),
    import('./lib/comment-email'),
  ]);
  for (const c of await data.commentsToNotify(db, NOTICES_PER_RUN)) {
    if (!(await data.claimCommentNotice(db, c.id))) continue;
    await mail.sendToUser(
      c.ownerId,
      (locale) =>
        commentEmail(
          { recipeId: c.recipeId, title: c.title, name: c.name, body: c.body },
          locale,
          baseUrl,
        ),
      {
        notify: true,
        message: true,
        email: false,
      },
    );
  }
  if (!nps) return;
  for (const r of await data.recipesDueForPoints(db)) {
    let reached = r.milestones;
    for (let m = r.milestones + 1; m <= Math.floor(r.recommendations / 100); m++) {
      const res = await nps.award(r.ownerId, {
        points: 1,
        key: `recipe:${r.id}:${m * 100}`,
        note: `${m * 100} recommendations`,
      });
      if (!res.ok) break;
      reached = m;
      if (res.awarded) {
        await mail.sendToUser(
          r.ownerId,
          (locale) =>
            pointEmail(
              { recipeId: r.id, title: r.title, recommendations: m * 100 },
              locale,
              baseUrl,
            ),
          { notify: true, message: true },
        );
      }
    }
    if (reached > r.milestones) await data.setMilestones(db, r.id, reached);
  }
};

/** Public totals for the app's card and front page (ADR 0038): counts only, never about a person. */
export const getHighlights: PluginPlatformModule['getHighlights'] = async ({ db }) => {
  if (!db) return [];
  const [row] = await db.query<{
    public_recipes: number | string;
    recommendations: number | string;
  }>(
    `SELECT (SELECT COUNT(*) FROM recipes WHERE is_public = 1) AS public_recipes,
            (SELECT COUNT(*) FROM recipe_recommendations) AS recommendations`,
  );
  const n = (v: number | string | undefined) => Number(v ?? 0);
  return [
    {
      value: LIBRARY.length + n(row?.public_recipes),
      label: { en: 'Recipes', de: 'Rezepte', ro: 'Rețete', hu: 'Recept' },
      icon: '📖',
    },
    {
      value: n(row?.recommendations),
      label: { en: 'Recommendations', de: 'Empfehlungen', ro: 'Recomandări', hu: 'Ajánlás' },
      icon: '👍',
    },
  ];
};

/**
 * Something others still see (ADR 0042): comments or recommendations on other members' public
 * recipes.
 */
export const hasContributions: PluginPlatformModule['hasContributions'] = async (
  userId,
  { db },
) => {
  if (!db) return false;
  const [row] = await db.query<{ n: number | string }>(
    `SELECT (EXISTS (SELECT 1 FROM recipe_comments c JOIN recipes r ON r.id = c.recipe_id
                      WHERE c.user_id = ? AND r.owner_user_id <> ?)
          OR EXISTS (SELECT 1 FROM recipe_recommendations x JOIN recipes r ON r.id = x.recipe_id
                      WHERE x.user_id = ? AND r.owner_user_id <> ?)) AS n`,
    [userId, userId, userId, userId],
  );
  return Number(row?.n ?? 0) === 1;
};

/**
 * The account is kept as `alias` (ADR 0042): their own recipes, favourites, shared-recipe access
 * and ingredient pictures go, as in deleteUserData; their comments and recommendations on other
 * members' recipes stay, the comments signed with the alias.
 */
export const anonymizeUserData: PluginPlatformModule['anonymizeUserData'] = async (
  userId,
  alias,
  { db },
) => {
  if (!db) {
    if (process.env.COOKBOOK_DB_NAME) throw new Error('cookbook database unavailable');
    return;
  }
  await db.transaction(async (tx) => {
    await tx.execute(
      `DELETE f FROM favourites f JOIN recipes r ON f.recipe_ref = CAST(r.id AS CHAR)
        WHERE r.owner_user_id = ?`,
      [userId],
    );
    await tx.execute('DELETE FROM recipes WHERE owner_user_id = ?', [userId]);
    await tx.execute('DELETE FROM recipe_access WHERE user_id = ?', [userId]);
    await tx.execute('DELETE FROM favourites WHERE user_id = ?', [userId]);
    await tx.execute('DELETE FROM food_photos WHERE user_id = ?', [userId]);
    await tx.execute('UPDATE recipe_comments SET user_name = ? WHERE user_id = ?', [alias, userId]);
  });
};
