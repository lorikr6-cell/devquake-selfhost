import type { PluginPlatformModule } from '@devquake/plugin-sdk';

/** Hooks the platform calls (ADR 0007): dashboard numbers, public totals, removing a user's data. */

export const getStats: PluginPlatformModule['getStats'] = async ({ db }) => {
  if (!db) return [];
  const [row] = await db.query<{
    groups: number;
    users: number;
    expenses: number;
    payments: number;
  }>(
    `SELECT (SELECT COUNT(*) FROM expense_groups) AS groups,
            (SELECT COUNT(DISTINCT user_id) FROM group_members WHERE user_id IS NOT NULL) AS users,
            (SELECT COUNT(*) FROM expenses) AS expenses,
            (SELECT COUNT(*) FROM payments) AS payments`,
  );
  return [
    { label: 'Groups', value: Number(row?.groups ?? 0) },
    { label: 'People in groups', value: Number(row?.users ?? 0) },
    { label: 'Expenses', value: Number(row?.expenses ?? 0) },
    { label: 'Payments', value: Number(row?.payments ?? 0) },
  ];
};

/** Public totals for the app's card and front page (ADR 0038): counts only, never about a person. */
export const getHighlights: PluginPlatformModule['getHighlights'] = async ({ db }) => {
  if (!db) return [];
  const [row] = await db.query<{ groups: number | string; expenses: number | string }>(
    `SELECT (SELECT COUNT(*) FROM expense_groups) AS groups,
            (SELECT COUNT(*) FROM expenses) AS expenses`,
  );
  const n = (v: number | string | undefined) => Number(v ?? 0);
  return [
    {
      value: n(row?.groups),
      label: { en: 'Groups', de: 'Gruppen', ro: 'Grupuri', hu: 'Csoport' },
      icon: '👥',
    },
    {
      value: n(row?.expenses),
      label: {
        en: 'Shared expenses',
        de: 'Geteilte Ausgaben',
        ro: 'Cheltuieli împărțite',
        hu: 'Megosztott kiadás',
      },
      icon: '🧾',
    },
  ];
};

/**
 * Removes everything this app keeps about a user: on account deletion and when they unsubscribe.
 * Groups only they use are deleted with everything in them. In groups shared with others their
 * member record loses its account and its name (shown as "Former member"), so the others' balances stay
 * right (ADR 0055); groups they owned pass to the member with an account who joined first.
 */
export const deleteUserData: PluginPlatformModule['deleteUserData'] = async (userId, { db }) => {
  if (!db) {
    // Without its database the app cannot clean up; refusing keeps nothing behind.
    if (process.env.EXPENSES_DB_NAME) throw new Error('expenses database unavailable');
    return;
  }
  const { forgetUser } = await import('./lib/data');
  // An empty name: the app shows "Former member" in the reader's language.
  await forgetUser(db, userId, '');
};

/** Expenses, payments or comments in a group others still use (ADR 0042). */
export const hasContributions: PluginPlatformModule['hasContributions'] = async (
  userId,
  { db },
) => {
  if (!db) return false;
  const { sharesWithOthers } = await import('./lib/data');
  return sharesWithOthers(db, userId);
};

/** The account is kept as `alias` (ADR 0042): as deleteUserData, with the alias as their name. */
export const anonymizeUserData: PluginPlatformModule['anonymizeUserData'] = async (
  userId,
  alias,
  { db },
) => {
  if (!db) {
    if (process.env.EXPENSES_DB_NAME) throw new Error('expenses database unavailable');
    return;
  }
  const { forgetUser } = await import('./lib/data');
  await forgetUser(db, userId, alias);
};

/** Who brought this user into a group: they get the app free (ADR 0043). */
export const invitedBy: PluginPlatformModule['invitedBy'] = async (userId, { db }) => {
  if (!db) return null;
  const { inviterOf } = await import('./lib/data');
  return inviterOf(db, userId);
};
