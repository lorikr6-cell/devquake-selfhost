import { about } from './about';
import { definePlugin } from '@devquake/plugin-sdk';

export default definePlugin({
  manifest: {
    id: 'pulse',
    name: 'Pulse',
    version: '0.6.0',
    description:
      'A realtime events API: your website or server sends events with your own key:value data, and every connected browser receives them live. Secured with website verification, secret keys and short-lived client tokens.',
    status: 'active',
    // Own MySQL database from PULSE_DB_* (ADR 0007).
    database: true,
    // Open to everyone and listed in the app's sitemap (ADR 0009).
    publicPages: [{ path: '/help', title: 'User manual' }],
    about,
    // The developer API: called by members' websites and servers with their keys (ADR 0023).
    keyRoutes: ['/v1/events', '/v1/stream', '/v1/poll', '/v1/client'],
  },
  layout: () => import('./layout'),
  pages: {
    '/': () => import('./pages/home'),
    '/apps/:id': () => import('./pages/app'),
    '/apps/:id/test': () => import('./pages/test'),
    '/demo': () => import('./pages/demo'),
    '/help': () => import('./pages/help'),
  },
  api: {
    '/health': () => import('./api/health'),
    '/apps': () => import('./api/apps'),
    '/apps/:id': () => import('./api/app'),
    '/apps/:id/secret': () => import('./api/secret'),
    '/apps/:id/origins': () => import('./api/origins'),
    '/apps/:id/origins/:originId': () => import('./api/origin'),
    '/apps/:id/event-types': () => import('./api/event-types'),
    '/apps/:id/test-token': () => import('./api/test-token'),
    '/demo/token': () => import('./api/demo-token'),
    '/admin/calls': () => import('./api/admin/calls'),
    '/v1/events': () => import('./api/v1/events'),
    '/v1/stream': () => import('./api/v1/stream'),
    '/v1/poll': () => import('./api/v1/poll'),
    '/v1/client': () => import('./api/v1/client'),
  },
  platform: () => import('./platform'),
});
