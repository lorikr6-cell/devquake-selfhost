import type { PluginDatabase } from '@devquake/plugin-sdk';
import { ownApp, type AppRow } from './data';
import { forgetApp } from './gateway';
import { HttpError } from './http';
import { routeId } from './validate';

/** The member's app from the route (404 for someone else's), for dashboard API handlers. */
export async function requireApp(
  db: Omit<PluginDatabase, 'transaction'>,
  userId: number,
  id: string | undefined,
): Promise<AppRow> {
  const app = await ownApp(db, userId, routeId(id));
  if (!app) throw new HttpError(404, 'appNotFound');
  return app;
}

/** After a change: this process forgets the cached app at once (others within 30 seconds). */
export function changed(app: AppRow) {
  forgetApp(app.public_key);
}
