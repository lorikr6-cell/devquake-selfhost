# Cookbook

DevQuake app served at `https://cookbook.devquake.com` (local: `http://cookbook.localhost:3000`). It
has its own MySQL database (ADR 0007) and reads the platform only through the SDK (`ctx.user`,
`ctx.db`, `ctx.locale`, `ctx.links`).

Recipes come from the **starter library** in the code (`src/lib/library.ts`, written for DevQuake,
every language) and from members' **own recipes** in the database. A recipe is addressed by its
**ref**: a library id (`shakshuka`) or an own recipe's number (`12`). Ingredients may point to a
**food** of `src/lib/foods.ts` (nutrition per 100 g after USDA FoodData Central, unit weights,
EU allergens, origin), which gives **nutrition per portion**, **allergens** and **diet checks**.
Choosing the **servings** rescales every quantity (`scaling`: linear, whole pieces, spices with
the factor^0.75, fixed) with kitchen rounding; metric or imperial display. **Cooking mode** shows
one step per screen with timers, the Screen Wake Lock and the browser's speech. Own recipes are
private; a **share link** (`/s/CODE`) lets signed-in members who open it see the recipe
(`recipe_access`) until sharing stops. A **public** recipe (`is_public`, only when the required
checks of `lib/guide.ts` pass) is for every member of the app (Community tab): members
**recommend** it (one per member, not the author) and **comment** on it. The scheduled hook
tells the author about each comment (notification and message on devquake.com, no email,
ADR 0037) and awards **one NPS point per 100 recommendations** (`ctx.nps`, key
`recipe:<id>:<hundreds>`, `recipes.nps_milestones`).

Recipes are written to be followed: steps have a **stage** (prepare, cook, serve) and the
**ingredients they use** (chosen by the author, or found in the text, `mentions`); the recipe and
cooking mode show a **Get ready** list (equipment and every ingredient's preparation) and each
step's ingredients scaled to the chosen servings. The editor is a four-step wizard (basics,
ingredients, steps, check) with suggestions (equipment, nutrition links, timers from the text)
and the checklist (`recipeChecks`).

## Food catalogue

Ingredients link to foods: names in every language, a kind, a drawn thumbnail
(`components/food-icon.tsx`, shapes listed in `lib/food-icons.ts`, drawn in each food's colour),
nutrition per 100 g, weights per unit, allergens and origin. They live in the `foods` table
(migration 0003). On first use the app adds the built-in foods (`lib/foods.ts`,
`lib/foods-extra.ts`) the table lacks; after that the table is the source and DevQuake staff
edit it under `/admin/foods`. Pages, the API and link points call `loadFoods()` (kept for a
minute), so the recipe maths stay synchronous; without the database the built-in foods are used.
Foods are never deleted (recipes store their ids): staff switch them off.

Pictures (`food_photos`, migration 0004): a member's own picture of a food is shown only to them
(`thumbOf(food, mine)`); staff see every member's picture of a food on its edit page and may
choose one for everyone (`foods.photo_id`, a copy without a member, so it survives the member
deleting theirs). The drawn thumbnail always stays and returns with "Back to the drawn picture".

## Routes

| Type | Pattern                            | File                          | Purpose                                                                                                               |
| ---- | ---------------------------------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Page | `/`                                | `src/pages/home.tsx`          | Library, own, shared and favourite recipes (`?tab`, `?q`, `?tag`, `?max`)                                             |
| Page | `/new`                             | `src/pages/new.tsx`           | Write a recipe                                                                                                        |
| Page | `/r/:id`                           | `src/pages/recipe.tsx`        | The recipe: servings, units, nutrition, tags, steps, actions                                                          |
| Page | `/r/:id/cook`                      | `src/pages/cook.tsx`          | Cooking mode                                                                                                          |
| Page | `/r/:id/edit`                      | `src/pages/edit.tsx`          | Change an own recipe (author only)                                                                                    |
| Page | `/comments`                        | `src/pages/comments.tsx`      | Comments others wrote on my public recipes                                                                            |
| Page | `/s/:code`                         | `src/pages/share.tsx`         | Opens a share link: records access, goes to the recipe                                                                |
| Page | `/p/:code`                         | `src/pages/public.tsx`        | A recipe its author shared with a public link: open to everyone, signed in or not (open route, ADR 0047), not indexed |
| Page | `/help`                            | `src/pages/help.tsx`          | User manual; **public** (ADR 0009), in the sitemap                                                                    |
| Page | `/admin/foods`                     | `src/pages/admin-foods.tsx`   | Food catalogue (DevQuake staff only, 404 otherwise; `?q`, `?kind`)                                                    |
| Page | `/admin/foods/:id`                 | `src/pages/admin-food.tsx`    | Change a food: names, kind, thumbnail, nutrition, weights, allergens (staff)                                          |
| Page | `/admin/new-food`                  | `src/pages/admin-food.tsx`    | Add a food (staff)                                                                                                    |
| API  | `/health`                          | `src/api/health.ts`           | Liveness                                                                                                              |
| API  | `/recipes`                         | `src/api/recipes.ts`          | POST a new own recipe                                                                                                 |
| API  | `/recipes/:id`                     | `src/api/recipe.ts`           | PUT (ingredients and steps replaced), DELETE (author)                                                                 |
| API  | `/recipes/:id/photo`               | `src/api/photo.ts`            | GET (who may see it), PUT/DELETE (author); JPEG/PNG/WebP ≤ 2 MB                                                       |
| API  | `/recipes/:id/share`               | `src/api/share.ts`            | POST a share link, DELETE stops sharing (author)                                                                      |
| API  | `/recipes/:id/public-link`         | `src/api/public-link.ts`      | POST a public link, DELETE stops it (author)                                                                          |
| API  | `/p/:code/photo`                   | `src/api/public-photo.ts`     | GET the photo of a publicly linked recipe, for anyone (open route)                                                    |
| API  | `/recipes/:id/publish`             | `src/api/publish.ts`          | POST make public (required checks), DELETE private again (author)                                                     |
| API  | `/recipes/:id/recommend`           | `src/api/recommend.ts`        | POST { on }: recommend a public recipe of someone else                                                                |
| API  | `/recipes/:id/comments`            | `src/api/comments.ts`         | POST { body }: comment on a public recipe                                                                             |
| API  | `/recipes/:id/comments/:commentId` | `src/api/comment.ts`          | DELETE (writer or author)                                                                                             |
| API  | `/plan`                            | `src/api/plan.ts`             | POST { ref, householdId, day, slot, servings }: to the meal planner (`meal.add`)                                      |
| API  | `/copy`                            | `src/api/copy.ts`             | POST { ref }: a library or shared recipe as an own copy                                                               |
| API  | `/favourites`                      | `src/api/favourites.ts`       | POST { ref, on }                                                                                                      |
| API  | `/foods`                           | `src/api/foods.ts`            | GET ?q=: active foods by name in the page language, with thumbnail and colour                                         |
| API  | `/foods/:id/my-photo`              | `src/api/food-my-photo.ts`    | PUT image / DELETE: the member's own picture of a food (only they see it); answers { thumb }                          |
| API  | `/food-photos/:photoId`            | `src/api/food-photo.ts`       | GET a food picture: chosen ones for all, own ones, every one for staff                                                |
| API  | `/admin/foods`                     | `src/api/admin-foods.ts`      | POST a new food (staff)                                                                                               |
| API  | `/admin/foods/:id`                 | `src/api/admin-food.ts`       | PUT a food (staff); the id never changes                                                                              |
| API  | `/admin/foods/:id/photo`           | `src/api/admin-food-photo.ts` | PUT { photoId }: show a member's picture to everyone; DELETE: back to the drawing (staff)                             |
| API  | `/shopping`                        | `src/api/shopping.ts`         | POST { ref, servings, listId, skip? }: ingredients to a shopping list                                                 |

## Link points (ADR 0035)

| Id               | Kind | Input                                                          | Reply                                                                                                  |
| ---------------- | ---- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `recipes.search` | read | `{ query?, tags?, without? (allergens), maxMinutes?, limit? }` | `{ recipes: [{ ref, title, servings, minutes, kcal, protein, tags, allergens }] }`                     |
| `recipe.get`     | read | `{ ref, servings? }`                                           | `{ ref, title, servings, minutes, ingredients: [{ name, qty, unit, foodId }], perPortion, allergens }` |

Target `recipe` → `/r/:id`. Both replies carry `visibility` (`library`, `public`, `shared`,
`private`); public recipes of other members are included. Uses shopping (`lists.overview`,
`list.add-items`, target `list`) and the meal planner (`households.list`, `meal.add`, target
`week`: "Plan this recipe"). Used by the meal planner (`meals`).

## Configuration

- `COOKBOOK_DB_NAME`, `COOKBOOK_DB_USER`, `COOKBOOK_DB_PWD`.

| Migration            | Adds                                                                                                                          |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `0001_cookbook.sql`  | recipes, recipe_ingredients, recipe_steps, recipe_photos, recipe_access, favourites                                           |
| `0002_community.sql` | recipes.is_public, published_at, equipment, nps_milestones; recipe_steps.stage, uses; recipe_recommendations, recipe_comments |

## Development

```bash
pnpm dev                                   # from the repo root, then http://cookbook.localhost:3000
pnpm --filter @devquake/plugin-cookbook test
pnpm db:migrate --plugin cookbook          # needs COOKBOOK_DB_* in the environment
```
