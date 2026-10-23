# Social canteen

DevQuake plugin served at `https://canteen.devquake.com` (local: `http://canteen.localhost:3000`).
For organisations that feed elderly people. Spec and roadmap:
[docs/plugins/ideas/canteen.md](../../docs/plugins/ideas/canteen.md). Public on DevQuake (migration 0071).

## Setup

1. Create its database in hPanel and set `CANTEEN_DB_NAME`, `CANTEEN_DB_USER`, `CANTEEN_DB_PWD`.
2. Import every file of `db/migrations/` into it, in order (`0001` … `0010`), or run
   `pnpm db:migrate --plugin canteen`.
3. Optional: `CANTEEN_ORS_KEY` (a free key from openrouteservice.org; the API is at api.heigit.org) shows "Compute the order
   from the map" on routes.
4. Set `CANTEEN_MASTER_KEY` (32 random bytes, base64: `openssl rand -base64 32`). Without it,
   personal numbers and pictures cannot be saved. Never change or lose it.

## Routes

| Type | Pattern                                                    | File                            |
| ---- | ---------------------------------------------------------- | ------------------------------- |
| Page | `/`                                                        | `src/pages/home.tsx`            |
| Page | `/orgs/:id`                                                | `src/pages/org.tsx`             |
| Page | `/orgs/:id/people/new`                                     | `src/pages/person-new.tsx`      |
| Page | `/orgs/:id/people/:personId`                               | `src/pages/person.tsx`          |
| Page | `/orgs/:id/people/:personId/edit`                          | `src/pages/person-edit.tsx`     |
| Page | `/orgs/:id/staff`                                          | `src/pages/staff.tsx`           |
| Page | `/orgs/:id/meals?week=`                                    | `src/pages/meals.tsx`           |
| Page | `/orgs/:id/kitchen?day=`                                   | `src/pages/kitchen.tsx`         |
| Page | `/orgs/:id/routes?week=`                                   | `src/pages/routes.tsx`          |
| Page | `/orgs/:id/routes/:day` (planner; printed: route sheets)   | `src/pages/route-day.tsx`       |
| Page | `/orgs/:id/calendar?month=`                                | `src/pages/calendar.tsx`        |
| Page | `/orgs/:id/my-route?day=` (drivers)                        | `src/pages/my-route.tsx`        |
| Page | `/o/:id` (open: the organisation's public page)            | `src/pages/public-org.tsx`      |
| Page | `/join/:code` (signed in, before access)                   | `src/pages/join.tsx`            |
| API  | `/health`                                                  | `src/api/health.ts`             |
| API  | `POST /orgs`                                               | `src/api/orgs.ts`               |
| API  | `PATCH, DELETE /orgs/:id`                                  | `src/api/org.ts`                |
| API  | `POST /orgs/:id/people`                                    | `src/api/people.ts`             |
| API  | `PATCH, DELETE /orgs/:id/people/:personId`                 | `src/api/person.ts`             |
| API  | `GET, PUT …/:personId/identity`                            | `src/api/identity.ts`           |
| API  | `GET, PUT, DELETE …/:personId/documents/:kind`             | `src/api/document.ts`           |
| API  | `POST …/:personId/incidents`                               | `src/api/incidents.ts`          |
| API  | `DELETE …/:personId/incidents/:incidentId`                 | `src/api/incident.ts`           |
| API  | `PATCH, DELETE /orgs/:id/staff/:staffId`                   | `src/api/staff.ts`              |
| API  | `POST /orgs/:id/invites`                                   | `src/api/invites.ts`            |
| API  | `DELETE /orgs/:id/invites/:inviteId`                       | `src/api/invite.ts`             |
| API  | `POST /join` (signed in, before access)                    | `src/api/join.ts`               |
| API  | `POST /orgs/:id/meal-times`                                | `src/api/meal-times.ts`         |
| API  | `PATCH, DELETE /orgs/:id/meal-times/:mealTimeId`           | `src/api/meal-time.ts`          |
| API  | `PUT /orgs/:id/menus`                                      | `src/api/menus.ts`              |
| API  | `POST /orgs/:id/menus/copy`                                | `src/api/menus-copy.ts`         |
| API  | `POST /orgs/:id/drivers`                                   | `src/api/drivers.ts`            |
| API  | `PATCH, DELETE /orgs/:id/drivers/:driverId`                | `src/api/driver.ts`             |
| API  | `GET, PUT, DELETE /orgs/:id/drivers/:driverId/licence`     | `src/api/licence.ts`            |
| API  | `POST /orgs/:id/invites/:inviteId/email` (organisers)      | `src/api/invite-email.ts`       |
| Page | `/orgs/:id/routes/areas` (driver areas, planners)          | `src/pages/areas.tsx`           |
| Page | `/orgs/:id/routes/print?from=&to=&driver=` (route sheets)  | `src/pages/routes-print.tsx`    |
| API  | `GET, PUT /orgs/:id/areas`                                 | `src/api/areas.ts`              |
| API  | `POST /orgs/:id/areas/:action` (propose, locate, build)    | `src/api/areas-action.ts`       |
| API  | `GET, POST /orgs/:id/dishes` (Cookbook dishes)             | `src/api/dishes.ts`             |
| API  | `DELETE /orgs/:id/dishes/:dishId`                          | `src/api/dish.ts`               |
| API  | `GET /orgs/:id/recipes?q=` (the visitor's Cookbook)        | `src/api/recipes.ts`            |
| API  | `GET, POST /orgs/:id/shopping?week=` (purchasing list)     | `src/api/shopping-week.ts`      |
| API  | `POST /demo` (one demo per person)                         | `src/api/demo.ts`               |
| API  | `PUT /orgs/:id/demo-role` (the demo's maker)               | `src/api/demo-role.ts`          |
| API  | `PUT /orgs/:id/route-settings`                             | `src/api/route-settings.ts`     |
| API  | `PUT /orgs/:id/routes/:day`                                | `src/api/route.ts`              |
| API  | `POST /orgs/:id/routes/:day/copy`                          | `src/api/route-copy.ts`         |
| API  | `PUT, DELETE /orgs/:id/routes/:day/stops/:personId`        | `src/api/route-stop.ts`         |
| Page | `/orgs/:id/medication?day=` (medical staff)                | `src/pages/medication.tsx`      |
| Page | `/orgs/:id/people/:personId/medical` (medical staff)       | `src/pages/medical.tsx`         |
| API  | `PUT /orgs/:id/doses`                                      | `src/api/doses.ts`              |
| API  | `PUT …/:personId/medical`                                  | `src/api/medical.ts`            |
| API  | `POST …/:personId/medications`                             | `src/api/medications.ts`        |
| API  | `PATCH, DELETE …/:personId/medications/:medicationId`      | `src/api/medication.ts`         |
| API  | `POST …/:personId/med-notes`                               | `src/api/med-notes.ts`          |
| API  | `DELETE …/:personId/med-notes/:noteId`                     | `src/api/med-note.ts`           |
| API  | `POST …/:personId/hospital-stays`                          | `src/api/stays.ts`              |
| API  | `PATCH …/:personId/hospital-stays/:stayId`                 | `src/api/stay.ts`               |
| API  | `POST …/:personId/med-papers`                              | `src/api/med-papers.ts`         |
| API  | `GET, DELETE …/:personId/med-papers/:paperId`              | `src/api/med-paper.ts`          |
| API  | `GET /o/:id/logo` (open)                                   | `src/api/public-logo.ts`        |
| API  | `PUT /orgs/:id/page`                                       | `src/api/org-page.ts`           |
| API  | `GET, PUT, DELETE /orgs/:id/logo`                          | `src/api/org-logo.ts`           |
| API  | `GET /orgs/:id/export` (.xlsx)                             | `src/api/export.ts`             |
| API  | `POST /orgs/:id/import` (.xlsx)                            | `src/api/import.ts`             |
| API  | `POST /orgs/:id/routes/:day/optimise` (OpenRouteService)   | `src/api/route-optimise.ts`     |
| API  | `GET /orgs/:id/my-route/positions?day=` (drivers' map)     | `src/api/my-route-positions.ts` |
| API  | `GET /app/driver?day=` (native driver app, device sign-in) | `src/api/app-driver.ts`         |

`:kind` is `photo`, `id-card`, `extra1` or `extra2`.

## Development

```bash
pnpm dev   # from the repo root, then open http://canteen.localhost:3000
```
