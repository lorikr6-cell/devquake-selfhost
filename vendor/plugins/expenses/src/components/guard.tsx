import { notFound } from 'next/navigation';
import type { PluginContext, PluginDatabase, PluginUser } from '@devquake/plugin-sdk';
import { LOCALE_TAGS, rich, type Locale, type Translate } from '@devquake/ui';
import type { ReactNode } from 'react';
import { localeOf, translator } from '../i18n';
import { groupById, membersOf, membership, type Group, type Me, type Member } from '../lib/data';
import { todayIn } from '../lib/dates';
import { formatMoney } from '../lib/model';
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

export type GroupScope =
  | (Extract<PageScope, { ok: true }> & { group: Group; me: Me; members: Member[] })
  | { ok: false; notice: ReactNode };

/**
 * A group's pages: the visitor must be an active member (otherwise 404, never a hint that the
 * group exists). Gives the group, the visitor's place in it and everyone who is or was in it.
 */
export async function groupScope(
  ctx: PluginContext,
  params: Record<string, string | undefined>,
): Promise<GroupScope> {
  const scope = pageScope(ctx);
  if (!scope.ok) return scope;
  const groupId = Number(params.id);
  if (!Number.isSafeInteger(groupId) || groupId <= 0) notFound();
  const me = await membership(scope.db, groupId, scope.user.id);
  if (!me) notFound();
  const group = await groupById(scope.db, groupId);
  if (!group) notFound();
  return { ...scope, group, me, members: await membersOf(scope.db, groupId) };
}

/** A member's name; people whose account was deleted show as "Former member". */
export function nameOf(members: Member[], id: number | null, t: Translate): string {
  const m = id === null ? undefined : members.find((x) => x.id === id);
  return m?.name || t('members.former');
}

/** Money formatting in the page language and the group's currency. */
export function moneyIn(locale: Locale, currency: string) {
  const tag = LOCALE_TAGS[locale];
  return (amount: number) => formatMoney(amount, currency, tag);
}
