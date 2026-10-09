import { about } from './about';
import { definePlugin } from '@devquake/plugin-sdk';

export default definePlugin({
  manifest: {
    id: 'shopping',
    name: 'Shared shopping lists',
    version: '0.21.0',
    description:
      'Shared shopping carts planned by date: a calendar, items grouped by store (type, location, description), prices, totals and statistics, shared with invite links or your DevQuake referrals.',
    status: 'active',
    // Own MySQL database from SHOPPING_DB_* (ADR 0007).
    database: true,
    // Open to everyone and listed in the app's sitemap (ADR 0009).
    publicPages: [{ path: '/help', title: 'User manual' }],
    about,
    // Links with other apps (ADR 0035).
    links: {
      offers: [
        {
          id: 'calendar.events',
          kind: 'read',
          perMinute: 60,
          title: {
            en: 'See the names and dates of your shopping lists',
            de: 'Die Namen und Daten deiner Einkaufslisten sehen',
            ro: 'Să vadă numele și datele listelor tale de cumpărături',
            hu: 'Lássa a bevásárlólistáid nevét és dátumát',
          },
        },
        {
          id: 'lists.overview',
          kind: 'read',
          title: {
            en: 'See your upcoming shopping lists and how many items are still open',
            de: 'Deine nächsten Einkaufslisten sehen und wie viele Artikel noch offen sind',
            ro: 'Să vadă următoarele tale liste de cumpărături și câte produse mai sunt',
            hu: 'Lássa a következő bevásárlólistáidat, és hogy hány tétel van még hátra',
          },
        },
        {
          id: 'list.add-items',
          kind: 'write',
          title: {
            en: 'Add items to your shopping lists',
            de: 'Artikel zu deinen Einkaufslisten hinzufügen',
            ro: 'Să adauge produse în listele tale de cumpărături',
            hu: 'Tételeket adjon a bevásárlólistáidhoz',
          },
        },
      ],
      targets: [
        {
          id: 'list',
          path: '/lists/:id',
          title: {
            en: 'a shopping list',
            de: 'eine Einkaufsliste',
            ro: 'o listă de cumpărături',
            hu: 'egy bevásárlólista',
          },
        },
      ],
      uses: [
        {
          app: 'family',
          points: ['calendar.events'],
          targets: ['calendar'],
          benefit: {
            en: 'Family events show next to your shopping lists, so you can plan shopping around them.',
            de: 'Familientermine erscheinen neben deinen Einkaufslisten, damit du den Einkauf danach planen kannst.',
            ro: 'Evenimentele familiei apar lângă listele tale de cumpărături, ca să-ți planifici cumpărăturile în funcție de ele.',
            hu: 'A családi események megjelennek a bevásárlólistáid mellett, így ahhoz igazíthatod a bevásárlást.',
          },
        },
        {
          app: 'workout',
          points: ['calendar.events'],
          targets: ['plan'],
          benefit: {
            en: 'Your training sessions show next to your shopping lists.',
            de: 'Deine Trainings erscheinen neben deinen Einkaufslisten.',
            ro: 'Antrenamentele tale apar lângă listele tale de cumpărături.',
            hu: 'Az edzéseid megjelennek a bevásárlólistáid mellett.',
          },
        },
        {
          app: 'utilities',
          points: ['calendar.events'],
          targets: ['bill'],
          benefit: {
            en: 'Due dates of your utility bills show next to your shopping lists.',
            de: 'Fälligkeitstermine deiner Nebenkostenrechnungen erscheinen neben deinen Einkaufslisten.',
            ro: 'Scadențele facturilor de utilități apar lângă listele tale de cumpărături.',
            hu: 'A rezsiszámláid esedékessége megjelenik a bevásárlólistáid mellett.',
          },
        },
        {
          app: 'expenses',
          points: ['groups.overview', 'expense.add'],
          targets: ['expense'],
          benefit: {
            en: 'What you bought on a shared list becomes an expense, split equally between the list’s people.',
            de: 'Was du auf einer geteilten Liste gekauft hast, wird eine Ausgabe, gleich geteilt unter den Leuten der Liste.',
            ro: 'Ce ai cumpărat de pe o listă comună devine o cheltuială, împărțită egal între oamenii listei.',
            hu: 'Amit egy közös listáról vettél, abból a lista résztvevői között egyenlően megosztott kiadás lesz.',
          },
        },
      ],
    },
  },
  layout: () => import('./layout'),
  pages: {
    '/': () => import('./pages/home'),
    '/join/:code': () => import('./pages/join'),
    '/lists/:id': () => import('./pages/list'),
    '/lists/:id/share': () => import('./pages/share'),
    '/help': () => import('./pages/help'),
  },
  api: {
    '/health': () => import('./api/health'),
    '/lists': () => import('./api/lists'),
    '/join': () => import('./api/join'),
    '/copy': () => import('./api/copy'),
    '/suggestions': () => import('./api/suggestions'),
    '/changes': () => import('./api/changes'),
    '/events': () => import('./api/events'),
    '/events/:id': () => import('./api/event'),
    '/lists/:id': () => import('./api/list'),
    '/lists/:id/items': () => import('./api/items'),
    '/lists/:id/items/:itemId': () => import('./api/item'),
    '/lists/:id/items/:itemId/photo': () => import('./api/photo'),
    '/lists/:id/items/:itemId/price': () => import('./api/item-price'),
    '/lists/:id/stores': () => import('./api/stores'),
    '/lists/:id/nearby-stores': () => import('./api/nearby-stores'),
    '/lists/:id/stores/:storeId': () => import('./api/store'),
    '/logos/:key': () => import('./api/logo'),
    '/lists/:id/clear-done': () => import('./api/clear-done'),
    '/lists/:id/invite': () => import('./api/invite'),
    '/lists/:id/members': () => import('./api/members'),
    '/lists/:id/members/:userId': () => import('./api/member'),
    '/lists/:id/expense': () => import('./api/list-expense'),
  },
  platform: () => import('./platform'),
  linkHandlers: {
    'calendar.events': () => import('./links/calendar-events'),
    'lists.overview': () => import('./links/lists-overview'),
    'list.add-items': () => import('./links/add-items'),
  },
});
