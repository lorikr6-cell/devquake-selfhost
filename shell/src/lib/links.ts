import 'server-only';
import type {
  PluginLinkedApp,
  PluginLinkResult,
  PluginLinksApi,
  PluginLocale,
  PluginManifest,
  PluginUser,
} from '@devquake/plugin-sdk';
import { localizePath } from '@devquake/ui';
import { PLUGIN_IDS, loadPlugin } from '@/generated/app';
import { database } from './db';
import {
  FROM_PARAM,
  LINK_TIMEOUT_MS,
  RETURN_PARAM,
  fillTarget,
  jsonCopy,
  linkedBothWays,
  pointDeclared,
  returnUrlWithin,
  targetDeclared,
  type AppLinks,
} from './link-rules';

// App links between the bundled apps (Household, ADR 0056), brokered in-process like DevQuake's
// host (ADR 0035): a call only works when both apps declare it; data is copied as JSON; deep
// links carry the way back. A single-tenant instance has no consent page: every member has the
// bundled apps connected, as they are one household's own apps on its own server.

type Manifests = Map<string, AppLinks & { manifest: PluginManifest }>;

const g = globalThis as unknown as { dqManifests?: Promise<Manifests> };

/** The bundled apps' manifests (loaded once). */
export function manifests(): Promise<Manifests> {
  g.dqManifests ??= Promise.all(
    PLUGIN_IDS.map(async (id) => {
      const { manifest } = await loadPlugin(id);
      return [id, { id, links: manifest.links, manifest }] as const;
    }),
  ).then((entries) => new Map(entries));
  return g.dqManifests;
}

const text = (
  value: ({ en: string } & Partial<Record<PluginLocale, string>>) | undefined,
  locale: PluginLocale,
) => (value ? (value[locale] ?? value.en) : '');

export interface Origins {
  /** An app's address, e.g. https://shopping.example.com. */
  app: (id: string) => string;
  /** The instance's home, e.g. https://example.com. */
  home: string;
}

/** ctx.links for `manifest`'s app and the signed-in member. */
export async function linksFor(
  manifest: PluginManifest,
  user: PluginUser,
  locale: PluginLocale,
  timeZone: string,
  origins: Origins,
): Promise<PluginLinksApi> {
  const all = await manifests();
  const me = all.get(manifest.id)!;
  const partners = [...all.values()].filter((o) => o.id !== me.id && linkedBothWays(me, o));
  const openUrl = (id: string) => `${origins.app(id)}${localizePath('/', locale)}`;

  const call = async (
    provider: string,
    point: string,
    input?: unknown,
  ): Promise<PluginLinkResult> => {
    const to = all.get(provider);
    if (!to) return { ok: false, error: 'unavailable' };
    if (!pointDeclared(me, to, point)) return { ok: false, error: 'not-declared' };
    const copy = jsonCopy(input);
    if (!copy) return { ok: false, error: 'invalid-input' };
    const plugin = await loadPlugin(provider);
    const load = plugin.linkHandlers?.[point];
    if (!load) return { ok: false, error: 'unavailable' };
    try {
      const handler = (await load()).default;
      const reply = await Promise.race([
        handler(copy.value, {
          pluginId: provider,
          from: me.id,
          user,
          locale,
          timeZone,
          baseUrl: origins.app(provider),
          db: plugin.manifest.database ? database(provider) : undefined,
        }),
        new Promise<'timeout'>((resolve) => setTimeout(() => resolve('timeout'), LINK_TIMEOUT_MS)),
      ]);
      if (reply === 'timeout') return { ok: false, error: 'unavailable' };
      if (!reply.ok) return { ok: false, error: reply.error };
      const out = jsonCopy(reply.data);
      return out ? { ok: true, data: out.value } : { ok: false, error: 'failed' };
    } catch (err) {
      console.error(`[links] ${provider}:${point} failed`, err);
      return { ok: false, error: 'failed' };
    }
  };

  return {
    async list(): Promise<PluginLinkedApp[]> {
      return partners.map((o) => {
        const use =
          me.links?.uses?.find((u) => u.app === o.id) ??
          o.links?.uses?.find((u) => u.app === me.id);
        return {
          app: o.id,
          name: o.manifest.name,
          iconUrl: `${origins.home}/instance/icon.svg?app=${encodeURIComponent(o.id)}`,
          benefit: text(use?.benefit, locale),
          state: 'connected',
          openUrl: openUrl(o.id),
          connectUrl: openUrl(o.id),
        };
      });
    },
    isConnected: async (other) => partners.some((o) => o.id === other),
    call: call as PluginLinksApi['call'],
    deepLink(other, target, params, options) {
      const to = all.get(other);
      if (!to || !targetDeclared(me, to, target)) return null;
      const pattern = to.links?.targets?.find((t) => t.id === target)?.path;
      const path = pattern ? fillTarget(pattern, params) : null;
      if (!path) return null;
      const url = new URL(localizePath(path, locale), origins.app(other));
      url.searchParams.set(FROM_PARAM, me.id);
      url.searchParams.set(
        RETURN_PARAM,
        returnUrlWithin(origins.app(me.id), options?.returnTo ?? '/') ?? `${origins.app(me.id)}/`,
      );
      return url.toString();
    },
    connectUrl: (other) => openUrl(other),
    async returnFrom(searchParams) {
      const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
      const from = one(searchParams[FROM_PARAM]);
      const back = one(searchParams[RETURN_PARAM]);
      const other = from ? all.get(from) : undefined;
      if (!other || !back || from === me.id || !linkedBothWays(me, other)) return null;
      const url = returnUrlWithin(origins.app(other.id), back);
      return url ? { app: other.id, name: other.manifest.name, url } : null;
    },
  };
}
