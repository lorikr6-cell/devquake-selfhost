import { about } from './about';
import { definePlugin } from '@devquake/plugin-sdk';

export default definePlugin({
  manifest: {
    id: 'darts',
    name: 'Darts',
    version: '0.9.0',
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
    // Links with other apps (ADR 0035): the games you played, for apps such as the journal.
    links: {
      offers: [
        {
          id: 'activity.day',
          kind: 'read',
          perMinute: 60,
          title: {
            en: 'See the darts games you played and who won',
            de: 'Die Dartspiele sehen, die du gespielt hast, und wer gewonnen hat',
            ro: 'Să vadă jocurile de darts pe care le-ai jucat și cine a câștigat',
            hu: 'Lássa a lejátszott darts játékaidat és hogy ki nyert',
            it: 'Vedere le partite di freccette che hai giocato e chi ha vinto',
            es: 'Ver las partidas de dardos que jugaste y quién ganó',
          },
        },
      ],
      targets: [
        {
          id: 'game',
          path: '/games/:id',
          title: {
            en: 'a darts game',
            de: 'ein Dartspiel',
            ro: 'un joc de darts',
            hu: 'egy darts játékot',
            it: 'una partita di freccette',
            es: 'una partida de dardos',
          },
        },
      ],
    },
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
  linkHandlers: {
    'activity.day': () => import('./links/activity-day'),
  },
});
