import 'server-only';
import { cookies, headers } from 'next/headers';
import { cache } from 'react';
import {
  parseChangelog,
  type PluginContext,
  type PluginLocale,
  type PluginManifest,
  type PluginSettings,
} from '@devquake/plugin-sdk';
import { isLocale, isTimeZone } from '@devquake/ui';
import { APP, CHANGELOGS } from '@/generated/app';
import { database } from './db';
import { env, flag } from './env';
import { extendSession, getSessionUser } from './session';
import { publicUrl } from './url';
import { listMembers } from './users';

// What the app gets from its host (PluginContext, ADR 0007 on DevQuake), made from the
// instance's own parts. Platform-only parts (NPS points, app links, shared profile) are left
// out: the plugins already work without them.

export const LOCALE_HEADER = 'x-dq-locale';

export const getLocale = cache(async (): Promise<PluginLocale> => {
  const h = await headers();
  const fromPath = h.get(LOCALE_HEADER);
  if (isLocale(fromPath)) return fromPath;
  const fallback = env('DEFAULT_LOCALE');
  return isLocale(fallback) ? fallback : 'en';
});

/** "aiEnabled" → APP_SETTING_AI_ENABLED. */
export const settingEnvName = (key: string) =>
  `APP_SETTING_${key.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toUpperCase()}`;

function settingsFor(manifest: PluginManifest): PluginSettings {
  const known = new Map((manifest.adminSettings ?? []).map((s) => [s.key, s]));
  return {
    async enabled(key) {
      const setting = known.get(key);
      if (!setting) return false;
      return flag(settingEnvName(key), setting.defaultOn ?? false);
    },
    async value(key) {
      if (!known.has(key)) return null;
      return env(settingEnvName(key)) ?? null;
    },
  };
}

export const buildContext = cache(async (manifest: PluginManifest): Promise<PluginContext> => {
  const h = await headers();
  const base = publicUrl(h);
  const locale = await getLocale();
  const tz = (await cookies()).get('dq_tz')?.value;
  const session = await getSessionUser().catch(() => null);
  const changelog = CHANGELOGS[locale] ?? CHANGELOGS.en;
  return {
    pluginId: manifest.id,
    rootDomain: new URL(base).host,
    baseUrl: base,
    // There is no separate platform: "DevQuake" links in the app lead to the instance itself.
    hostUrl: base,
    user: session
      ? { id: session.id, displayName: session.displayName, isAdmin: session.role === 'admin' }
      : null,
    db: manifest.database ? database() : undefined,
    people: session
      ? {
          // Everyone in this instance, as the person's "network".
          async referrals() {
            const members = await listMembers();
            return members
              .filter((m) => m.id !== session.id)
              .map((m) => ({
                id: m.id,
                displayName: m.displayName,
                relation: 'referred' as const,
                hasAccess: true,
              }));
          },
        }
      : undefined,
    changelog: changelog ? parseChangelog(changelog) : [],
    timeZone: tz && isTimeZone(tz) ? tz : 'UTC',
    locale,
    session: session
      ? {
          expiresAt: session.expiresAt.toISOString(),
          extend: async (hours = 3) => (await extendSession(session, hours)).toISOString(),
        }
      : null,
    app: { name: APP.name, iconUrl: `${base}/instance/icon.svg` },
    // A single tenant: every active member may use the app fully.
    accessOf: async (userIds) => {
      if (userIds.length === 0) return {};
      const rows = await database().query<{ id: number }>(
        `SELECT id FROM dq_users WHERE active = 1 AND id IN (${userIds.map(() => '?').join(',')})`,
        userIds,
      );
      const active = new Set(rows.map((r) => Number(r.id)));
      return Object.fromEntries(userIds.map((id) => [id, active.has(id) ? 'member' : 'none']));
    },
    settings: manifest.adminSettings?.length ? settingsFor(manifest) : undefined,
  };
});
