import { about } from './about';
import { definePlugin } from '@devquake/plugin-sdk';

export default definePlugin({
  manifest: {
    id: 'utilities',
    name: 'Utility bill manager',
    version: '0.12.0',
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
            it: 'Vedere le scadenze delle tue bollette',
            es: 'Ver los vencimientos de tus facturas de suministros',
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
            it: 'una bolletta',
            es: 'una factura de suministros',
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
            it: 'Gli eventi di famiglia compaiono sotto il calendario delle bollette.',
            es: 'Los eventos familiares aparecen bajo tu calendario de facturas.',
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
            it: 'I tuoi giorni della spesa compaiono sotto il calendario delle bollette.',
            es: 'Tus días de compra aparecen bajo tu calendario de facturas.',
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
            it: 'I tuoi allenamenti compaiono sotto il calendario delle bollette.',
            es: 'Tus entrenamientos aparecen bajo tu calendario de facturas.',
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
            it: 'Metti una bolletta in un gruppo di spese condivise con la parte esatta di ognuno, accanto alle altre spese condivise.',
            es: 'Pon una factura en un grupo de gastos compartidos con la parte exacta de cada uno, junto a tus otros gastos compartidos.',
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
