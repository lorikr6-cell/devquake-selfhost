import { matchRoute, type PluginManifest } from '@devquake/plugin-sdk';

// Which of the app's routes need a signed-in member, as on DevQuake (ADR 0009, 0022, 0023, 0047).

const clean = (path: string) => (path.length > 1 ? path.replace(/\/+$/, '') : path);

const matches = (patterns: string[] | undefined, path: string) =>
  (patterns?.length ?? 0) > 0 && matchRoute(patterns!, clean(path)) !== null;

/** The app's manual and other public pages: open to everyone. */
export function isPublicPage(manifest: PluginManifest, path: string): boolean {
  return (manifest.publicPages ?? []).some((p) => p.path === clean(path));
}

/** Links members shared publicly: pages, and GET API routes. */
export function isOpenRoute(manifest: PluginManifest, kind: 'pages' | 'api', path: string) {
  return matches(manifest.openRoutes?.[kind], path);
}

/** Routes for other websites and servers, authenticated by the app's own keys. */
export function isKeyRoute(manifest: PluginManifest, path: string) {
  return matches(manifest.keyRoutes, path);
}
