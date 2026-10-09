import type { PluginPlatformModule } from '@devquake/plugin-sdk';

/** Hooks the platform calls (ADR 0007): dashboard numbers and removing a user's data. */

export const getStats: PluginPlatformModule['getStats'] = async ({ db }) => {
  if (!db) return [];
  const [row] = await db.query<{
    utilities: number;
    users: number;
    bills: number;
    files: number;
    readings: number;
    photos: number;
  }>(
    `SELECT (SELECT COUNT(*) FROM utilities) AS utilities,
            (SELECT COUNT(DISTINCT user_id) FROM utility_members) AS users,
            (SELECT COUNT(*) FROM bills) AS bills,
            (SELECT COUNT(*) FROM bill_files) AS files,
            (SELECT COUNT(*) FROM readings) AS readings,
            (SELECT COUNT(*) FROM reading_photos) AS photos`,
  );
  return [
    { label: 'Utilities', value: Number(row?.utilities ?? 0) },
    { label: 'People sharing utilities', value: Number(row?.users ?? 0) },
    { label: 'Bills', value: Number(row?.bills ?? 0) },
    { label: 'Bill PDFs', value: Number(row?.files ?? 0) },
    { label: 'Meter readings', value: Number(row?.readings ?? 0) },
    { label: 'Meter photos', value: Number(row?.photos ?? 0) },
  ];
};

/**
 * Removes everything this app stores about a user: on account deletion and when they
 * unsubscribe from the app. Utilities they own are deleted with all their bills, PDFs,
 * readings, meter photos, payments and comments (the database cascades from utilities and
 * bills). On other people's utilities their membership, readings, meter photos, payments,
 * comments and bill shares are removed, as are their profile (name and address) and the invite
 * codes they created.
 */
export const deleteUserData: PluginPlatformModule['deleteUserData'] = async (userId, { db }) => {
  if (!db) {
    // Without its database the app cannot clean up; refusing keeps nothing behind.
    if (process.env.UTILITIES_DB_NAME) throw new Error('utilities database unavailable');
    return;
  }
  await db.transaction(async (tx) => {
    await tx.execute('DELETE FROM utilities WHERE owner_user_id = ?', [userId]);
    await tx.execute('DELETE FROM reading_photos WHERE user_id = ?', [userId]);
    await tx.execute('DELETE FROM readings WHERE user_id = ?', [userId]);
    await tx.execute('DELETE FROM payments WHERE user_id = ?', [userId]);
    await tx.execute('DELETE FROM bill_comments WHERE user_id = ?', [userId]);
    await tx.execute('DELETE FROM bill_participants WHERE user_id = ?', [userId]);
    await tx.execute('DELETE FROM utility_members WHERE user_id = ?', [userId]);
    await tx.execute('UPDATE utility_invites SET created_by = NULL WHERE created_by = ?', [userId]);
    await tx.execute('UPDATE bills SET created_by = NULL WHERE created_by = ?', [userId]);
    await tx.execute('UPDATE bill_files SET uploaded_by = NULL WHERE uploaded_by = ?', [userId]);
    await tx.execute('UPDATE readings SET entered_by = NULL WHERE entered_by = ?', [userId]);
    await tx.execute('DELETE FROM profiles WHERE user_id = ?', [userId]);
  });
};

/** Payment confirmation emails per run (the host runs this every few minutes). */
const PAYMENT_EMAILS_PER_RUN = 25;

/**
 * Background work (ADR 0014): the email to each person whose payment the manager confirmed, in
 * their language, with the bill's details and a link to it. Each payment is marked before its
 * email is sent (takePaymentEmails), so nobody gets it twice.
 */
export const scheduled: PluginPlatformModule['scheduled'] = async ({ db, mail, baseUrl }) => {
  if (!db) return;
  const [{ takePaymentEmails }, { paymentEmail }] = await Promise.all([
    import('./lib/data'),
    import('./lib/payment-email'),
  ]);
  for (const email of await takePaymentEmails(db, PAYMENT_EMAILS_PER_RUN)) {
    await mail.sendToUser(email.userId, (locale) => paymentEmail(email, locale, baseUrl));
  }
};

/** Public totals for the app's card and front page (ADR 0038): counts only, never about a person. */
export const getHighlights: PluginPlatformModule['getHighlights'] = async ({ db }) => {
  if (!db) return [];
  const [row] = await db.query<{ bills: number | string; readings: number | string }>(
    `SELECT (SELECT COUNT(*) FROM bills) AS bills,
            (SELECT COUNT(*) FROM readings) AS readings`,
  );
  const n = (v: number | string | undefined) => Number(v ?? 0);
  return [
    {
      value: n(row?.bills),
      label: { en: 'Bills', de: 'Rechnungen', ro: 'Facturi', hu: 'Számla' },
      icon: '🧾',
    },
    {
      value: n(row?.readings),
      label: {
        en: 'Meter readings',
        de: 'Zählerstände',
        ro: 'Citiri de contor',
        hu: 'Mérőóra-állás',
      },
      icon: '📟',
    },
  ];
};

/**
 * Something others still see (ADR 0042), on a utility someone else owns: their share of a bill,
 * readings, payments or comments.
 */
export const hasContributions: PluginPlatformModule['hasContributions'] = async (
  userId,
  { db },
) => {
  if (!db) return false;
  const [row] = await db.query<{ n: number | string }>(
    `SELECT EXISTS (SELECT 1 FROM bill_participants x
                      JOIN bills b ON b.id = x.bill_id
                      JOIN utilities u ON u.id = b.utility_id
                     WHERE x.user_id = ? AND u.owner_user_id <> ?)
         OR EXISTS (SELECT 1 FROM bill_comments x
                      JOIN bills b ON b.id = x.bill_id
                      JOIN utilities u ON u.id = b.utility_id
                     WHERE x.user_id = ? AND u.owner_user_id <> ?) AS n`,
    [userId, userId, userId, userId],
  );
  return Number(row?.n ?? 0) === 1;
};

/**
 * The account is kept as `alias` (ADR 0042): their own utilities, profile and memberships go;
 * on bills of utilities others own, their share, readings, meter photos, payments and comments
 * stay (the split of each bill depends on them), shown with the alias.
 */
export const anonymizeUserData: PluginPlatformModule['anonymizeUserData'] = async (
  userId,
  alias,
  { db },
) => {
  if (!db) {
    if (process.env.UTILITIES_DB_NAME) throw new Error('utilities database unavailable');
    return;
  }
  await db.transaction(async (tx) => {
    await tx.execute('DELETE FROM utilities WHERE owner_user_id = ?', [userId]);
    await tx.execute('UPDATE bill_participants SET display_name = ? WHERE user_id = ?', [
      alias,
      userId,
    ]);
    await tx.execute('UPDATE bill_comments SET user_name = ? WHERE user_id = ?', [alias, userId]);
    await tx.execute('DELETE FROM utility_members WHERE user_id = ?', [userId]);
    await tx.execute('UPDATE utility_invites SET created_by = NULL WHERE created_by = ?', [userId]);
    await tx.execute('UPDATE bills SET created_by = NULL WHERE created_by = ?', [userId]);
    await tx.execute('UPDATE bill_files SET uploaded_by = NULL WHERE uploaded_by = ?', [userId]);
    await tx.execute('UPDATE readings SET entered_by = NULL WHERE entered_by = ?', [userId]);
    await tx.execute('DELETE FROM profiles WHERE user_id = ?', [userId]);
  });
};
