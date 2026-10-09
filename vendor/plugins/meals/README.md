# Meal planner

DevQuake app served at `https://meals.devquake.com` (local: `http://meals.localhost:3000`). It has
its own MySQL database (ADR 0007) and reads the platform only through the SDK (`ctx.user`,
`ctx.db`, `ctx.timeZone`, `ctx.links`).

A member creates a **household** and becomes its **planner**; others join with an invite link as
**members** (planners can promote them). **Eaters** are everyone at the table, with or without an
account, with a portion (½ to 1½); they give the default **servings**. The **week** has meals per
day and slot (breakfast, lunch, dinner, snack), each made of **parts** (`meal_items`): cookbook
**recipes** (their ref, plus a copy of title and nutrition per portion taken when planned) and
simple **items** with a quantity. A planned meal can be saved as a **saved meal** (`meal_sets`),
private or **public** (only with library or public cookbook recipes, checked through
`recipe.get`'s `visibility`): members add it to their plan, **recommend** it and **comment**; the
owner is told by the scheduled hook (notification and message, ADR 0037). Meals can be
**leftovers** (nothing to cook or buy) and carry an **evening-before reminder**. Planners
**suggest a week** from the cookbook (diet, allergens to avoid, dislikes, no repeats); anyone can
send the **week to a shopping list** (ingredients merged and rounded).

The planner works without the cookbook (typed-in meals only) and without shopping lists; both are
reached only through link points while the member has connected the apps (ADR 0035).

## Routes

| Type | Pattern                                      | File                       | Purpose                                                                |
| ---- | -------------------------------------------- | -------------------------- | ---------------------------------------------------------------------- |
| Page | `/`                                          | `src/pages/home.tsx`       | Households (straight to the week with one; `?all` lists them)          |
| Page | `/h/:id`                                     | `src/pages/week.tsx`       | The week (`?week=YYYY-MM-DD`): meals, nutrition, suggest, shop         |
| Page | `/h/:id/household`                           | `src/pages/household.tsx`  | Eaters, diet, allergens, dislikes, targets, members, invite            |
| Page | `/meals`                                     | `src/pages/sets.tsx`       | Saved meals: mine and the community's public ones (`?tab`)             |
| Page | `/meals/:id`                                 | `src/pages/set.tsx`        | A saved meal: parts, add to plan, recommend, comments, owner           |
| Page | `/join/:code`                                | `src/pages/join.tsx`       | Invitation: the household and a Join button                            |
| Page | `/help`                                      | `src/pages/help.tsx`       | User manual; **public** (ADR 0009), in the sitemap                     |
| API  | `/health`                                    | `src/api/health.ts`        | Liveness                                                               |
| API  | `/households`                                | `src/api/households.ts`    | POST { name }                                                          |
| API  | `/households/:id`                            | `src/api/household.ts`     | PATCH settings (planners), DELETE (creator)                            |
| API  | `/households/:id/eaters`                     | `src/api/eaters.ts`        | POST { name, portion } (planners)                                      |
| API  | `/households/:id/eaters/:eaterId`            | `src/api/eater.ts`         | PATCH, DELETE (planners)                                               |
| API  | `/households/:id/invite`                     | `src/api/invite.ts`        | POST a new invite link, DELETE stops it (planners)                     |
| API  | `/households/:id/members/:userId`            | `src/api/member.ts`        | PATCH { role } (planners); DELETE: remove or leave                     |
| API  | `/households/:id/meals`                      | `src/api/meals.ts`         | POST a meal (a recipe's data copied via `recipe.get`)                  |
| API  | `/households/:id/meals/:mealId`              | `src/api/meal.ts`          | PATCH (servings, cooked, leftovers, note, reminder, day, slot), DELETE |
| API  | `/households/:id/meals/:mealId/items`        | `src/api/meal-items.ts`    | POST { items }: more parts (recipes or items)                          |
| API  | `/households/:id/meals/:mealId/items/:index` | `src/api/meal-item.ts`     | DELETE one part                                                        |
| API  | `/sets`                                      | `src/api/sets.ts`          | GET mine and community; POST from a planned meal or parts              |
| API  | `/sets/:id`                                  | `src/api/set.ts`           | PATCH title/description, DELETE (owner)                                |
| API  | `/sets/:id/publish`                          | `src/api/set-publish.ts`   | POST public (recipes must be readable by others), DELETE private       |
| API  | `/sets/:id/recommend`                        | `src/api/set-recommend.ts` | POST { on }                                                            |
| API  | `/sets/:id/comments`                         | `src/api/set-comments.ts`  | POST { body }; `/sets/:id/comments/:commentId` DELETE                  |
| API  | `/households/:id/suggest`                    | `src/api/suggest.ts`       | POST { week, slots }: fill empty slots (planners)                      |
| API  | `/households/:id/shopping`                   | `src/api/shopping.ts`      | POST { week, listId }: the week's ingredients to a shopping list       |
| API  | `/join`                                      | `src/api/join.ts`          | POST { code }                                                          |
| API  | `/recipes`                                   | `src/api/recipes.ts`       | GET ?household=&q=: cookbook recipes for the search box                |

## Links with other apps (ADR 0035)

| Direction        | Point / target                               | What                                                       |
| ---------------- | -------------------------------------------- | ---------------------------------------------------------- |
| offers           | `calendar.events` (read)                     | Planned meals as all-day events (slot emoji and name)      |
| offers           | target `week` → `/h/:id`                     | Opens a household's week                                   |
| offers           | `households.list` (read), `meal.add` (write) | "Plan this recipe" in the cookbook (joins that day's meal) |
| uses `cookbook`  | `recipes.search`, `recipe.get`; `recipe`     | Search, suggestions, copied nutrition, ingredients         |
| uses `shopping`  | `lists.overview`, `list.add-items`; `list`   | The week as one shopping list (30 items per call)          |
| used by `family` | `calendar.events`                            | Meals in the family calendar                               |

## Reminders (scheduled hook, `src/platform.ts`)

Every run: meals with a reminder from yesterday to two days ahead (UTC) that were not sent; due
from 18:00 the evening before in the household's zone until the day ends (`reminderDue`,
`lib/plan.ts`, tested). Each is claimed in `meal_reminders_sent` before the emails go out to every
member (with a notification). At most 40 emails per run.

## Configuration

- `MEALS_DB_NAME`, `MEALS_DB_USER`, `MEALS_DB_PWD`.

| Migration                | Adds                                                                                                                                                                                      |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `0001_meals.sql`         | households, household_members, household_invites, eaters (`portion_size`), meals, meal_items, meal_reminders_sent, meal_sets, meal_set_items, meal_set_recommendations, meal_set_comments |
| `0002_draft_columns.sql` | adds the later columns of meals and meal_items to a database made from an early draft of 0001 (production lacked `meals.set_id`)                                                          |

## Development

```bash
pnpm dev                                   # from the repo root, then http://meals.localhost:3000
pnpm --filter @devquake/plugin-meals test
pnpm db:migrate --plugin meals             # needs MEALS_DB_* in the environment
```
