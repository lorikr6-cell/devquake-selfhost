import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export type PluginStatus = 'active' | 'beta' | 'disabled';

/** Static description of a plugin. `id` is also its subdomain: <id>.devquake.com */
export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description?: string;
  status?: PluginStatus;
  /**
   * The plugin owns a MySQL database (ADR 0007). The host connects it from the environment
   * variables `<ID>_DB_NAME`, `<ID>_DB_USER`, `<ID>_DB_PWD` (optional `<ID>_DB_HOST`, `<ID>_DB_PORT`)
   * and exposes it as `ctx.db`.
   */
  database?: boolean;
  /**
   * Pages anyone may open without signing in or subscribing, e.g. a user manual (ADR 0009).
   * Exact static paths only. They are listed in the app's sitemap, allowed in its robots.txt
   * and linked from the project card. Everything else stays members-only.
   */
  publicPages?: PluginPublicPage[];
  /**
   * Routes any signed-in DevQuake user may use without access to the app (ADR 0022), e.g. the
   * page where a vault recipient opens an entry shared with them. Route patterns like `pages`
   * and `api` ("/open/:id"). The app itself must check who may see what on these routes.
   */
  signedInRoutes?: { pages?: string[]; api?: string[] };
  /**
   * Routes anyone may open, signed in or not, without access to the app (ADR 0047): links a
   * member chose to share publicly, e.g. a recipe at "/p/:code" and its picture at
   * "/p/:code/photo". Route patterns like `pages` and `api`; API routes answer GET only. Never
   * listed in the sitemap. The app must check that the link is still shared and show only what
   * was shared, nothing about other people.
   */
  openRoutes?: { pages?: string[]; api?: string[] };
  /**
   * The app may email active DevQuake users who have no access to it, with
   * `mail.sendToUser(id, compose, { withoutAccess: true })` (ADR 0022). Only for people the app
   * has a reason to write to (e.g. recipients a member chose); never for marketing.
   */
  mailWithoutAccess?: boolean;
  /**
   * People a member with access invites into something they share (a family, a list…) get the
   * app free of NPS points (ADR 0043): the app calls `ctx.grantInvitedAccess(inviterId)` when
   * the invited person joins. The invite pages must be in `signedInRoutes`.
   */
  freeForInvited?: boolean;
  /**
   * The app may award NPS points to its members from its `scheduled` hook (`ctx.nps`, ADR 0037),
   * e.g. one point per 100 recommendations of a public recipe. `reason` is shown in the log and
   * to members; `maxPointsPerDay` caps a member's points from this app per UTC day (default 5,
   * at most 10).
   */
  npsAwards?: { reason: PluginLocalizedText; maxPointsPerDay?: number };
  /**
   * Members may give their own NPS points to another DevQuake member from this app
   * (`ctx.npsWallet`, ADR 0046), e.g. to someone in their family. The app decides who may
   * receive; the host moves the points for good and tells the recipient.
   */
  npsGifts?: boolean;
  /**
   * API routes for other websites and servers, e.g. a developer API (ADR 0023). The host lets
   * every request through to them without a DevQuake session, subscription check or same-origin
   * check, and routes OPTIONS (CORS preflight) to them. The app must authenticate every call
   * itself (its own API keys), answer CORS itself and limit what each caller may do. Route
   * patterns like `api` ("/v1/events").
   */
  keyRoutes?: string[];
  /**
   * What the app does, in every language, for its public front page and search engines
   * (ADR 0032). Visitors who may not use the app yet see it on <id>.devquake.com next to the
   * sign-in or subscribe button; it is the page's meta description and structured data, and the
   * front page is then listed in the app's sitemap. Optional: without it the front page only
   * says how to get access.
   */
  about?: PluginAbout;
  /**
   * Fields of the member's DevQuake profile the app may use (ADR 0035), e.g. the birthday. The
   * member allows each app once on DevQuake (and can revoke it under Account → Connected apps);
   * only then does `ctx.profile` return or save them. The platform stays the only store, so a
   * change in one app shows in every app and in DevQuake's own birthday wishes.
   */
  profileFields?: PluginProfileFieldUse[];
  /**
   * Settings the owner sets for this app in /admin-cp (ADR 0050): switches, short texts and
   * secrets such as an API key. The host stores them (secrets encrypted) and hands them to the
   * app's server code through `ctx.settings`; they never reach the browser.
   */
  adminSettings?: PluginAdminSetting[];
  /**
   * Links with other apps (ADR 0035): link points this app offers, its pages other apps may
   * open, and the apps it works with. A link works only when both apps declare it and the
   * member connected them on DevQuake (Account → Connected apps).
   */
  links?: PluginLinkDeclarations;
}

/** See `PluginManifest.about`. English is required; a missing language falls back to it. */
export interface PluginAbout {
  /** One or two sentences on what the app does for people; at most 160 characters. */
  description: { en: string } & Partial<Record<PluginLocale, string>>;
  /** Three to five short lines on what people can do with it. */
  features?: { en: string[] } & Partial<Record<PluginLocale, string[]>>;
  /** schema.org applicationCategory, e.g. "HealthApplication" or "FinanceApplication". */
  category?: string;
}

/** A page of an app that is open to everyone (see `PluginManifest.publicPages`). */
export interface PluginPublicPage {
  /** Exact path, e.g. "/help" (no parameters or wildcards). */
  path: string;
  /** Link text, e.g. "User manual". */
  title: string;
}

/** The signed-in user, as far as a plugin needs to know them (no email, by design). */
export interface PluginUser {
  /** Platform user id: store it as a plain number in the plugin's own tables. */
  id: number;
  displayName: string;
  /** Platform admin or owner. */
  isAdmin: boolean;
}

export interface PluginExecuteResult {
  affectedRows: number;
  insertId: number;
}

/**
 * The plugin's own database. SQL with `?` placeholders only, never string concatenation.
 * Implemented by the host (mysql2); the SDK only defines the shape.
 */
export interface PluginDatabase {
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>;
  execute(sql: string, params?: unknown[]): Promise<PluginExecuteResult>;
  /** Runs `fn` in a transaction: committed if it resolves, rolled back if it throws. */
  transaction<T>(fn: (tx: Omit<PluginDatabase, 'transaction'>) => Promise<T>): Promise<T>;
}

/** Someone in the signed-in user's DevQuake referral network (no email, by design). */
export interface PluginPerson {
  id: number;
  displayName: string;
  /** 'referred' = joined DevQuake through the user's referral; 'referrer' = invited the user. */
  relation: 'referred' | 'referrer';
  /** Whether they can already open this app (subscribed, assigned, or admin). */
  hasAccess: boolean;
}

/** People the signed-in user knows on the platform (ADR 0007). */
export interface PluginPeople {
  /** Active accounts the user referred, plus whoever referred the user. */
  referrals(): Promise<PluginPerson[]>;
  /**
   * The signed-in user's own DevQuake invitation link (https://devquake.com/r/<code>), e.g. for
   * a business card; people who join through it count as their referrals (ADR 0012). Older
   * hosts leave it out.
   */
  inviteLink?(): Promise<string>;
}

/** One release from a plugin's CHANGELOG.md (see parseChangelog). */
export interface PluginChangelogEntry {
  version: string;
  /** As written after the version heading, e.g. "2026-09-24". */
  date?: string;
  /** Bullet points as written (may contain **bold** and `code`). */
  notes: string[];
}

/** Runtime information the host passes to every plugin page, layout and API handler. */
export interface PluginContext {
  pluginId: string;
  /** e.g. "devquake.com" (or "localhost:3000" in development) */
  rootDomain: string;
  /** Absolute URL of this plugin, e.g. "https://blog.devquake.com" */
  baseUrl: string;
  /** Absolute URL of the host app, e.g. "https://devquake.com" */
  hostUrl: string;
  /** Signed-in user (null when signed out). Undefined for hosts older than ADR 0007. */
  user?: PluginUser | null;
  /** The plugin's own database when `manifest.database` is set and configured (ADR 0007). */
  db?: PluginDatabase;
  /** The signed-in user's referral network; undefined when signed out or on older hosts. */
  people?: PluginPeople;
  /** The plugin's own CHANGELOG.md, newest release first (ADR 0008); undefined on older hosts. */
  changelog?: PluginChangelogEntry[];
  /**
   * The visitor's IANA time zone, e.g. "Europe/Bucharest" ("UTC" until known; ADR 0010). Show
   * every timestamp in it (formatDateTime from @devquake/ui); store and send UTC only.
   */
  timeZone?: string;
  /**
   * The page language (ADR 0011): 'en' | 'de' | 'ro' | 'hu'; undefined (= 'en') on older hosts.
   * Show every text in it (the app's own catalogs) and keep it in links (`Link`,
   * `localizePath` from @devquake/ui).
   */
  locale?: PluginLocale;
  /**
   * The signed-in person's session (ADR 0014); null when signed out, undefined on older hosts.
   * Apps with long uninterrupted use (a workout) can keep it from ending mid-way.
   */
  session?: PluginSession | null;
  /**
   * The app as DevQuake shows it (ADR 0016): its project's name and logo. Show the icon next to
   * the app's name in the toolbar. Undefined on older hosts.
   */
  app?: PluginAppIdentity;
  /**
   * Whether these people may use this app right now (ADR 0023): 'member' (subscribed, assigned
   * or admin), 'trial' (in their 24-hour trial) or 'none' (also for unknown or inactive
   * accounts). For apps that act for a member without their session, e.g. on an API-key call.
   * Undefined on older hosts and in local development without the platform database.
   */
  accessOf?: (userIds: number[]) => Promise<Record<number, PluginAccessLevel>>;
  /**
   * The signed-in member's shared profile fields (ADR 0035), for apps that declare
   * `manifest.profileFields`. Undefined when signed out, for apps without profile fields and on
   * older hosts.
   */
  profile?: PluginProfile;
  /**
   * Apps with `manifest.freeForInvited` (ADR 0043): subscribes the signed-in person to the app
   * without NPS points because `inviterUserId`, who has access, invited them. True when they can
   * use the app afterwards (also when they already could); false when the inviter has no access.
   * Undefined when signed out or for other apps.
   */
  grantInvitedAccess?: (inviterUserId: number) => Promise<boolean>;
  /**
   * Links with other apps (ADR 0035): call their link points, open their pages with a way back,
   * list the apps this one works with. Undefined when signed out and on older hosts.
   */
  links?: PluginLinksApi;
  /**
   * The signed-in member's NPS points (ADR 0046), for apps with `manifest.npsGifts`. Undefined
   * when signed out, for other apps and on older hosts.
   */
  npsWallet?: PluginNpsWallet;
  /** The app's settings from /admin-cp (`manifest.adminSettings`, ADR 0050). Server only. */
  settings?: PluginSettings;
}

/** One setting of `PluginManifest.adminSettings`. /admin-cp is in English. */
export interface PluginAdminSetting {
  /** e.g. "aiEnabled": letters and digits, starting with a lowercase letter, at most 40. */
  key: string;
  /** toggle: on/off; text: one line; secret: stored encrypted, never shown again once saved. */
  kind: 'toggle' | 'text' | 'secret';
  label: string;
  /** One or two sentences under the field. */
  help?: string;
  /** Toggles: whether it is on before the owner sets it (default off). */
  defaultOn?: boolean;
  /** Text: shown while empty, e.g. the default the app uses. */
  placeholder?: string;
  /** Text and secrets: the longest value accepted (default 200, at most 1000). */
  maxLength?: number;
}

/** See `PluginContext.settings`. Unknown keys read as off / null. */
export interface PluginSettings {
  /** A toggle: its saved value, else its `defaultOn`. */
  enabled(key: string): Promise<boolean>;
  /** A text or secret, or null when it is not set (or a secret can no longer be read). */
  value(key: string): Promise<string | null>;
}

/** The signed-in member's NPS points, and giving them to someone (ADR 0046). */
export interface PluginNpsWallet {
  /** The points the member has now. */
  balance(): Promise<number>;
  /**
   * Moves `points` (whole, 1–1000) of the member's NPS points to `toUserId`, another active
   * DevQuake member, for good: it cannot be undone. Only the app knows who may receive (for
   * example people in the same family): check that before calling. `key` (1–80 characters of
   * a–z, 0–9 and `:._-`, e.g. a random id per confirmed form) makes a repeated request move the
   * points once (`given: false`). `balance` is the member's points afterwards. Errors:
   * 'invalid' points or key, 'self' (the member themselves), 'recipient' (not an active member),
   * 'insufficient' points, 'unavailable' (try again later).
   */
  give(
    toUserId: number,
    gift: { points: number; key: string },
  ): Promise<
    | { ok: true; given: boolean; balance: number }
    | { ok: false; error: 'invalid' | 'self' | 'recipient' | 'insufficient' | 'unavailable' }
  >;
}

/** What this app offers other apps and what it uses from them (ADR 0035). */
export interface PluginLinkDeclarations {
  offers?: PluginLinkOffer[];
  /** Pages of this app other apps may open directly (deep links). */
  targets?: PluginLinkTarget[];
  /** One entry per other app this app works with. */
  uses?: PluginLinkUse[];
}

/** A link point: a small, named read or action with validated input. A public contract. */
export interface PluginLinkOffer {
  /** Stable id, lowercase words joined by '.' or '-', e.g. "list.add-items". */
  id: string;
  /** What the other app may do, as shown on the consent page ("See your shopping lists"). */
  title: PluginLocalizedText;
  kind: 'read' | 'write';
  /** Only these apps may use it; omitted = every app that declares it in `uses`. */
  apps?: string[];
  /** Calls per member per minute (default 30, at most 120). */
  perMinute?: number;
}

/** A page another app may link to. */
export interface PluginLinkTarget {
  /** Stable id, e.g. "list". */
  id: string;
  /** One of this app's `pages` patterns, e.g. "/lists/:id". */
  path: string;
  title: PluginLocalizedText;
}

/** Another app this app works with. Both sides must declare a link for it to work. */
export interface PluginLinkUse {
  app: string;
  /** Link points of that app this app calls. */
  points?: string[];
  /** Deep-link targets of that app this app opens. */
  targets?: string[];
  /** Why the two work well together, for members (connect page, "Works with", suggestions). */
  benefit: PluginLocalizedText;
}

export interface PluginLinkHandlerModule {
  default: (input: unknown, ctx: PluginLinkContext) => Promise<PluginLinkReply>;
}

/** What a link handler gets: the member it acts for, the calling app, its own database. */
export interface PluginLinkContext {
  pluginId: string;
  /** The app that called. */
  from: string;
  user: PluginUser;
  locale: PluginLocale;
  timeZone: string;
  baseUrl: string;
  db?: PluginDatabase;
}

/** `data` must be JSON (the host copies it through JSON; at most 64 KB each way). */
export type PluginLinkReply =
  { ok: true; data?: unknown } | { ok: false; error: 'invalid-input' | 'not-found' | 'forbidden' };

export type PluginLinkError =
  | 'signed-out'
  | 'not-declared'
  | 'not-connected'
  | 'no-access'
  | 'rate-limited'
  | 'unavailable'
  | 'invalid-input'
  | 'not-found'
  | 'forbidden'
  | 'failed';

export type PluginLinkResult<T = unknown> =
  { ok: true; data: T } | { ok: false; error: PluginLinkError };

/** Another app this app works with, as the signed-in member sees it. */
export interface PluginLinkedApp {
  app: string;
  name: string;
  iconUrl: string;
  /** Why they work well together, in the page language. */
  benefit: string;
  /** 'connected'; 'available' (can connect now); 'needs-access' (subscribe or try it first). */
  state: 'connected' | 'available' | 'needs-access';
  /** The other app's start page. */
  openUrl: string;
  /** devquake.com page to connect the two, coming back to the current app. */
  connectUrl: string;
}

/** Where "back" goes when this page was opened from another app (validated by the host). */
export interface PluginReturnLink {
  app: string;
  /** The app's name as DevQuake shows it (never taken from the URL). */
  name: string;
  url: string;
}

/** See `PluginContext.links`. */
export interface PluginLinksApi {
  /** Apps this app works with (declared on both sides) and their state for this member. */
  list(): Promise<PluginLinkedApp[]>;
  isConnected(app: string): Promise<boolean>;
  /** Calls a link point of another app for the signed-in member (in-process via the host). */
  call<T = unknown>(app: string, point: string, input?: unknown): Promise<PluginLinkResult<T>>;
  /**
   * URL of a page of another app, with a way back. `returnTo` is a path of this app or its
   * absolute URL (default: this app's start page). Null when the target is not declared on both
   * sides or a path parameter is missing.
   */
  deepLink(
    app: string,
    target: string,
    params?: Record<string, string>,
    options?: { returnTo?: string },
  ): string | null;
  /** devquake.com page for connecting with `app`, coming back to `returnTo`. */
  connectUrl(app: string, returnTo?: string): string;
  /** The validated way back when this page was opened from another app's deep link. */
  returnFrom(searchParams: SearchParams): Promise<PluginReturnLink | null>;
}

/** A text in every language; English is required, a missing language falls back to it. */
export type PluginLocalizedText = { en: string } & Partial<Record<PluginLocale, string>>;

/**
 * Shared profile fields (ADR 0035). 'birthday' is day, month and an optional year; 'birthYear'
 * is the year alone (data minimisation for apps that only need an age).
 */
export type PluginProfileField = 'birthday' | 'birthYear';

/** A profile field an app asks for, with why (shown on the consent page) and whether it saves. */
export interface PluginProfileFieldUse {
  field: PluginProfileField;
  purpose: PluginLocalizedText;
  /** The app may also change the value (everywhere on DevQuake). */
  write?: boolean;
}

export interface PluginBirthday {
  day: number;
  month: number;
  year: number | null;
}

/** Profile values; a field the app may not read is left out. null = not known. */
export interface PluginProfileValues {
  birthday?: PluginBirthday | null;
  birthYear?: number | null;
}

export type PluginProfileError =
  'signed-out' | 'not-granted' | 'read-only' | 'invalid' | 'rate-limited' | 'unavailable';

/** See `PluginContext.profile`. */
export interface PluginProfile {
  /** The fields the member allowed this app, and whether it may change them. */
  granted(): Promise<Array<{ field: PluginProfileField; write: boolean }>>;
  /** The member's own values of the allowed fields. */
  get(): Promise<PluginProfileValues>;
  /** Saves allowed, writable fields (birthday: day and month, optional year; null removes). */
  set(
    values: PluginProfileValues,
  ): Promise<{ ok: true } | { ok: false; error: PluginProfileError }>;
  /**
   * Other members' values, only of people who allowed this app (e.g. a family's members);
   * at most 200 ids. People who did not allow it are left out.
   */
  of(userIds: number[]): Promise<Record<number, PluginProfileValues>>;
  /** The DevQuake page where the member allows this app (then back to `returnTo`). */
  consentUrl(returnTo?: string): string;
}

/** What a person may do in an app right now (see `PluginContext.accessOf`). */
export type PluginAccessLevel = 'member' | 'trial' | 'none';

/** The app's project name and logo (an SVG on the host, safe for <img src>). */
export interface PluginAppIdentity {
  name: string;
  /** Absolute URL of the logo (SVG, square). */
  iconUrl: string;
}

export type PluginLocale = 'en' | 'de' | 'ro' | 'hu';

/** The signed-in person's session, as far as an app may touch it (ADR 0014). */
export interface PluginSession {
  /** When the session ends unless it is extended (ISO time, UTC). */
  expiresAt: string;
  /**
   * Pushes the session's end to at least `hours` (1–3) from now, never beyond 24 hours after
   * sign-in, and renews the cookie. Returns the new end. Only works in API handlers (pages
   * cannot set cookies). Use it only while the person is actively using the app.
   */
  extend(hours?: number): Promise<string>;
}

/**
 * A branded email written by an app (ADR 0014). Plain text only: the host escapes everything
 * and puts it into the DevQuake email layout, in the recipient's language.
 */
export interface PluginEmail {
  subject: string;
  /** Short text shown in the inbox list after the subject. */
  preheader?: string;
  heading: string;
  paragraphs: string[];
  /** A small two-column table, e.g. monthly statistics. */
  rows?: [label: string, value: string][];
  button?: { label: string; url: string };
  /** Small print under the content, e.g. how to turn these emails off. */
  footer?: string;
}

/** Sends emails to people without giving the app their address (ADR 0014). */
export interface PluginMailer {
  /**
   * Sends one email to a platform user subscribed to this app (or assigned to it by the owner;
   * ADR 0036: not admins or trials without a subscription), with an active account, composed in
   * their language. Returns false when nothing was
   * sent (unknown or inactive account, no access to the app, or a failed send).
   */
  sendToUser(
    userId: number,
    compose: (locale: PluginLocale) => PluginEmail | Promise<PluginEmail>,
    options?: PluginMailOptions,
  ): Promise<boolean>;
}

/** Options of `PluginMailer.sendToUser` (ADR 0022). */
export interface PluginMailOptions {
  /**
   * Also send when the person has no access to the app (they must still have an active
   * account). Only honoured for apps with `manifest.mailWithoutAccess`.
   */
  withoutAccess?: boolean;
  /**
   * Also show it as an in-app notification (ADR 0036), in this app and on devquake.com: the
   * subject as its title, the preheader (or first paragraph) as its text and the button's URL as
   * its link. For reminders of upcoming events. Older hosts ignore it.
   */
  notify?: boolean;
  /**
   * Also keep it in the member's messages on devquake.com (Account → Messages, "From your apps",
   * ADR 0037): the subject, the text and the button's link. For things the member should be able
   * to read again, e.g. a comment on their recipe. Older hosts ignore it.
   */
  message?: boolean;
  /**
   * false: send no email, only the notification and/or the message (default true). Older hosts
   * ignore it and send the email.
   */
  email?: boolean;
}

/** Awards NPS points to members (ADR 0037), for apps with `manifest.npsAwards`. */
export interface PluginNpsApi {
  /**
   * Adds `points` (1–5) to a member's balance once per `key` (1–80 characters of a–z, 0–9 and
   * `:._-`, e.g. "recipe:12:200"): the same key again does nothing (`awarded: false`). Only for
   * active members subscribed to the app, within the app's daily limit per member.
   */
  award(
    userId: number,
    award: { points: number; key: string; note?: string },
  ): Promise<
    | { ok: true; awarded: boolean }
    | { ok: false; error: 'not-allowed' | 'invalid' | 'limit' | 'unavailable' }
  >;
}

/** Context for platform hooks (no request, no user). */
export interface PluginPlatformContext {
  pluginId: string;
  db?: PluginDatabase;
}

/** Context for the `scheduled` hook (ADR 0014). */
export interface PluginScheduledContext extends PluginPlatformContext {
  /** Absolute URL of this app, e.g. "https://workout.devquake.com", for links in emails. */
  baseUrl: string;
  /** The time of this run (injectable for tests). */
  now: Date;
  mail: PluginMailer;
  /**
   * When each of these people was last active anywhere on DevQuake (sign-in or any page or app
   * with their session), as ISO times in UTC; null when never. Undefined on older hosts
   * (ADR 0022).
   */
  lastActiveAt?: (userIds: number[]) => Promise<Record<number, string | null>>;
  /** NPS awards (ADR 0037); undefined without `manifest.npsAwards` and on older hosts. */
  nps?: PluginNpsApi;
}

/**
 * A total anyone may see (ADR 0038): counted across all members, never about a person, e.g. the
 * number of recipes. `label` is a plural noun ("Recipes"), shown under the number.
 */
export interface PluginHighlight {
  value: number;
  label: PluginLocalizedText;
  /** One emoji shown before the number. */
  icon?: string;
}

export interface PluginStat {
  label: string;
  value: number;
}

/**
 * Optional hooks the platform calls in-process (ADR 0007). Keep them fast and idempotent.
 */
export interface PluginPlatformModule {
  /** A few labelled numbers for the admin dashboard. */
  getStats?: (ctx: PluginPlatformContext) => Promise<PluginStat[]>;
  /**
   * At most three public totals of the app's main topic for project cards and the app's front
   * page (ADR 0038), e.g. recipes or shared meals. The host caches them for 10 minutes.
   */
  getHighlights?: (ctx: PluginPlatformContext) => Promise<PluginHighlight[]>;
  /**
   * Remove or anonymise everything this plugin stores about a user. Called when the user deletes
   * their account, before the platform deletes them; throwing aborts the deletion.
   */
  deleteUserData?: (userId: number, ctx: PluginPlatformContext) => Promise<void>;
  /**
   * Whether the user left something in this app that other people still see in things they own
   * (a comment, an item on someone's list, a photo in someone's event, a game played with
   * others…). Decides how an account is removed (ADR 0042): with contributions anywhere, the
   * account is kept under a "REMOVED_…" name; without, it is deleted completely.
   */
  hasContributions?: (userId: number, ctx: PluginPlatformContext) => Promise<boolean>;
  /**
   * Apps with `manifest.freeForInvited` (ADR 0043): who invited this user into something they
   * share here (a family a parent added them to…), or null. When the user opens the app without
   * access, the platform gives it to them free if that inviter has access.
   */
  invitedBy?: (userId: number, ctx: PluginPlatformContext) => Promise<number | null>;
  /**
   * The account is being removed but kept as `alias` ("REMOVED_…", ADR 0042): delete what is
   * the user's alone (their own objects, memberships, settings, private data) and keep what they
   * added to things others own, with every stored copy of their name replaced by `alias`.
   * Without this hook the platform calls deleteUserData instead. Throwing aborts the removal.
   */
  anonymizeUserData?: (userId: number, alias: string, ctx: PluginPlatformContext) => Promise<void>;
  /**
   * Background work, e.g. a monthly email (ADR 0014). The host runs it at most once an hour
   * (from site traffic, or a cron call to /api/scheduled), so it must be idempotent: record
   * what was done in the app's own database and skip it next time. Keep each run short
   * (handle a limited batch; the rest is done in the next run). Errors are logged, not shown.
   */
  scheduled?: (ctx: PluginScheduledContext) => Promise<void>;
  /**
   * The member disconnected this app from `otherApp`, or unsubscribed from one of the two
   * (ADR 0035): drop anything kept about that link (cached ids, settings). Idempotent.
   */
  onDisconnected?: (userId: number, otherApp: string, ctx: PluginPlatformContext) => Promise<void>;
}

export type SearchParams = Record<string, string | string[] | undefined>;

export interface PluginPageProps {
  /** Params extracted from the route pattern, e.g. { id: "42" } for "/posts/:id" */
  params: Record<string, string>;
  searchParams: SearchParams;
  ctx: PluginContext;
}

export interface PluginPageModule {
  default: (props: PluginPageProps) => ReactNode | Promise<ReactNode>;
  metadata?: Metadata;
  generateMetadata?: (props: PluginPageProps) => Metadata | Promise<Metadata>;
}

export interface PluginLayoutProps {
  children: ReactNode;
  ctx: PluginContext;
}

export interface PluginLayoutModule {
  default: (props: PluginLayoutProps) => ReactNode | Promise<ReactNode>;
}

export interface PluginApiArgs {
  params: Record<string, string>;
  ctx: PluginContext;
}

export type PluginApiHandler = (
  request: Request,
  args: PluginApiArgs,
) => Response | Promise<Response>;

/** An API module exports one function per HTTP method, like a Next.js route handler. */
export type PluginApiModule = Partial<Record<HttpMethod, PluginApiHandler>>;

/**
 * The contract every plugin's default export must satisfy.
 * Route patterns: "/", "/about", "/posts/:id", "/docs/*rest".
 * All modules are lazy-loaded so a plugin only costs something when it is visited.
 */
export interface PluginDefinition {
  manifest: PluginManifest;
  layout?: () => Promise<PluginLayoutModule>;
  pages: Record<string, () => Promise<PluginPageModule>>;
  /** Served on <id>.devquake.com/api/<pattern> */
  api?: Record<string, () => Promise<PluginApiModule>>;
  /** Hooks for the platform: stats and GDPR deletion (ADR 0007). */
  platform?: () => Promise<PluginPlatformModule>;
  /** The handlers of the link points in `manifest.links.offers`, by offer id (ADR 0035). */
  linkHandlers?: Record<string, () => Promise<PluginLinkHandlerModule>>;
}
