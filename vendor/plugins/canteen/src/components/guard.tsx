import { notFound } from 'next/navigation';
import type { PluginContext, PluginDatabase, PluginUser } from '@devquake/plugin-sdk';
import { rich, type Locale } from '@devquake/ui';
import type { ReactNode } from 'react';
import { localeOf, translator } from '../i18n';
import { orgById, staffOf, type Staff } from '../lib/data';
import { todayIn } from '../lib/dates';
import { staffCan, type Action } from '../lib/roles';
import { Notice } from './ui';

export type PageScope =
  | {
      ok: true;
      db: PluginDatabase;
      user: PluginUser;
      today: string;
      timeZone: string;
      locale: Locale;
    }
  | { ok: false; notice: ReactNode };

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
  const timeZone = ctx.timeZone || 'UTC';
  return {
    ok: true,
    db: ctx.db,
    user: ctx.user,
    today: todayIn(timeZone),
    timeZone,
    locale: localeOf(ctx),
  };
}

export type OrgScope =
  | (Extract<PageScope, { ok: true }> & {
      org: { id: number; name: string; demo: boolean };
      staff: Staff;
      can: (action: Action) => boolean;
    })
  | { ok: false; notice: ReactNode };

/**
 * An organisation's pages: the visitor must be its staff and allowed `action` (otherwise 404,
 * never a hint that the organisation or the page exists).
 */
export async function orgScope(
  ctx: PluginContext,
  params: Record<string, string | undefined>,
  action: Action,
): Promise<OrgScope> {
  const scope = pageScope(ctx);
  if (!scope.ok) return scope;
  const orgId = Number(params.id);
  if (!Number.isSafeInteger(orgId) || orgId <= 0) notFound();
  const staff = await staffOf(scope.db, orgId, scope.user.id);
  if (!staff || !staffCan(staff, action)) notFound();
  const org = await orgById(scope.db, orgId);
  if (!org) notFound();
  return { ...scope, org, staff, can: (a: Action) => staffCan(staff, a) };
}

/** A person id from the URL, or 404. */
export function personIdOf(params: Record<string, string | undefined>): number {
  const id = Number(params.personId);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();
  return id;
}
