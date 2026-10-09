import { about } from './about';
import { definePlugin } from '@devquake/plugin-sdk';

export default definePlugin({
  manifest: {
    id: 'meals',
    name: 'Meal planner',
    version: '0.4.1',
    description:
      'Plan the week’s meals for your household with recipes from your cookbook: servings for the people eating, a suggested week for your diet, nutrition per day and one shopping list for the week.',
    status: 'active',
    // Own MySQL database from MEALS_DB_* (ADR 0007).
    database: true,
    // Open to everyone and listed in the app's sitemap (ADR 0009).
    publicPages: [{ path: '/help', title: 'User manual' }],
    about,
    // Links with other apps (ADR 0035).
    links: {
      offers: [
        {
          id: 'households.list',
          kind: 'read',
          title: {
            en: 'See the names of your households',
            de: 'Die Namen deiner Haushalte sehen',
            ro: 'Să vadă numele gospodăriilor tale',
            hu: 'Lássa a háztartásaid nevét',
          },
        },
        {
          id: 'meal.add',
          kind: 'write',
          title: {
            en: 'Put a recipe in a meal of your plan',
            de: 'Ein Rezept in eine Mahlzeit deines Plans setzen',
            ro: 'Să pună o rețetă într-o masă din planul tău',
            hu: 'Receptet tegyen a terved egy étkezésébe',
          },
        },
        {
          id: 'calendar.events',
          kind: 'read',
          perMinute: 60,
          title: {
            en: 'See the names of the meals you planned',
            de: 'Die Namen deiner geplanten Mahlzeiten sehen',
            ro: 'Să vadă numele meselor planificate de tine',
            hu: 'Lássa a megtervezett étkezéseid nevét',
          },
        },
      ],
      targets: [
        {
          id: 'week',
          path: '/h/:id',
          title: {
            en: 'the week’s meal plan',
            de: 'den Essensplan der Woche',
            ro: 'planul de mese al săptămânii',
            hu: 'a heti étkezéstervet',
          },
        },
      ],
      uses: [
        {
          app: 'cookbook',
          points: ['recipes.search', 'recipe.get'],
          targets: ['recipe'],
          benefit: {
            en: 'Plan the week with recipes from your cookbook: servings, nutrition and ingredients come with them.',
            de: 'Plane die Woche mit Rezepten aus deinem Kochbuch: Portionen, Nährwerte und Zutaten kommen mit.',
            ro: 'Planifică săptămâna cu rețete din cartea ta de bucate: porțiile, valorile nutritive și ingredientele vin cu ele.',
            hu: 'Tervezd meg a hetet a szakácskönyved receptjeivel: az adagok, a tápérték és a hozzávalók is jönnek velük.',
          },
        },
        {
          app: 'shopping',
          points: ['lists.overview', 'list.add-items'],
          targets: ['list'],
          benefit: {
            en: 'Turn the week’s meals into one shopping list in one step.',
            de: 'Mach aus den Mahlzeiten der Woche mit einem Schritt eine Einkaufsliste.',
            ro: 'Transformă mesele săptămânii într-o singură listă de cumpărături dintr-un pas.',
            hu: 'Egy lépésben egyetlen bevásárlólista lesz a hét étkezéseiből.',
          },
        },
      ],
    },
  },
  layout: () => import('./layout'),
  pages: {
    '/': () => import('./pages/home'),
    '/h/:id': () => import('./pages/week'),
    '/h/:id/household': () => import('./pages/household'),
    '/meals': () => import('./pages/sets'),
    '/meals/:id': () => import('./pages/set'),
    '/join/:code': () => import('./pages/join'),
    '/help': () => import('./pages/help'),
  },
  api: {
    '/health': () => import('./api/health'),
    '/households': () => import('./api/households'),
    '/households/:id': () => import('./api/household'),
    '/households/:id/eaters': () => import('./api/eaters'),
    '/households/:id/eaters/:eaterId': () => import('./api/eater'),
    '/households/:id/invite': () => import('./api/invite'),
    '/households/:id/members/:userId': () => import('./api/member'),
    '/households/:id/meals': () => import('./api/meals'),
    '/households/:id/meals/:mealId': () => import('./api/meal'),
    '/households/:id/meals/:mealId/items': () => import('./api/meal-items'),
    '/households/:id/meals/:mealId/items/:index': () => import('./api/meal-item'),
    '/sets': () => import('./api/sets'),
    '/sets/:id': () => import('./api/set'),
    '/sets/:id/publish': () => import('./api/set-publish'),
    '/sets/:id/recommend': () => import('./api/set-recommend'),
    '/sets/:id/comments': () => import('./api/set-comments'),
    '/sets/:id/comments/:commentId': () => import('./api/set-comment'),
    '/households/:id/suggest': () => import('./api/suggest'),
    '/households/:id/shopping': () => import('./api/shopping'),
    '/join': () => import('./api/join'),
    '/recipes': () => import('./api/recipes'),
  },
  linkHandlers: {
    'households.list': () => import('./links/households-list'),
    'meal.add': () => import('./links/meal-add'),
    'calendar.events': () => import('./links/calendar-events'),
  },
  platform: () => import('./platform'),
});
