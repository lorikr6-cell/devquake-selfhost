import { localizePath } from '@devquake/ui';
import { api, mine } from '../lib/api';
import { localeOf } from '../i18n';
import { createInvite } from '../lib/team-data';
import { readBody, rolesInput } from '../lib/validate';

// POST /api/team/invites { roles }: a one-time link (a week) to join the shop's team with these
// roles. The code is answered once, inside the link; only its hash is kept.
export const POST = api('team', async ({ request, db, store, user, ctx }) => {
  const roles = rolesInput((await readBody(request)).roles);
  const code = await createInvite(db, mine(store).id, roles, user.id);
  return { link: `${ctx.baseUrl}${localizePath(`/join/${code}`, localeOf(ctx))}` };
});
