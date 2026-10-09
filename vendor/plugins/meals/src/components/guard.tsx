import { notFound } from 'next/navigation';
import type { PluginContext, PluginDatabase, PluginUser } from '@devquake/plugin-sdk';
import { rich, type Locale } from '@devquake/ui';
import type { ReactNode } from 'react';
import { localeOf, translator } from '../i18n';
import { membership, type Membership } from '../lib/data';
import { todayIn } from '../lib/dates';
import { Notice } from './ui';

export type PageScope =
  | {
      ok: true;
      db: PluginDatabase;
      user: PluginUser;
      locale: Locale;
      today: string;
      timeZone: string;
    }
  | { ok: false; notice: ReactNode };

/** Pages need a signed-in user and the app's database; otherwise they show why not. */
export function pageScope(ctx: PluginContext): PageScope {
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
  const timeZone = ctx.timeZone || 'UTC';
  return { ok: true, db: ctx.db, user: ctx.user, locale, today: todayIn(timeZone), timeZone };
}

/** A household's pages: the visitor must be one of its members (404 otherwise, never a hint). */
export async function householdScope(
  ctx: PluginContext,
  params: Record<string, string | undefined>,
) {
  const scope = pageScope(ctx);
  if (!scope.ok) return scope;
  const householdId = Number(params.id);
  if (!Number.isSafeInteger(householdId) || householdId <= 0) notFound();
  const me: Membership | null = await membership(scope.db, householdId, scope.user.id);
  if (!me) notFound();
  return { ...scope, me };
}
