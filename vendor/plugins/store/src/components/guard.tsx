import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import type { PluginContext, PluginDatabase, PluginUser } from '@devquake/plugin-sdk';
import { LOCALE_TAGS, Link, isLocale, rich, type Locale } from '@devquake/ui';
import type { ReactNode } from 'react';
import { applyShopLanguage, localeOf, translator } from '../i18n';
import { languageMessages, languageNames } from '../lib/languages-data';
import { buyerCookie, type Buyer } from '../lib/buyers-data';
import { resolveBuyer } from '../lib/buyer-session';
import { storeBySlug, storeOfMember, type Store } from '../lib/data';
import { formatCents } from '../lib/pricing';
import { can, type Area, type Role } from '../lib/roles';
import { preparePromo } from './devquake-promo';
import { Notice } from './ui';

export type OwnerScope =
  | {
      ok: true;
      db: PluginDatabase;
      user: PluginUser;
      /** The store the member owns or works on; null before they made or joined one. */
      store: Store | null;
      /** Their roles there; empty without a store. */
      roles: Role[];
      timeZone: string;
      locale: Locale;
    }
  | { ok: false; notice: ReactNode };

/** The owner's pages need a signed-in member and the database; otherwise they say why not. */
export async function ownerScope(ctx: PluginContext): Promise<OwnerScope> {
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
  if (!ctx.db) return { ok: false, notice: unavailable(ctx) };
  const membership = await storeOfMember(ctx.db, ctx.user.id);
  return {
    ok: true,
    db: ctx.db,
    user: ctx.user,
    store: membership?.store ?? null,
    roles: membership?.roles ?? [],
    timeZone: ctx.timeZone || 'UTC',
    locale: localeOf(ctx),
  };
}

/**
 * An owner page of an area: the member needs a store (a link to create one otherwise) and a
 * role that may open the area (roles.ts). Null when everything is fine.
 */
export function needArea(
  store: Store | null,
  roles: readonly Role[],
  area: Area,
  locale: Locale,
): ReactNode | null {
  const missing = needStore(store, locale);
  if (missing) return missing;
  if (can(roles, area)) return null;
  const t = translator(locale, 'guard');
  return (
    <Notice title={t('forbiddenTitle')}>
      <p>{t('forbiddenBody')}</p>
    </Notice>
  );
}

function unavailable(ctx: PluginContext) {
  const t = translator(localeOf(ctx), 'guard');
  return (
    <Notice title={t('unavailableTitle')}>
      <p>{t('unavailableBody')}</p>
    </Notice>
  );
}

/** An owner page that needs the store: a link to create it first otherwise. */
export function needStore(store: Store | null, locale: Locale): ReactNode | null {
  if (store) return null;
  const t = translator(locale, 'create');
  return (
    <Notice title={t('title')}>
      <Link href="/" className="font-medium text-quake underline">
        {t('submit')}
      </Link>
    </Notice>
  );
}

export type ShopScope =
  | {
      ok: true;
      db: PluginDatabase;
      store: Store;
      /** The owner or their team looking at the closed shop (a preview no one else sees). */
      preview: boolean;
      /** The owner or a member of the shop's team is looking (no view statistics). */
      team: boolean;
      locale: Locale;
      timeZone: string;
    }
  | { ok: false; notice: ReactNode };

/** A shop's pages: the store must exist and be open, except for its team (a preview). */
export async function shopScope(ctx: PluginContext, slug: string | undefined): Promise<ShopScope> {
  if (!ctx.db) return { ok: false, notice: unavailable(ctx) };
  const store = await storeBySlug(ctx.db, slug ?? '');
  if (!store) notFound();
  await chooseShopLanguage(ctx.db, store, localeOf(ctx));
  await preparePromo(ctx);
  const team = ctx.user
    ? ctx.user.id === store.ownerUserId ||
      (await storeOfMember(ctx.db, ctx.user.id))?.store.id === store.id
    : false;
  if (!store.published && !team) {
    const t = translator(localeOf(ctx), 'shop');
    return {
      ok: false,
      notice: (
        <Notice title={t('closedTitle')}>
          <p>{t('closedBody')}</p>
        </Notice>
      ),
    };
  }
  // Maintenance: buyers see the owner's message; the team still sees the shop.
  if (store.maintenance && !team) {
    const t = translator(localeOf(ctx), 'shop');
    return {
      ok: false,
      notice: (
        <Notice title={t('maintenanceTitle', { store: store.name })}>
          <p className="whitespace-pre-line">{store.maintenanceMessage ?? t('maintenanceBody')}</p>
        </Notice>
      ),
    };
  }
  return {
    ok: true,
    db: ctx.db,
    store,
    preview: !store.published,
    team,
    locale: localeOf(ctx),
    timeZone: ctx.timeZone || 'UTC',
  };
}

/** The cookie where a buyer's choice of the shop's own language is kept ('auto': the site's). */
export const languageCookie = (storeId: number) => `dq_store_lang_${storeId}`;

/**
 * Which labels this page uses (ADR 0058): one of the shop's own new languages when the buyer
 * picked it (or it is the shop's default and they picked nothing), else the built-in language
 * of the address, with the shop's changes to it when there are any.
 */
async function chooseShopLanguage(db: PluginDatabase, store: Store, locale: Locale) {
  const options = await languageNames(db, store.id);
  if (options.length === 0) return;
  const picked = (await cookies()).get(languageCookie(store.id))?.value;
  const known = (code: string | null | undefined) =>
    code && !isLocale(code) && options.some((o) => o.code === code) ? code : null;
  const own =
    picked === 'auto' ? null : (known(picked) ?? (picked ? null : known(store.defaultLanguage)));
  const code = own ?? (options.some((o) => o.code === locale) ? locale : null);
  const labels = code ? await languageMessages(db, store.id, code) : null;
  applyShopLanguage(
    code,
    labels,
    code && isLocale(code) ? code : 'en',
    options.filter((o) => !isLocale(o.code)),
  );
}

/**
 * The buyer signed in to this shop on this browser (their session cookie), or the account the
 * signed-in DevQuake member connected (ADR 0059), if any.
 */
export async function currentBuyer(
  db: PluginDatabase,
  store: Store,
  user?: PluginUser | null,
): Promise<Buyer | null> {
  const jar = await cookies();
  return resolveBuyer(db, store.id, jar.get(buyerCookie(store.id))?.value, user);
}

/** Money in the page language and the store's currency. */
export function moneyIn(locale: Locale, currency: string) {
  const tag = LOCALE_TAGS[locale];
  return (cents: number) => formatCents(cents, currency, tag);
}

/** A country's name in the page language ("RO" → "Romania"). */
export function countryNamer(locale: Locale) {
  const names = new Intl.DisplayNames([LOCALE_TAGS[locale]], { type: 'region' });
  return (code: string) => {
    try {
      return names.of(code) ?? code;
    } catch {
      return code;
    }
  };
}
