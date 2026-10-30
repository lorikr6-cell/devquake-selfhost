import { about } from './about';
import { definePlugin } from '@devquake/plugin-sdk';

export default definePlugin({
  manifest: {
    id: 'venue',
    name: 'Venue',
    version: '0.3.0',
    description:
      'The business side of a café, bistro, fast food or bar: the venue with its country’s VAT rates, a menu with allergens, staff with PINs for a shared tablet, and a public menu for guests.',
    status: 'active',
    // Own MySQL database from VENUE_DB_* (ADR 0007).
    database: true,
    // Open to everyone and listed in the app's sitemap (ADR 0009).
    publicPages: [{ path: '/help', title: 'User manual' }],
    // For guests and staff tablets, without a DevQuake account (ADR 0047, 0080): the public menu
    // (while the owner keeps it public), a table's sticker, the guests' bill, the tablet's floor.
    openRoutes: {
      pages: ['/m/:slug', '/t/:code', '/b/:code', '/tablet'],
      api: ['/menu-bg/:slug'],
    },
    // The floor's API (the owner's browser or an enabled tablet; the app checks the tablet cookie
    // and the Origin itself) and the guests' bill (its code is the key; ADR 0080).
    keyRoutes: [
      '/floor/session',
      '/floor/tables',
      '/floor/tables/:id/bill',
      '/floor/bills/:id',
      '/floor/bills/:id/lines',
      '/floor/bills/:id/finalize',
      '/floor/lines/:id',
      '/guest/:code',
    ],
    about,
  },
  layout: () => import('./layout'),
  platform: () => import('./platform'),
  pages: {
    '/': () => import('./pages/home'),
    '/settings': () => import('./pages/settings'),
    '/menu': () => import('./pages/menu'),
    '/menu/design': () => import('./pages/menu-design'),
    '/menu/print': () => import('./pages/menu-print'),
    '/staff': () => import('./pages/staff'),
    '/tablets': () => import('./pages/tablets'),
    '/tables': () => import('./pages/tables'),
    '/floor': () => import('./pages/floor'),
    '/tablet': () => import('./pages/floor'),
    '/t/:code': () => import('./pages/table'),
    '/b/:code': () => import('./pages/bill'),
    '/reports': () => import('./pages/reports'),
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
    '/tables': () => import('./api/tables'),
    '/tables/:id': () => import('./api/table'),
    '/floor/session': () => import('./api/floor-session'),
    '/floor/tables': () => import('./api/floor-tables'),
    '/floor/tables/:id/bill': () => import('./api/floor-table-bill'),
    '/floor/bills/:id': () => import('./api/floor-bill'),
    '/floor/bills/:id/lines': () => import('./api/floor-lines'),
    '/floor/bills/:id/finalize': () => import('./api/floor-finalize'),
    '/floor/lines/:id': () => import('./api/floor-line'),
    '/guest/:code': () => import('./api/guest-bill'),
    '/menu/design': () => import('./api/menu-design'),
    '/menu/design/background': () => import('./api/menu-background'),
    '/menu-bg/:slug': () => import('./api/public-background'),
  },
});
