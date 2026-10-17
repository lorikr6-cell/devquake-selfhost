import type { Metadata } from 'next';
import { cache } from 'react';
import type { PluginContext } from '@devquake/plugin-sdk';
import { publishedStores, storeBySlug, storeOfMember } from '../lib/data';
import { shopIcons } from './shop';

/**
 * The browser tab's icon for the app's own pages (overview, products, manual…): the logo of the
 * member's shop, else of the site's open shop, so a standalone instance shows its shop's logo
 * everywhere. Undefined without a logo: the app's icon stays.
 */
export const appIcons = cache(async (ctx: PluginContext): Promise<Metadata['icons']> => {
  if (!ctx.db) return undefined;
  const db = ctx.db;
  const own = ctx.user ? (await storeOfMember(db, ctx.user.id).catch(() => null))?.store : null;
  if (own) return shopIcons(own, !own.published);
  const [first] = await publishedStores(db).catch(() => []);
  const open = first ? await storeBySlug(db, first.slug).catch(() => null) : null;
  return open ? shopIcons(open, false) : undefined;
});
