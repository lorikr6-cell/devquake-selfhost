import { about } from './about';
import { definePlugin } from '@devquake/plugin-sdk';

export default definePlugin({
  manifest: {
    id: 'expenses',
    name: 'Shared expenses',
    version: '0.2.0',
    description:
      'Who paid what on a trip, in a flat, for a couple or an event, who owes whom, and the fewest transfers to settle up. Split equally, by shares, by percent or exact amounts; friends join by link or QR.',
    status: 'active',
    // Own MySQL database from EXPENSES_DB_* (ADR 0007).
    database: true,
    // Open to everyone and listed in the app's sitemap (ADR 0009).
    publicPages: [{ path: '/help', title: 'User manual' }],
    about,
    // People a member invites into a group join without access and get the app free (ADR 0043).
    signedInRoutes: { pages: ['/join/:code'], api: ['/join'] },
    freeForInvited: true,
    // Links with other apps (ADR 0035): bills and shopping lists become shared expenses.
    links: {
      offers: [
        {
          id: 'groups.overview',
          kind: 'read',
          title: {
            en: 'See the names and currencies of your expense groups and who is in them',
            de: 'Die Namen und Währungen deiner Ausgabengruppen sehen und wer darin ist',
            ro: 'Să vadă numele și monedele grupurilor tale de cheltuieli și cine e în ele',
            hu: 'Lássa a kiadáscsoportjaid nevét, pénznemét, és hogy kik vannak bennük',
          },
        },
        {
          id: 'expense.add',
          kind: 'write',
          perMinute: 20,
          title: {
            en: 'Add expenses you paid to your groups',
            de: 'Ausgaben, die du bezahlt hast, zu deinen Gruppen hinzufügen',
            ro: 'Să adauge în grupurile tale cheltuieli plătite de tine',
            hu: 'Az általad fizetett kiadásokat hozzáadja a csoportjaidhoz',
          },
        },
      ],
      targets: [
        {
          id: 'group',
          path: '/groups/:id',
          title: {
            en: 'an expense group',
            de: 'eine Ausgabengruppe',
            ro: 'un grup de cheltuieli',
            hu: 'egy kiadáscsoportot',
          },
        },
        {
          id: 'expense',
          path: '/groups/:id/expenses/:expenseId',
          title: {
            en: 'a shared expense',
            de: 'eine geteilte Ausgabe',
            ro: 'o cheltuială comună',
            hu: 'egy közös kiadást',
          },
        },
      ],
      uses: [
        {
          app: 'utilities',
          targets: ['bill'],
          benefit: {
            en: 'Add a utility bill to a shared group with everyone’s exact share, and open the bill from the expense.',
            de: 'Eine Nebenkostenrechnung mit dem genauen Anteil aller zu einer Gruppe hinzufügen und die Rechnung von der Ausgabe aus öffnen.',
            ro: 'Adaugi o factură de utilități într-un grup comun, cu partea exactă a fiecăruia, și deschizi factura din cheltuială.',
            hu: 'Egy rezsiszámlát mindenki pontos részével közös csoportba teszel, és a kiadásból megnyitod a számlát.',
          },
        },
        {
          app: 'shopping',
          targets: ['list'],
          benefit: {
            en: 'Turn what you bought on a shared shopping list into an expense split between the list’s people.',
            de: 'Was du auf einer geteilten Einkaufsliste gekauft hast, wird eine Ausgabe, geteilt unter den Leuten der Liste.',
            ro: 'Ce ai cumpărat de pe o listă comună devine o cheltuială împărțită între oamenii listei.',
            hu: 'Amit egy közös bevásárlólistáról vettél, abból a lista résztvevői között megosztott kiadás lesz.',
          },
        },
      ],
    },
  },
  layout: () => import('./layout'),
  pages: {
    '/': () => import('./pages/home'),
    '/groups/:id': () => import('./pages/group'),
    '/groups/:id/balances': () => import('./pages/balances'),
    '/groups/:id/activity': () => import('./pages/activity'),
    '/groups/:id/stats': () => import('./pages/stats'),
    '/groups/:id/members': () => import('./pages/members'),
    '/groups/:id/expenses/:expenseId': () => import('./pages/expense'),
    '/join/:code': () => import('./pages/join'),
    '/help': () => import('./pages/help'),
  },
  api: {
    '/health': () => import('./api/health'),
    '/groups': () => import('./api/groups'),
    '/groups/:id': () => import('./api/group'),
    '/groups/:id/expenses': () => import('./api/expenses'),
    '/groups/:id/expenses/:expenseId': () => import('./api/expense'),
    '/groups/:id/expenses/:expenseId/comments': () => import('./api/comments'),
    '/groups/:id/comments/:commentId': () => import('./api/comment'),
    '/groups/:id/payments': () => import('./api/payments'),
    '/groups/:id/payments/:paymentId': () => import('./api/payment'),
    '/groups/:id/invite': () => import('./api/invite'),
    '/groups/:id/members': () => import('./api/members'),
    '/groups/:id/members/:memberId': () => import('./api/member'),
    '/join': () => import('./api/join'),
  },
  linkHandlers: {
    'groups.overview': () => import('./links/groups-overview'),
    'expense.add': () => import('./links/expense-add'),
  },
  platform: () => import('./platform'),
});
