import type { PluginPlatformModule } from '@devquake/plugin-sdk';

/** Hooks the platform calls (ADR 0007): dashboard numbers, public totals, removing a member. */

export const getStats: PluginPlatformModule['getStats'] = async ({ db }) => {
  if (!db) return [];
  const { totals } = await import('./lib/data');
  const t = await totals(db);
  return [
    { label: 'Venues', value: t.venues },
    { label: 'Menu items', value: t.items },
  ];
};

/** Public totals (ADR 0038): never about a person. */
export const getHighlights: PluginPlatformModule['getHighlights'] = async ({ db }) => {
  if (!db) return [];
  const { totals } = await import('./lib/data');
  const t = await totals(db);
  return [
    {
      value: t.venues,
      label: {
        en: 'Venues',
        de: 'Lokale',
        ro: 'Localuri',
        hu: 'Vendéglátóhelyek',
        it: 'Locali',
        es: 'Locales',
      },
      icon: '☕',
    },
    {
      value: t.items,
      label: {
        en: 'Menu items',
        de: 'Gerichte und Getränke',
        ro: 'Produse în meniu',
        hu: 'Étlap tételei',
        it: 'Voci di menu',
        es: 'Platos y bebidas',
      },
      icon: '🍽️',
    },
  ];
};

/** The member's venue with its staff, tablets and menu goes with them. */
export const deleteUserData: PluginPlatformModule['deleteUserData'] = async (userId, { db }) => {
  if (!db) return;
  const { deleteVenueOf } = await import('./lib/data');
  await deleteVenueOf(db, userId);
};

/**
 * The scheduled run (ADR 0014; no timers of our own): finalised bills older than six months go;
 * the sales numbers stay for the owner's reports.
 */
export const scheduled: PluginPlatformModule['scheduled'] = async ({ db }) => {
  if (!db) return;
  const { deleteOldBills } = await import('./lib/floor');
  const { deleteOldCalls } = await import('./lib/calls');
  const { deleteOldMoves } = await import('./lib/stock');
  await deleteOldBills(db);
  await deleteOldCalls(db);
  await deleteOldMoves(db);
  const { deleteOldOrders } = await import('./lib/guest-orders');
  await deleteOldOrders(db);
};
