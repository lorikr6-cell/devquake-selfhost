import { redirect } from 'next/navigation';
import type { PluginContext, PluginDatabase, PluginUser } from '@devquake/plugin-sdk';
import { localizePath, rich } from '@devquake/ui';
import type { ReactNode } from 'react';
import { localeOf, translator } from '../i18n';
import { getProfile } from '../lib/data/profiles';
import type { Profile } from '../lib/model';
import { Notice } from './ui';

export type PageScope =
  | { ok: true; db: PluginDatabase; user: PluginUser; profile: Profile | null }
  | { ok: false; notice: ReactNode };

/**
 * Pages need a signed-in user and the app's database; otherwise they show why not. With
 * `needsProfile`, people without a profile are sent to set it up first.
 */
export async function pageScope(ctx: PluginContext, needsProfile = true): Promise<PageScope> {
  const locale = localeOf(ctx);
  const t = translator(locale, 'guard');
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
  const profile = await getProfile(ctx.db, ctx.user.id);
  if (needsProfile && !profile) redirect(localizePath('/profile?setup=1', locale));
  return { ok: true, db: ctx.db, user: ctx.user, profile };
}
