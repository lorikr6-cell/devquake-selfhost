import { api } from '../../lib/api';
import { platformApp, rotateSecret } from '../../lib/data';
import { HttpError } from '../../lib/http';
import { platformInfo } from '../../lib/platform-service';

// /api/admin/platform — DevQuake's platform service (ADR 0063), for DevQuake admins only. It is
// never listed for members.

const adminOnly = (fn: Parameters<typeof api>[0]) =>
  api(async (scope) => {
    if (!scope.user.isAdmin) throw new HttpError(404, 'notFound');
    return fn(scope);
  });

/** The service, its use and whether the website has its current secret key. */
export const GET = adminOnly(async ({ db, master }) => platformInfo(db, master));

/**
 * A new secret key, shown once. The previous one keeps working for 24 hours, so the website
 * keeps running until PULSE_PLATFORM_SECRET is updated and the app subdomains restarted.
 */
export const POST = adminOnly(async ({ db, master }) => {
  const app = await platformApp(db, master);
  return { secret: await rotateSecret(db, app, master) };
});
