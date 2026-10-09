import { describe, expect, it } from 'vitest';
import type { PluginManifest } from '@devquake/plugin-sdk';
import { isKeyRoute, isOpenRoute, isPublicPage } from './routes';

const manifest: PluginManifest = {
  id: 'pulse',
  name: 'Pulse',
  version: '1.0.0',
  publicPages: [{ path: '/help', title: 'Manual' }],
  openRoutes: { pages: ['/p/:code'], api: ['/p/:code/photo'] },
  keyRoutes: ['/v1/events'],
};

describe('route access', () => {
  it('opens the manual and shared links to everyone', () => {
    expect(isPublicPage(manifest, '/help')).toBe(true);
    expect(isPublicPage(manifest, '/help/')).toBe(true);
    expect(isPublicPage(manifest, '/')).toBe(false);
    expect(isOpenRoute(manifest, 'pages', '/p/abc')).toBe(true);
    expect(isOpenRoute(manifest, 'api', '/p/abc/photo')).toBe(true);
    expect(isOpenRoute(manifest, 'api', '/apps')).toBe(false);
  });

  it('lets only the declared key routes skip the sign-in', () => {
    expect(isKeyRoute(manifest, '/v1/events')).toBe(true);
    expect(isKeyRoute(manifest, '/v1/events/x')).toBe(false);
    expect(isKeyRoute({ ...manifest, keyRoutes: undefined }, '/v1/events')).toBe(false);
  });
});
