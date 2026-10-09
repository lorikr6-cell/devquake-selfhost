# Shared shopping lists

DevQuake app served at `https://shopping.devquake.com`. The pilot for ADR 0007: it has its own
MySQL database and reads the platform only through the SDK (`ctx.user`, `ctx.db`, `ctx.people`).

Users plan shared shopping carts **by date** (a list per shopping day, shown on a week, month or
year calendar and on the **Today** tab), add products with a name and unit (quantity optional),
price per unit and a description, and group them by **store**. Each store has a name, a **type**, a **location** and a
description. Typing a well-known chain fills the type in automatically (Kaufland → grocery,
Dedeman → hardware and DIY, Altex → consumer electronics; see `src/lib/store-types.ts`).
Owners invite people with a link, code or QR, or add people from their **DevQuake referral
network** (people they invited, and the person who invited them) with one click.

## Routes

| Type | Pattern                          | File                       | Purpose                                                                                            |
| ---- | -------------------------------- | -------------------------- | -------------------------------------------------------------------------------------------------- |
| Page | `/`                              | `src/pages/home.tsx`       | Tabs: Today, Calendar, New list/Join, Statistics                                                   |
| Page | `/join/:code`                    | `src/pages/join.tsx`       | Invitation: shows the list and a Join button                                                       |
| Page | `/lists/:id`                     | `src/pages/list.tsx`       | The cart: add items and stores, shopping mode                                                      |
| Page | `/lists/:id/share`               | `src/pages/share.tsx`      | Invite link/QR, referral friends, members, settings                                                |
| Page | `/help`                          | `src/pages/help.tsx`       | User manual; **public** (ADR 0009), in the sitemap                                                 |
| API  | `/health`                        | `src/api/health.ts`        | Liveness                                                                                           |
| API  | `/lists`                         | `src/api/lists.ts`         | GET my lists, POST create                                                                          |
| API  | `/join`                          | `src/api/join.ts`          | POST `{ code }`                                                                                    |
| API  | `/lists/:id`                     | `src/api/list.ts`          | GET (`?v=` → 204 if unchanged), PATCH, DELETE                                                      |
| API  | `/lists/:id/items`               | `src/api/items.ts`         | POST item (`photoFrom` copies an earlier photo)                                                    |
| API  | `/lists/:id/items/:itemId`       | `src/api/item.ts`          | PATCH (fields, `done`), DELETE                                                                     |
| API  | `/lists/:id/items/:itemId/photo` | `src/api/photo.ts`         | GET photo (members), PUT image body, DELETE                                                        |
| API  | `/suggestions`                   | `src/api/suggestions.ts`   | GET products from earlier lists (autocomplete)                                                     |
| API  | `/changes`                       | `src/api/changes.ts`       | GET fingerprint of all my lists (home live refresh)                                                |
| API  | `/lists/:id/stores`              | `src/api/stores.ts`        | POST store (type guessed if omitted)                                                               |
| API  | `/lists/:id/nearby-stores`       | `src/api/nearby-stores.ts` | POST `{ lat, lon }`: shops within 2 km from OpenStreetMap (Overpass), nothing saved                |
| API  | `/lists/:id/stores/:storeId`     | `src/api/store.ts`         | PATCH, DELETE (items keep, without store)                                                          |
| API  | `/lists/:id/clear-done`          | `src/api/clear-done.ts`    | POST: remove ticked-off items                                                                      |
| API  | `/lists/:id/invite`              | `src/api/invite.ts`        | GET active code, POST new code (owner)                                                             |
| API  | `/lists/:id/members`             | `src/api/members.ts`       | POST `{ userId }` from the referral network (owner)                                                |
| API  | `/events`                        | `src/api/events.ts`        | GET my notifications; DELETE `{ upTo }`: clear all                                                 |
| API  | `/events/:id`                    | `src/api/event.ts`         | DELETE: remove one notification from my bell                                                       |
| API  | `/copy`                          | `src/api/copy.ts`          | POST: copy lists to other days (`mode`: list, week, month)                                         |
| API  | `/lists/:id/items/:itemId/price` | `src/api/item-price.ts`    | PUT `{ price }`: correct the price in the store                                                    |
| API  | `/lists/:id/members/:userId`     | `src/api/member.ts`        | DELETE: owner removes, member leaves                                                               |
| API  | `/lists/:id/expense`             | `src/api/list-expense.ts`  | POST: what was bought becomes a Shared expenses expense (link point `expense.add`, ADR 0035, 0055) |

Platform hooks (`src/platform.ts`): `getStats` (lists, people, items, stores on the admin
dashboard) and `deleteUserData` (lists pass to the longest-standing member or are deleted,
memberships removed, names taken off items; the user leaves deleted lists too, and a deleted
list nobody is left on is removed for good).

Deleting a list (owner, `DELETE /api/lists/:id`) is a soft delete: memberships move to
`deleted_list_members`, invites, events and photos are deleted, and the list keeps its items
and stores with `lists.deleted_at` set. Every access path joins `list_members`, so the list is
gone for everyone; only `statsInput()` also reads `deleted_list_members`, so spending
statistics do not change.

## Prices, copies and notifications

- **Correct price** (shopping mode, `correctPrice`): the paid price replaces `items.price`; the
  first planned price is kept in `items.estimated_price`. Every planned price (`addItem`,
  `updateItem`, and the planned price of a copied item on its first correction) and every paid
  price is written to `price_observations` with the list's shopping day. `lib/prices.ts`
  (pure, tested) turns them into the Statistics section "Prices over time": first and latest
  price per product (paid price wins over planned on the same day), the average change, and
  paid vs. planned. Observations are read like `statsInput` (lists the user is or was on).
- **Copy lists** (`/api/copy`, `lib/replicate.ts` pure and tested, `copyList`): a list to a day,
  every day of a week or of a month; a week to the other weeks of its month (same weekdays,
  days outside the month dropped); a month to the other months of its year (the 31st becomes
  the last day). Copies: same name, currency, stores, items and prices; nothing ticked off; no
  photos; the copier owns them and the source's members are on them. A list the user is on with
  the same name and day is skipped. At most 200 per request.
- **Notifications**: "Clear all" stores `notification_clears.cleared_up_to` per person, single
  removals `notification_dismissals`; both apply on every device. The bell's popup renders on
  `<body>` just under the bell, full width on phones and never taller than the screen.

## Languages

English, German, Romanian and Hungarian (ADR 0011). Every route also exists under `/de`, `/ro`
and `/hu`; the host strips the prefix and passes `ctx.locale`. Texts: `src/i18n/` (catalog test
in `src/i18n/catalog.test.ts`). API errors are keys (`HttpError`) translated by `lib/api.ts` in
the visitor's language. Release notes: `CHANGELOG.md` plus `CHANGELOG.de.md`, `.ro.md`, `.hu.md`.

## Database

Own database, configured with `SHOPPING_DB_NAME`, `SHOPPING_DB_USER`, `SHOPPING_DB_PWD`
(optional `SHOPPING_DB_HOST`/`SHOPPING_DB_PORT`). Schema: `db/migrations/`, applied with
`pnpm db:migrate --plugin shopping` or in phpMyAdmin. See `db/README.md` → "App databases".

Migrations (`db/migrations/`, import in order, each is safe to re-run):

| File                               | Adds                                                               |
| ---------------------------------- | ------------------------------------------------------------------ |
| `0001_shopping_lists.sql`          | lists, members, invites, stores, items                             |
| `0002_list_dates.sql`              | `lists.shop_date`; optional item quantity                          |
| `0003_item_photos.sql`             | `item_photos`                                                      |
| `0004_not_needed_and_activity.sql` | `items.dropped_*` ("not needed"), `list_events` (bell)             |
| `0005_deleted_lists.sql`           | `lists.deleted_at`, `deleted_list_members` (statistics)            |
| `0006_notification_dismissals.sql` | `notification_clears`, `notification_dismissals` (bell)            |
| `0007_price_history.sql`           | `items.estimated_price`, `price_corrected_*`; `price_observations` |

`CHANGELOG.md` is shown to users (version button, ADR 0008): write entries for them and keep
technical details (migrations, tables) here.

## Development

```bash
pnpm dev                                    # from the repo root
pnpm --filter @devquake/plugin-shopping test
```

Open `http://shopping.lvh.me:3000` with `ROOT_DOMAIN=lvh.me:3000` so the DevQuake session is
shared with the app (plain `localhost` cookies are host-only).

## Live updates

No WebSockets (not available on Hostinger's managed Node.js hosting). An open list polls
`GET /api/lists/:id?v=<version>` every 4 s (204 when nothing changed) and the home screen polls
`GET /api/changes` every 5 s, both only while the tab is visible and immediately when it becomes
visible again. Updates reach people who have the app open within about 5 seconds; notifying
people who have it closed needs Web Push (see the idea doc).

## Analytics

With the visitor's consent, pages are counted in Google Analytics under the content group
`shopping`, and these events are sent (no names or contents): `list_created`
(`planned_ahead`), `list_joined`, `friend_added`, `invite_link_copied`, `item_added`
(`source`: typed / suggestion / usual, `autofill`, `with_photo`, `new_store`), `item_bought`,
`item_not_needed` (`already_bought`), `photo_added`, `shopping_mode_started`.

## Link points (ADR 0035)

Offered to connected apps (`src/links/`, declared in `manifest.links`):

| Id                | Kind  | Input                                                    | Reply                                                                             |
| ----------------- | ----- | -------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `lists.overview`  | read  | `{ limit? }` (1–20, default 5)                           | `{ lists: [{ id, name, shopDate, open, done }] }` (open lists from a week ago on) |
| `list.add-items`  | write | `{ listId, items: [{ name, quantity?, unit? }] }` (≤ 30) | `{ listId, added }` (added as the member)                                         |
| `calendar.events` | read  | `{ from, to }` (`YYYY-MM-DD`, ≤ 62 days)                 | `{ events }`: the member's lists by shopping date (names only, all-day)           |

Target `list` → `/lists/:id`. Used by the family planner. Change these only by adding.

Uses `calendar.events` of the family planner, workout and utilities: the Calendar tab shows “From
your other apps” and can filter the connected events by month or a selected day (`LinkedEvents`).
