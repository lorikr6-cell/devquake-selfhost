import { api, readJson } from '../../lib/api';
import { ALL_SERVICES, callTotals, cleanLog, logInfo, setCleanupDays } from '../../lib/call-log';
import { parseCleanupDays } from '../../lib/call-rules';
import { HttpError } from '../../lib/http';

// /api/admin/calls — the API call log for DevQuake admins (Pulse 0.3.0): totals, log size and
// clean-up. Counts only: no member's services or data are listed here.

const adminOnly = (fn: Parameters<typeof api>[0]) =>
  api(async (scope) => {
    if (!scope.user.isAdmin) throw new HttpError(403, 'adminOnly');
    return fn(scope);
  });

export const GET = adminOnly(async ({ db }) => ({
  totals: await callTotals(db, ALL_SERVICES),
  log: await logInfo(db),
}));

/** Clean now: { olderThanDays } (0 = the whole log). The totals are kept. */
export const POST = adminOnly(async ({ request, db, user }) => {
  const body = await readJson(request);
  const days = parseCleanupDays(body.olderThanDays);
  if (days === null) throw new HttpError(400, 'invalidRequest');
  const removed = await cleanLog(db, days, { userId: user.id, auto: false });
  return { removed };
});

/** The automatic clean-up interval: { cleanupDays } (0 = off). */
export const PUT = adminOnly(async ({ request, db, user }) => {
  const body = await readJson(request);
  const days = parseCleanupDays(body.cleanupDays);
  if (days === null) throw new HttpError(400, 'invalidRequest');
  await setCleanupDays(db, days, user.id);
  return undefined;
});
