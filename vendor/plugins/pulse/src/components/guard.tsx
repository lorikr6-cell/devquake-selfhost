import type { PluginContext, PluginDatabase, PluginUser } from '@devquake/plugin-sdk';
import { rich } from '@devquake/ui';
import type { ReactNode } from 'react';
import { localeOf, translator } from '../i18n';
import { accountPlan } from '../lib/data';
import { masterKey } from '../lib/keys';
import { LIMITS, planOf, type Limits, type Plan } from '../lib/limits';
import { Notice } from './panel';

export type PageScope =
  | { ok: true; db: PluginDatabase; user: PluginUser; plan: Plan; limits: Limits }
  | { ok: false; notice: ReactNode };

/**
 * Pages need a signed-in user, the app's database and the master key (PULSE_MASTER_KEY);
 * otherwise they show why not. The member's plan decides the limits shown.
 */
export async function pageScope(ctx: PluginContext): Promise<PageScope> {
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
  if (!ctx.db || !masterKey()) {
    // Admins see which setting is missing (never its value), so a deployment can be fixed.
    const missing = ctx.user.isAdmin
      ? [
          ...(ctx.db ? [] : [t('adminNoDb')]),
          ...(masterKey() ? [] : [t(process.env.PULSE_MASTER_KEY ? 'adminBadKey' : 'adminNoKey')]),
        ]
      : [];
    return {
      ok: false,
      notice: (
        <Notice title={t('unavailableTitle')}>
          <p>{t('unavailableBody')}</p>
          {missing.length ? (
            <div className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-left">
              <p className="font-semibold">{t('adminTitle')}</p>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                {missing.map((m) => (
                  <li key={m} className="break-words">
                    {m}
                  </li>
                ))}
              </ul>
              <p className="mt-2">{t('adminWhere')}</p>
            </div>
          ) : null}
        </Notice>
      ),
    };
  }
  const level = ctx.accessOf
    ? ((await ctx.accessOf([ctx.user.id]))[ctx.user.id] ?? 'none')
    : 'member';
  const plan = planOf(level, await accountPlan(ctx.db, ctx.user.id)) ?? 'trial';
  return { ok: true, db: ctx.db, user: ctx.user, plan, limits: LIMITS[plan] };
}
