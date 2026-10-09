import { about } from './about';
import { definePlugin } from '@devquake/plugin-sdk';

export default definePlugin({
  manifest: {
    id: 'darts',
    name: 'Darts',
    version: '0.6.2',
    description:
      'Darts on your phone: practise alone with drills made from your weak spots, play casual games with friends who join by QR code, or run tournaments on your boards with a knock-out bracket, entry fees and live scores. 501/301, Cricket, Shanghai, Around the Clock, Killer and more, with finishing suggestions.',
    status: 'active',
    // Own MySQL database from DARTS_DB_* (ADR 0007).
    database: true,
    // Open to everyone and listed in the app's sitemap (ADR 0009).
    publicPages: [{ path: '/help', title: 'User manual' }],
    about,
    // A shared match can be watched by any signed-in member with its link (ADR 0022).
    signedInRoutes: { pages: ['/watch/:code'], api: ['/watch/:code'] },
  },
  layout: () => import('./layout'),
  pages: {
    '/': () => import('./pages/home'),
    '/profile': () => import('./pages/profile'),
    '/practice': () => import('./pages/practice'),
    '/casual': () => import('./pages/casual'),
    '/tournaments': () => import('./pages/tournaments'),
    '/tournaments/new': () => import('./pages/tournament-new'),
    '/tournaments/:id': () => import('./pages/tournament'),
    '/games/:id': () => import('./pages/game'),
    '/watch/:code': () => import('./pages/watch'),
    '/join/:code': () => import('./pages/join'),
    '/stats': () => import('./pages/stats'),
    '/help': () => import('./pages/help'),
  },
  api: {
    '/health': () => import('./api/health'),
    '/profile': () => import('./api/profile'),
    '/games': () => import('./api/games'),
    '/games/:id': () => import('./api/game'),
    '/games/:id/start': () => import('./api/game-start'),
    '/games/:id/visits': () => import('./api/visits'),
    '/games/:id/players/:playerId': () => import('./api/game-player'),
    '/join': () => import('./api/join'),
    '/watch/:code': () => import('./api/watch'),
    '/tournaments': () => import('./api/tournaments'),
    '/tournaments/:id': () => import('./api/tournament'),
    '/tournaments/:id/boards': () => import('./api/boards'),
    '/tournaments/:id/boards/:boardId': () => import('./api/board'),
    '/tournaments/:id/players/:playerId': () => import('./api/tournament-player'),
    '/tournaments/:id/rounds': () => import('./api/rounds'),
    '/drills': () => import('./api/drills'),
    '/drills/:id': () => import('./api/drill'),
  },
  platform: () => import('./platform'),
});
