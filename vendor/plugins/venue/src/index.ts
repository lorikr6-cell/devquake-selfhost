import { about } from './about';
import { definePlugin } from '@devquake/plugin-sdk';

export default definePlugin({
  manifest: {
    id: 'venue',
    name: 'Venue',
    version: '0.1.0',
    description:
      'The business side of a café, bistro, fast food or bar: the venue with its country’s VAT rates, a menu with allergens, staff with PINs for a shared tablet, and a public menu for guests.',
    status: 'active',
    // Own MySQL database from VENUE_DB_* (ADR 0007).
    database: true,
    // Open to everyone and listed in the app's sitemap (ADR 0009).
    publicPages: [{ path: '/help', title: 'User manual' }],
    // The venue's menu for guests (ADR 0047): shown only while the owner keeps it public.
    openRoutes: { pages: ['/m/:slug'] },
    about,
  },
  layout: () => import('./layout'),
  platform: () => import('./platform'),
  pages: {
    '/': () => import('./pages/home'),
    '/settings': () => import('./pages/settings'),
    '/menu': () => import('./pages/menu'),
    '/staff': () => import('./pages/staff'),
    '/tablets': () => import('./pages/tablets'),
    '/m/:slug': () => import('./pages/public-menu'),
    '/help': () => import('./pages/help'),
    '/about': () => import('./pages/about'),
  },
  api: {
    '/health': () => import('./api/health'),
    '/venue': () => import('./api/venue'),
    '/staff': () => import('./api/staff'),
    '/staff/:id': () => import('./api/staff-member'),
    '/tablets': () => import('./api/tablets'),
    '/tablets/:id': () => import('./api/tablet'),
    '/categories': () => import('./api/categories'),
    '/categories/:id': () => import('./api/category'),
    '/items': () => import('./api/items'),
    '/items/:id': () => import('./api/item'),
    '/tips': () => import('./api/tips'),
  },
});
