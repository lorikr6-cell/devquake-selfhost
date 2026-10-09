import type { PluginLinkDeclarations } from '@devquake/plugin-sdk';

// App links (ADR 0035 in DevQuake): which link points and deep-link targets work between two
// apps, filling a target's path and copying data as JSON. The same rules as DevQuake's
// apps/host/src/lib/link-rules.ts, so the bundled apps behave as they do there. Pure, tested.

export const MAX_LINK_BYTES = 64 * 1024;
export const LINK_TIMEOUT_MS = 5000;

/** Query parameters reserved for the shell on app pages (the way back from a deep link). */
export const FROM_PARAM = 'dq_from';
export const RETURN_PARAM = 'dq_return';

export interface AppLinks {
  id: string;
  links: PluginLinkDeclarations | undefined;
}

/** True when `caller` declares it uses `point` of `provider` and the provider offers it to it. */
export function pointDeclared(caller: AppLinks, provider: AppLinks, point: string): boolean {
  const use = caller.links?.uses?.find((u) => u.app === provider.id);
  if (!use?.points?.includes(point)) return false;
  const offer = provider.links?.offers?.find((o) => o.id === point);
  if (!offer) return false;
  return !offer.apps || offer.apps.includes(caller.id);
}

/** True when `caller` declares it opens `target` of `provider` and the provider offers it. */
export function targetDeclared(caller: AppLinks, provider: AppLinks, target: string): boolean {
  const use = caller.links?.uses?.find((u) => u.app === provider.id);
  if (!use?.targets?.includes(target)) return false;
  return Boolean(provider.links?.targets?.some((t) => t.id === target));
}

/** True when either app declares it works with the other and the other declares it back. */
export function linkedBothWays(a: AppLinks, b: AppLinks): boolean {
  const aUsesB = a.links?.uses?.some((u) => u.app === b.id) ?? false;
  const bUsesA = b.links?.uses?.some((u) => u.app === a.id) ?? false;
  const bOffersA = (b.links?.offers?.length ?? 0) + (b.links?.targets?.length ?? 0) > 0;
  const aOffersB = (a.links?.offers?.length ?? 0) + (a.links?.targets?.length ?? 0) > 0;
  return (aUsesB && bOffersA) || (bUsesA && aOffersB);
}

/** "/lists/:id" + { id: "4" } → "/lists/4"; null when a parameter is missing. */
export function fillTarget(pattern: string, params: Record<string, string> = {}): string | null {
  const parts: string[] = [];
  for (const part of pattern.split('/')) {
    if (part.startsWith('*')) return null;
    if (part.startsWith(':')) {
      const value = params[part.slice(1)];
      if (value === undefined || value === '') return null;
      parts.push(encodeURIComponent(value));
    } else {
      parts.push(part);
    }
  }
  return parts.join('/') || '/';
}

/** A JSON copy of a value, or null when it is not JSON or larger than `max` bytes. */
export function jsonCopy(value: unknown, max = MAX_LINK_BYTES): { value: unknown } | null {
  if (value === undefined) return { value: undefined };
  let text: string;
  try {
    text = JSON.stringify(value);
  } catch {
    return null;
  }
  if (text === undefined || new TextEncoder().encode(text).byteLength > max) return null;
  return { value: JSON.parse(text) };
}

/** A way back that stays inside `origin` (an app's address), as an absolute URL; else null. */
export function returnUrlWithin(origin: string, back: string): string | null {
  try {
    const url = new URL(back, origin);
    return url.origin === new URL(origin).origin ? url.toString() : null;
  } catch {
    return null;
  }
}
