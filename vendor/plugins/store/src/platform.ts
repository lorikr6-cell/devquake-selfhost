import type { PluginPlatformModule } from '@devquake/plugin-sdk';

/** Hooks the platform calls (ADR 0007): dashboard numbers, background work, removing a user. */

export const getStats: PluginPlatformModule['getStats'] = async ({ db }) => {
  if (!db) return [];
  const { totals } = await import('./lib/data');
  const t = await totals(db);
  return [
    { label: 'Stores', value: t.stores },
    { label: 'Open stores', value: t.published },
    { label: 'Products', value: t.products },
    { label: 'Orders', value: t.orders },
    { label: 'Buyer accounts', value: t.buyers },
    { label: 'Subscribers', value: t.subscribers },
    { label: 'Reviews', value: t.reviews },
  ];
};

/** Public totals (ADR 0038): open shops and products on sale, never about a person. */
export const getHighlights: PluginPlatformModule['getHighlights'] = async ({ db }) => {
  if (!db) return [];
  const [row] = await db.query<{ stores: number | string; products: number | string }>(
    `SELECT (SELECT COUNT(*) FROM stores WHERE published = 1) AS stores,
            (SELECT COUNT(*) FROM products p JOIN stores s ON s.id = p.store_id
              WHERE p.published = 1 AND s.published = 1) AS products`,
  );
  return [
    {
      value: Number(row?.stores ?? 0),
      label: {
        en: 'Open shops',
        de: 'Offene Shops',
        ro: 'Magazine deschise',
        hu: 'Nyitott boltok',
      },
      icon: '🏪',
    },
    {
      value: Number(row?.products ?? 0),
      label: {
        en: 'Products on sale',
        de: 'Produkte im Verkauf',
        ro: 'Produse la vânzare',
        hu: 'Eladó termékek',
      },
      icon: '🛍️',
    },
  ];
};

/**
 * Removes the user's store with everything in it, orders, buyers' accounts, messages,
 * subscribers and reviews included, their place on another shop's team and the invitations
 * they made: on account deletion and when they unsubscribe from the app.
 */
export const deleteUserData: PluginPlatformModule['deleteUserData'] = async (userId, { db }) => {
  if (!db) {
    // Without its database the app cannot clean up; refusing keeps nothing behind.
    if (process.env.STORE_DB_NAME) throw new Error('store database unavailable');
    return;
  }
  const { deleteStoreOf } = await import('./lib/data');
  await deleteStoreOf(db, userId);
};

/**
 * Every hour: card and PayPal orders never paid within a day give their stock back; the owner
 * gets an email for each new order (card and PayPal ones once paid) and for buyers' new
 * messages; newsletters still being sent go on in small batches.
 */
export const scheduled: PluginPlatformModule['scheduled'] = async ({ db, mail, baseUrl, now }) => {
  if (!db) return;
  const { expireUnpaid, ordersToAnnounce, markAnnounced, orderById, storeById } =
    await import('./lib/data');
  const { orderEmail, messageEmail } = await import('./lib/order-email');
  const { threadsToAnnounce, markThreadAnnounced } = await import('./lib/buyers-data');
  const { sendingNewsletters } = await import('./lib/newsletter-data');
  const { sendNewsletterBatch } = await import('./lib/shop-mail');
  const { shopMailConfigured } = await import('./lib/mailer');
  await expireUnpaid(db, now);
  for (const due of await ordersToAnnounce(db)) {
    const order = await orderById(db, due.storeId, due.id);
    const store = await storeById(db, due.storeId);
    if (order && store) {
      await mail.sendToUser(
        due.ownerUserId,
        (locale) => orderEmail(store, order, baseUrl, locale),
        {
          notify: true,
        },
      );
    }
    // Once per order, also when the owner cannot be written to any more.
    await markAnnounced(db, due.id);
  }
  for (const thread of await threadsToAnnounce(db)) {
    const store = await storeById(db, thread.storeId);
    if (store) {
      await mail.sendToUser(
        thread.ownerUserId,
        (locale) => messageEmail(store, thread, baseUrl, locale),
        { notify: true },
      );
    }
    await markThreadAnnounced(db, thread.id);
  }
  if (shopMailConfigured()) {
    for (const n of await sendingNewsletters(db)) {
      const store = await storeById(db, n.storeId);
      // At most 200 emails per newsletter and hour from here; the owner's open page sends faster.
      if (store) await sendNewsletterBatch(db, store, n.id, baseUrl, 100);
    }
  }
  await db.execute('DELETE FROM buyer_tokens WHERE expires_at <= UTC_TIMESTAMP()');
  await db.execute('DELETE FROM store_invites WHERE expires_at <= UTC_TIMESTAMP()');
};
