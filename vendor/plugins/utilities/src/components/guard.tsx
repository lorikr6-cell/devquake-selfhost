import { redirect } from 'next/navigation';
import type { PluginContext, PluginDatabase, PluginUser } from '@devquake/plugin-sdk';
import { localizePath, rich } from '@devquake/ui';
import type { ReactNode } from 'react';
import { localeOf, translator } from '../i18n';
import { getProfile, refreshMemberName, type Profile } from '../lib/data';
import { Notice } from './ui';

export type PageScope =
  { ok: true; db: PluginDatabase; user: PluginUser } | { ok: false; notice: ReactNode };

/** Pages need a signed-in user and the app's database; otherwise they show why not. */
export function pageScope(ctx: PluginContext): PageScope {
  const t = translator(localeOf(ctx), 'guard');
  if (!ctx.user) {
    return {
      ok: false,
      notice: (
        <Notice title={t('signInTitle')}>
          <p>
            {rich(t('signInBody'), {
              link: (
                <a className="font-medium text-quake underline" href={`${ctx.hostUrl}/#account`}>
                  {t('signInLink')}
                </a>
              ),
            })}
          </p>
        </Notice>
      ),
    };
  }
  if (!ctx.db) {
    return {
      ok: false,
      notice: (
        <Notice title={t('unavailableTitle')}>
          <p>{t('unavailableBody')}</p>
        </Notice>
      ),
    };
  }
  return { ok: true, db: ctx.db, user: ctx.user };
}

/**
 * Everyone gives their name and address before using the app (to check a meter if needed):
 * without a profile the page sends them to /profile and back to `here` afterwards.
 */
export async function requireProfile(
  ctx: PluginContext,
  db: PluginDatabase,
  user: PluginUser,
  here: string,
): Promise<Profile> {
  const profile = await getProfile(db, user.id);
  // Profiles saved before the address had parts are completed first.
  if (!profile?.parts) {
    redirect(localizePath(`/profile?next=${encodeURIComponent(here)}`, localeOf(ctx)));
  }
  await refreshMemberName(db, user);
  return profile;
}
