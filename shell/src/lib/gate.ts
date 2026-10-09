import 'server-only';
import { ready, type BootState } from './boot';
import { hasAdmin } from './users';

/**
 * Whether the instance can serve pages: started (database ready) and set up (an admin exists).
 * `'setup'` means the first-run setup is still to be done.
 */
export async function instanceState(): Promise<BootState | { ok: false; reason: 'setup' }> {
  const state = await ready();
  if (!state.ok) return state;
  return (await hasAdmin()) ? state : { ok: false, reason: 'setup' };
}
