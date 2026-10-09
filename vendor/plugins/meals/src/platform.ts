import type { PluginPlatformModule } from '@devquake/plugin-sdk';

/** Hooks the platform calls (ADR 0007): dashboard numbers, removing a user's data, reminders. */

export const getStats: PluginPlatformModule['getStats'] = async ({ db }) => {
  if (!db) return [];
  const [row] = await db.query<{
    households: number;
    users: number;
    meals: number;
    cooked: number;
  }>(
    `SELECT (SELECT COUNT(*) FROM households) AS households,
            (SELECT COUNT(DISTINCT user_id) FROM household_members) AS users,
            (SELECT COUNT(*) FROM meals) AS meals,
            (SELECT COUNT(*) FROM meals WHERE cooked = 1) AS cooked`,
  );
  return [
    { label: 'Households', value: Number(row?.households ?? 0) },
    { label: 'People planning', value: Number(row?.users ?? 0) },
    { label: 'Planned meals', value: Number(row?.meals ?? 0) },
    { label: 'Meals cooked', value: Number(row?.cooked ?? 0) },
  ];
};

/**
 * Removes everything this app stores about a user: on account deletion and when they
 * unsubscribe from the app. A household they created passes to another planner, or else another
 * member (who becomes a planner); without anyone it is deleted with its eaters, plan and invites
 * (the database cascades). Their membership is removed, their user id cleared from meals and
 * invites they made for others, and their saved meals, recommendations and comments deleted.
 */
export const deleteUserData: PluginPlatformModule['deleteUserData'] = async (userId, { db }) => {
  if (!db) {
    // Without its database the app cannot clean up; refusing keeps nothing behind.
    if (process.env.MEALS_DB_NAME) throw new Error('meals database unavailable');
    return;
  }
  await db.transaction(async (tx) => {
    await tx.execute(
      `UPDATE households h
          JOIN (SELECT household_id,
                       COALESCE(MIN(CASE WHEN role = 'planner' THEN user_id END), MIN(user_id)) AS heir
                  FROM household_members WHERE user_id <> ? GROUP BY household_id) x
            ON x.household_id = h.id
          SET h.owner_user_id = x.heir
        WHERE h.owner_user_id = ?`,
      [userId, userId],
    );
    await tx.execute(
      `UPDATE household_members m JOIN households h ON h.id = m.household_id
          SET m.role = 'planner'
        WHERE m.user_id = h.owner_user_id`,
    );
    await tx.execute('DELETE FROM households WHERE owner_user_id = ?', [userId]);
    await tx.execute('DELETE FROM household_members WHERE user_id = ?', [userId]);
    await tx.execute('UPDATE meals SET created_by = NULL WHERE created_by = ?', [userId]);
    // Their saved meals (with parts, recommendations and comments: cascade), and their
    // recommendations and comments on other members' public meals.
    await tx.execute(
      'UPDATE meals m JOIN meal_sets s ON s.id = m.set_id SET m.set_id = NULL WHERE s.owner_user_id = ?',
      [userId],
    );
    await tx.execute('DELETE FROM meal_sets WHERE owner_user_id = ?', [userId]);
    await tx.execute('DELETE FROM meal_set_recommendations WHERE user_id = ?', [userId]);
    await tx.execute('DELETE FROM meal_set_comments WHERE user_id = ?', [userId]);
    await tx.execute('UPDATE household_invites SET created_by = NULL WHERE created_by = ?', [
      userId,
    ]);
  });
};

/** Reminder emails per run (the host runs this every few minutes). */
const REMINDERS_PER_RUN = 40;

/**
 * Background work (ADR 0014): a meal's reminder ("take the chicken out of the freezer") is
 * emailed to the household's members from 18:00 the evening before, in the household's time zone.
 * Each one is claimed (meal_reminders_sent) before it is sent, so nobody gets it twice.
 */
export const scheduled: PluginPlatformModule['scheduled'] = async ({ db, mail, baseUrl, now }) => {
  if (!db) return;
  const [data, { reminderDue }, { mealReminderEmail }, { addDays, todayIn, wallTime }] =
    await Promise.all([
      import('./lib/data'),
      import('./lib/plan'),
      import('./lib/reminder-email'),
      import('./lib/dates'),
    ]);
  // Comments on members' public meals: a notification and a message (ADR 0037), no email.
  const { commentEmail } = await import('./lib/comment-email');
  for (const c of await data.commentsToNotify(db, 50)) {
    if (!(await data.claimCommentNotice(db, c.id))) continue;
    await mail.sendToUser(
      c.ownerId,
      (locale) =>
        commentEmail(
          { setId: c.setId, title: c.title, name: c.name, body: c.body },
          locale,
          baseUrl,
        ),
      { notify: true, message: true, email: false },
    );
  }
  const utcToday = todayIn('UTC', now);
  const meals = await data.mealsWithReminders(db, addDays(utcToday, -1), addDays(utcToday, 2));
  let emails = 0;
  for (const meal of meals) {
    if (emails >= REMINDERS_PER_RUN) break;
    if (!reminderDue(meal.day, wallTime(now, meal.timeZone))) continue;
    if (!(await data.claimReminder(db, meal.id, meal.day))) continue;
    for (const userId of await data.memberIds(db, meal.householdId)) {
      await mail.sendToUser(userId, (locale) => mealReminderEmail(meal, locale, baseUrl), {
        notify: true,
      });
      emails++;
    }
  }
};

/** Public totals for the app's card and front page (ADR 0038): counts only, never about a person. */
export const getHighlights: PluginPlatformModule['getHighlights'] = async ({ db }) => {
  if (!db) return [];
  const [row] = await db.query<{
    shared: number | string;
    planned: number | string;
    households: number | string;
  }>(
    `SELECT (SELECT COUNT(*) FROM meal_sets WHERE is_public = 1) AS shared,
            (SELECT COUNT(*) FROM meals) AS planned,
            (SELECT COUNT(*) FROM households) AS households`,
  );
  const n = (v: number | string | undefined) => Number(v ?? 0);
  return [
    {
      value: n(row?.shared),
      label: {
        en: 'Shared meals',
        de: 'Geteilte Mahlzeiten',
        ro: 'Mese publice',
        hu: 'Megosztott étkezés',
      },
      icon: '🍽️',
    },
    {
      value: n(row?.planned),
      label: {
        en: 'Planned meals',
        de: 'Geplante Mahlzeiten',
        ro: 'Mese planificate',
        hu: 'Megtervezett étkezés',
      },
      icon: '📅',
    },
    {
      value: n(row?.households),
      label: { en: 'Households', de: 'Haushalte', ro: 'Gospodării', hu: 'Háztartás' },
      icon: '🏠',
    },
  ];
};

/**
 * Something others still see (ADR 0042): comments or recommendations on other members' public
 * meals, or meals they planned in a household others belong to.
 */
export const hasContributions: PluginPlatformModule['hasContributions'] = async (
  userId,
  { db },
) => {
  if (!db) return false;
  const [row] = await db.query<{ n: number | string }>(
    `SELECT (EXISTS (SELECT 1 FROM meal_set_comments c JOIN meal_sets s ON s.id = c.set_id
                      WHERE c.user_id = ? AND s.owner_user_id <> ?)
          OR EXISTS (SELECT 1 FROM meal_set_recommendations r JOIN meal_sets s ON s.id = r.set_id
                      WHERE r.user_id = ? AND s.owner_user_id <> ?)
          OR EXISTS (SELECT 1 FROM meals m
                      WHERE m.created_by = ?
                        AND EXISTS (SELECT 1 FROM household_members o
                                     WHERE o.household_id = m.household_id AND o.user_id <> ?))) AS n`,
    [userId, userId, userId, userId, userId, userId],
  );
  return Number(row?.n ?? 0) === 1;
};

/**
 * The account is kept as `alias` (ADR 0042): as deleteUserData, but their comments and
 * recommendations on other members' public meals stay, the comments signed with the alias.
 */
export const anonymizeUserData: PluginPlatformModule['anonymizeUserData'] = async (
  userId,
  alias,
  { db },
) => {
  if (!db) {
    if (process.env.MEALS_DB_NAME) throw new Error('meals database unavailable');
    return;
  }
  await db.transaction(async (tx) => {
    await tx.execute(
      `UPDATE households h
          JOIN (SELECT household_id,
                       COALESCE(MIN(CASE WHEN role = 'planner' THEN user_id END), MIN(user_id)) AS heir
                  FROM household_members WHERE user_id <> ? GROUP BY household_id) x
            ON x.household_id = h.id
          SET h.owner_user_id = x.heir
        WHERE h.owner_user_id = ?`,
      [userId, userId],
    );
    await tx.execute(
      `UPDATE household_members m JOIN households h ON h.id = m.household_id
          SET m.role = 'planner'
        WHERE m.user_id = h.owner_user_id`,
    );
    await tx.execute('DELETE FROM households WHERE owner_user_id = ?', [userId]);
    await tx.execute('DELETE FROM household_members WHERE user_id = ?', [userId]);
    await tx.execute('UPDATE meals SET created_by = NULL WHERE created_by = ?', [userId]);
    await tx.execute(
      'UPDATE meals m JOIN meal_sets s ON s.id = m.set_id SET m.set_id = NULL WHERE s.owner_user_id = ?',
      [userId],
    );
    await tx.execute('DELETE FROM meal_sets WHERE owner_user_id = ?', [userId]);
    await tx.execute('UPDATE meal_set_comments SET user_name = ? WHERE user_id = ?', [
      alias,
      userId,
    ]);
    await tx.execute('UPDATE household_invites SET created_by = NULL WHERE created_by = ?', [
      userId,
    ]);
  });
};
