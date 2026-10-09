import type { PluginContext, PluginDatabase, PluginUser } from '@devquake/plugin-sdk';
import { rich } from '@devquake/ui';
import type { ReactNode } from 'react';
import { localeOf, translator } from '../i18n';
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
