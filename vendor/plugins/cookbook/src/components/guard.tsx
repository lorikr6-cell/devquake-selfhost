import type { PluginContext, PluginDatabase, PluginUser } from '@devquake/plugin-sdk';
import { rich, type Locale } from '@devquake/ui';
import type { ReactNode } from 'react';
import { localeOf, translator } from '../i18n';
import { loadFoods } from '../lib/food-store';
import { Notice } from './ui';

export type PageScope =
  | { ok: true; db: PluginDatabase; user: PluginUser; locale: Locale }
  | { ok: false; notice: ReactNode };

/**
 * Pages need a signed-in user and the app's database; otherwise they show why not. Loads the
 * food catalogue (lib/food-store.ts) for the recipe maths.
 */
export async function pageScope(ctx: PluginContext): Promise<PageScope> {
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
  await loadFoods(ctx.db);
  return { ok: true, db: ctx.db, user: ctx.user, locale };
}
