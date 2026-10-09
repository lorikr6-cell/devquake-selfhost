import { about } from './about';
import { definePlugin } from '@devquake/plugin-sdk';

export default definePlugin({
  manifest: {
    id: 'cookbook',
    name: 'Cookbook',
    version: '0.6.1',
    description:
      'Recipes that adapt to the people at the table: choose the servings and every quantity and the nutrition per portion update; cooking mode with timers and a voice; diet tags and allergens.',
    status: 'active',
    // Own MySQL database from COOKBOOK_DB_* (ADR 0007).
    database: true,
    // Open to everyone and listed in the app's sitemap (ADR 0009).
    publicPages: [{ path: '/help', title: 'User manual' }],
    // Recipes their authors shared with a public link, and their photos (ADR 0047).
    openRoutes: { pages: ['/p/:code'], api: ['/p/:code/photo'] },
    about,
    // One NPS point per 100 recommendations of a public recipe, to its author (ADR 0037).
    npsAwards: {
      reason: {
        en: 'Every 100 recommendations of your public recipe',
        de: 'Alle 100 Empfehlungen deines öffentlichen Rezepts',
        ro: 'La fiecare 100 de recomandări ale rețetei tale publice',
        hu: 'A nyilvános recepted minden 100 ajánlása után',
      },
      maxPointsPerDay: 5,
    },
    // Links with other apps (ADR 0035).
    links: {
      offers: [
        {
          id: 'recipes.search',
          kind: 'read',
          perMinute: 60,
          title: {
            en: 'Find recipes in your cookbook, with time, diet tags and nutrition',
            de: 'Rezepte in deinem Kochbuch finden, mit Zeit, Ernährungsformen und Nährwerten',
            ro: 'Să găsească rețete în cartea ta de bucate, cu timp, diete și valori nutritive',
            hu: 'Recepteket keressen a szakácskönyvedben, idővel, étrendekkel és tápértékkel',
          },
        },
        {
          id: 'recipe.get',
          kind: 'read',
          perMinute: 120,
          title: {
            en: 'Read a recipe’s ingredients and nutrition for a number of servings',
            de: 'Zutaten und Nährwerte eines Rezepts für eine Anzahl Portionen lesen',
            ro: 'Să citească ingredientele și valorile nutritive ale unei rețete pentru un număr de porții',
            hu: 'Egy recept hozzávalóit és tápértékét olvassa adott számú adagra',
          },
        },
      ],
      targets: [
        {
          id: 'recipe',
          path: '/r/:id',
          title: { en: 'a recipe', de: 'ein Rezept', ro: 'o rețetă', hu: 'egy receptet' },
        },
      ],
      uses: [
        {
          app: 'meals',
          points: ['households.list', 'meal.add'],
          targets: ['week'],
          benefit: {
            en: 'Plan a recipe for a day of your week in one step, with its servings and nutrition.',
            de: 'Ein Rezept mit einem Schritt für einen Tag deiner Woche planen, mit Portionen und Nährwerten.',
            ro: 'Planifică o rețetă pentru o zi din săptămâna ta dintr-un pas, cu porții și valori nutritive.',
            hu: 'Egy lépésben beteheted a receptet a heted egy napjára, adagokkal és tápértékkel.',
          },
        },
        {
          app: 'shopping',
          points: ['lists.overview', 'list.add-items'],
          targets: ['list'],
          benefit: {
            en: 'Put a recipe’s ingredients for any number of people on a shopping list in one step.',
            de: 'Die Zutaten eines Rezepts für beliebig viele Personen mit einem Schritt auf eine Einkaufsliste setzen.',
            ro: 'Pune ingredientele unei rețete, pentru oricâte persoane, pe o listă de cumpărături dintr-un pas.',
            hu: 'Egy recept hozzávalóit bármennyi főre egy lépésben bevásárlólistára teheted.',
          },
        },
      ],
    },
  },
  layout: () => import('./layout'),
  pages: {
    '/': () => import('./pages/home'),
    '/new': () => import('./pages/new'),
    '/r/:id': () => import('./pages/recipe'),
    '/r/:id/cook': () => import('./pages/cook'),
    '/r/:id/edit': () => import('./pages/edit'),
    '/s/:code': () => import('./pages/share'),
    // A public link anyone can open (ADR 0047).
    '/p/:code': () => import('./pages/public'),
    '/comments': () => import('./pages/comments'),
    // The food catalogue, for DevQuake staff only (404 for everyone else).
    '/admin/foods': () => import('./pages/admin-foods'),
    '/admin/foods/:id': () => import('./pages/admin-food'),
    '/admin/new-food': () => import('./pages/admin-food'),
    '/help': () => import('./pages/help'),
  },
  api: {
    '/health': () => import('./api/health'),
    '/recipes': () => import('./api/recipes'),
    '/recipes/:id': () => import('./api/recipe'),
    '/recipes/:id/photo': () => import('./api/photo'),
    '/recipes/:id/share': () => import('./api/share'),
    '/recipes/:id/public-link': () => import('./api/public-link'),
    '/p/:code/photo': () => import('./api/public-photo'),
    '/recipes/:id/publish': () => import('./api/publish'),
    '/recipes/:id/recommend': () => import('./api/recommend'),
    '/recipes/:id/comments': () => import('./api/comments'),
    '/recipes/:id/comments/:commentId': () => import('./api/comment'),
    '/plan': () => import('./api/plan'),
    '/copy': () => import('./api/copy'),
    '/favourites': () => import('./api/favourites'),
    '/foods': () => import('./api/foods'),
    '/foods/:id/my-photo': () => import('./api/food-my-photo'),
    '/food-photos/:photoId': () => import('./api/food-photo'),
    '/admin/foods': () => import('./api/admin-foods'),
    '/admin/foods/:id': () => import('./api/admin-food'),
    '/admin/foods/:id/photo': () => import('./api/admin-food-photo'),
    '/shopping': () => import('./api/shopping'),
  },
  linkHandlers: {
    'recipes.search': () => import('./links/recipes-search'),
    'recipe.get': () => import('./links/recipe-get'),
  },
  platform: () => import('./platform'),
});
