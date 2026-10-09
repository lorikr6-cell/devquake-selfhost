import { about } from './about';
import { definePlugin } from '@devquake/plugin-sdk';

export default definePlugin({
  manifest: {
    id: 'utilities',
    name: 'Utility bill manager',
    version: '0.11.0',
    description:
      'Shared utility bills: upload the provider’s PDF, send meter readings with a photo, split the bill by consumption or equally, record who paid what with carry-over, and follow consumption, payments and prices in a calendar and statistics.',
    status: 'active',
    // Own MySQL database from UTILITIES_DB_* (ADR 0007).
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
            en: 'See the due dates of your utility bills',
            de: 'Die Fälligkeitstermine deiner Nebenkostenrechnungen sehen',
            ro: 'Să vadă scadențele facturilor tale de utilități',
            hu: 'Lássa a rezsiszámláid esedékességét',
          },
        },
      ],
      targets: [
        {
          id: 'bill',
          path: '/bills/:id',
          title: {
            en: 'a utility bill',
            de: 'eine Nebenkostenrechnung',
            ro: 'o factură de utilități',
            hu: 'egy rezsiszámla',
          },
        },
      ],
      uses: [
        {
          app: 'family',
          points: ['calendar.events'],
          targets: ['calendar'],
          benefit: {
            en: 'Family events show under your bills calendar.',
            de: 'Familientermine erscheinen unter deinem Rechnungskalender.',
            ro: 'Evenimentele familiei apar sub calendarul facturilor.',
            hu: 'A családi események megjelennek a számlanaptárad alatt.',
          },
        },
        {
          app: 'shopping',
          points: ['calendar.events'],
          targets: ['list'],
          benefit: {
            en: 'Your shopping days show under your bills calendar.',
            de: 'Deine Einkaufstage erscheinen unter deinem Rechnungskalender.',
            ro: 'Zilele tale de cumpărături apar sub calendarul facturilor.',
            hu: 'A bevásárlónapjaid megjelennek a számlanaptárad alatt.',
          },
        },
        {
          app: 'workout',
          points: ['calendar.events'],
          targets: ['plan'],
          benefit: {
            en: 'Your training sessions show under your bills calendar.',
            de: 'Deine Trainings erscheinen unter deinem Rechnungskalender.',
            ro: 'Antrenamentele tale apar sub calendarul facturilor.',
            hu: 'Az edzéseid megjelennek a számlanaptárad alatt.',
          },
        },
        {
          app: 'expenses',
          points: ['groups.overview', 'expense.add'],
          targets: ['expense'],
          benefit: {
            en: 'Put a bill into a shared expense group with everyone’s exact share, next to your other shared costs.',
            de: 'Eine Rechnung mit dem genauen Anteil aller in eine Ausgabengruppe legen, neben eure anderen geteilten Kosten.',
            ro: 'Pui o factură într-un grup de cheltuieli comune, cu partea exactă a fiecăruia, lângă celelalte costuri împărțite.',
            hu: 'Egy számlát mindenki pontos részével közös kiadáscsoportba teszel, a többi megosztott költség mellé.',
          },
        },
      ],
    },
  },
  layout: () => import('./layout'),
  pages: {
    '/': () => import('./pages/home'),
    '/profile': () => import('./pages/profile'),
    '/join/:code': () => import('./pages/join'),
    '/utilities/:id': () => import('./pages/utility'),
    '/utilities/:id/share': () => import('./pages/share'),
    '/utilities/:id/bills/new': () => import('./pages/bill-new'),
    '/bills/:id': () => import('./pages/bill'),
    '/bills/:id/edit': () => import('./pages/bill-edit'),
    '/help': () => import('./pages/help'),
  },
  api: {
    '/health': () => import('./api/health'),
    '/profile': () => import('./api/profile'),
    '/address-suggest': () => import('./api/address-suggest'),
    '/utility-place': () => import('./api/utility-place'),
    '/utility-suggestions': () => import('./api/utility-suggestions'),
    '/join': () => import('./api/join'),
    '/utilities': () => import('./api/utilities'),
    '/utilities/:id': () => import('./api/utility'),
    '/utilities/:id/bills': () => import('./api/bills'),
    '/utilities/:id/read-pdf': () => import('./api/read-pdf'),
    '/utilities/:id/invite': () => import('./api/invite'),
    '/utilities/:id/members': () => import('./api/members'),
    '/utilities/:id/members/:userId': () => import('./api/member'),
    '/bills/:id': () => import('./api/bill'),
    '/bills/:id/file': () => import('./api/bill-file'),
    '/bills/:id/provider-paid': () => import('./api/provider-paid'),
    '/bills/:id/readings/:userId': () => import('./api/reading'),
    '/bills/:id/readings/:userId/photo': () => import('./api/reading-photo'),
    '/bills/:id/payments/:userId': () => import('./api/payment'),
    '/bills/:id/comments': () => import('./api/comments'),
    '/bills/:id/comments/:commentId': () => import('./api/comment'),
    '/bills/:id/expense': () => import('./api/bill-expense'),
  },
  platform: () => import('./platform'),
  linkHandlers: {
    'calendar.events': () => import('./links/calendar-events'),
  },
});
