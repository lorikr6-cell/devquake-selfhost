import type { PluginPlatformModule } from '@devquake/plugin-sdk';

/** Hooks the platform calls (ADR 0007): dashboard numbers, public totals, removing a user's data. */

export const getStats: PluginPlatformModule['getStats'] = async ({ db }) => {
  if (!db) return [];
  const [row] = await db.query<{ orgs: number; staff: number; people: number }>(
    `SELECT (SELECT COUNT(*) FROM canteen_orgs) AS orgs,
            (SELECT COUNT(*) FROM canteen_staff) AS staff,
            (SELECT COUNT(*) FROM canteen_people WHERE status <> 'ended') AS people`,
  );
  return [
    { label: 'Organisations', value: Number(row?.orgs ?? 0) },
    { label: 'Staff', value: Number(row?.staff ?? 0) },
    { label: 'People fed', value: Number(row?.people ?? 0) },
  ];
};

/** Public totals for the app's card and front page (ADR 0038): counts only, never about a person. */
export const getHighlights: PluginPlatformModule['getHighlights'] = async ({ db }) => {
  if (!db) return [];
  const [row] = await db.query<{ orgs: number | string; people: number | string }>(
    `SELECT (SELECT COUNT(*) FROM canteen_orgs) AS orgs,
            (SELECT COUNT(*) FROM canteen_people WHERE status = 'active') AS people`,
  );
  const n = (v: number | string | undefined) => Number(v ?? 0);
  return [
    {
      value: n(row?.orgs),
      label: {
        en: 'Organisations',
        de: 'Organisationen',
        ro: 'Organizații',
        hu: 'Szervezet',
        it: 'Organizzazioni',
        es: 'Organizaciones',
      },
      icon: '🏠',
    },
    {
      value: n(row?.people),
      label: {
        en: 'People fed',
        de: 'Versorgte Menschen',
        ro: 'Persoane hrănite',
        hu: 'Étkeztetett ember',
        it: 'Persone servite',
        es: 'Personas atendidas',
      },
      icon: '🍲',
    },
  ];
};

/**
 * A staff member's account is deleted, or they unsubscribe: their staff rows go; an organisation
 * left without an organiser passes on or is deleted (forgetUser). The people the organisations
 * feed are not platform users: they are removed by the organisers in the app.
 */
export const deleteUserData: PluginPlatformModule['deleteUserData'] = async (userId, { db }) => {
  if (!db) {
    // Without its database the app cannot clean up; refusing keeps nothing behind.
    if (process.env.CANTEEN_DB_NAME) throw new Error('canteen database unavailable');
    return;
  }
  const { forgetUser } = await import('./lib/data');
  await forgetUser(db, userId);
};

/** Who brought this user into an organisation: they get the app free (ADR 0043). */
export const invitedBy: PluginPlatformModule['invitedBy'] = async (userId, { db }) => {
  if (!db) return null;
  const { inviterOf } = await import('./lib/data');
  return inviterOf(db, userId);
};
