# Venue

DevQuake plugin served at `https://venue.devquake.com`
(local: `http://venue.localhost:3000`). Spec: [docs/plugins/ideas/venue.md](../../docs/plugins/ideas/venue.md),
staff PINs and tablets: [ADR 0080](../../docs/adr/0080-venue-tablets-and-staff-pins.md).
Also runs on its own server from [devquake-selfhost](https://github.com/lorikr6-cell/devquake-selfhost)
(`apps/venue`, ADR 0054).

The business side of a café, bistro, fast food or bar. Stage 1 (0.1.0): the venue with its
country's currency and VAT rates (presets for Hungary and Romania), the menu with prices, VAT,
station and the 14 EU allergens, staff with PINs, the shared tablets, and a public menu for guests.
The admin settings are the venue owner's only (a signed-in member, never a PIN).

## Routes

| Type | Pattern                   | Access                                             | File                                               |
| ---- | ------------------------- | -------------------------------------------------- | -------------------------------------------------- |
| Page | `/`                       | members (else sign in)                             | `src/pages/home.tsx` (setup, then overview)        |
| Page | `/settings`               | the venue's owner                                  | `src/pages/settings.tsx`                           |
| Page | `/menu`                   | the venue's owner                                  | `src/pages/menu.tsx` (menu editor)                 |
| Page | `/menu/design`            | the venue's owner                                  | `src/pages/menu-design.tsx` (pictures, texts)      |
| Page | `/menu/print`             | the venue's owner                                  | `src/pages/menu-print.tsx` (A4, print)             |
| Page | `/staff`                  | the venue's owner                                  | `src/pages/staff.tsx` (staff and PINs)             |
| Page | `/tablets`                | the venue's owner                                  | `src/pages/tablets.tsx` (enable, disable)          |
| Page | `/m/:slug`                | open route (anyone)                                | `src/pages/public-menu.tsx` (while public)         |
| Page | `/tables`                 | the venue's owner                                  | `src/pages/tables.tsx` (tables, QR stickers)       |
| Page | `/floor`                  | owner (signed in)                                  | `src/pages/floor.tsx` (every table)                |
| Page | `/tablet`                 | open route: enabled tablet                         | `src/pages/floor.tsx` (PIN, then the floor)        |
| Page | `/t/:code`                | open route                                         | `src/pages/table.tsx` (staff: order; guests: menu) |
| Page | `/b/:code`                | open route (the bill code)                         | `src/pages/bill.tsx` (the guests' bill)            |
| Page | `/reports`                | the venue's owner                                  | `src/pages/reports.tsx` (sales, items, bills)      |
| Page | `/station/:station`       | open route: owner or tablet staff                  | `src/pages/station.tsx` (kitchen, bar, coffee)     |
| Page | `/help`                   | public                                             | `src/pages/help.tsx` (user manual)                 |
| Page | `/about`                  | public                                             | `src/pages/about.tsx`                              |
| API  | `/venue`                  | POST (create), PUT                                 | `src/api/venue.ts`                                 |
| API  | `/staff`                  | GET, POST                                          | `src/api/staff.ts`                                 |
| API  | `/staff/:id`              | PUT (new PIN), DELETE                              | `src/api/staff-member.ts`                          |
| API  | `/tablets`                | POST (enable this device)                          | `src/api/tablets.ts` (sets `venue_tablet`)         |
| API  | `/tablets/:id`            | DELETE (disable)                                   | `src/api/tablet.ts`                                |
| API  | `/categories`             | POST                                               | `src/api/categories.ts`                            |
| API  | `/categories/:id`         | PUT (rename), DELETE                               | `src/api/category.ts`                              |
| API  | `/items`                  | POST                                               | `src/api/items.ts`                                 |
| API  | `/items/:id`              | PUT, DELETE                                        | `src/api/item.ts`                                  |
| API  | `/tips`                   | PUT (tips on the bill)                             | `src/api/tips.ts`                                  |
| API  | `/tables`, `/tables/:id`  | POST; PUT, DELETE (owner)                          | `src/api/tables.ts`, `table.ts`                    |
| API  | `/floor/*`                | key routes: owner or tablet staff (Origin checked) | `src/api/floor-*.ts`                               |
| API  | `/guest/:code`            | key route: GET, PUT (tip)                          | `src/api/guest-bill.ts`                            |
| API  | `/menu/design`            | PUT (the design's settings, owner)                 | `src/api/menu-design.ts`                           |
| API  | `/menu/design/background` | GET, PUT (flattened image), DELETE (owner)         | `src/api/menu-background.ts`                       |
| API  | `/menu-bg/:slug`          | open route: GET the public menu's background       | `src/api/public-background.ts`                     |
| API  | `/floor/station/:station` | key route: GET tickets, POST made                  | `src/api/floor-station.ts`                         |
| API  | `/health`                 | public                                             | `src/api/health.ts`                                |

Every API route but `/health` is the owner's (`ownerApi` in `src/lib/api.ts`); every page but
the public ones goes through `ownVenue` (`src/lib/page.tsx`).

Database (own, `VENUE_DB_*`): `db/migrations/0001_venue.sql` (venues, staff, tablets,
menu_categories, menu_items), `0002_venue_tips.sql` (the venue's tip settings),
`0003_venue_tables_bills.sql` (venue_tables, bills, bill_lines, sales_days, sales_items; staff on
tablets). The scheduled run deletes finalised bills after 183 days (`deleteOldBills`).
`0004_venue_menu_design.sql` (menu_designs: the menu's look and its flattened background).
`0007_venue_stations.sql` (bill_lines.ready: what a station has made). Next stages: tables and orders on the tablet with PIN switching,
kitchen and bar screens, payments and the daily closing, stock, shifts, reservations, HACCP.

## Links with other apps (ADR 0035)

| With     | Uses                                       | For                                                            |
| -------- | ------------------------------------------ | -------------------------------------------------------------- |
| shopping | `lists.overview`, `list.purchases`; `list` | The purchasing list (settings) and the month's costs (reports) |
| cookbook | `recipes.search`, `recipe.get`; `recipe`   | "Add from your cookbook" in the menu editor                    |

The choices are kept in `venue_links` (migration `0005_venue_links.sql`); purchases and bills
are read when the reports open, never stored here. The darts tournaments are copied into
`venue_darts` (migration `0006_venue_darts.sql`) when the owner opens Venue (at most every 10
minutes), so guests see them on the public menu. API: `/links/shopping` (GET, PUT), `/links/recipes` (GET), `/links/expenses` (GET, PUT, POST to
book), `/links/utilities` (GET, PUT), `/links/darts` (PUT).

## Development

```bash
pnpm dev   # from the repo root, then open http://venue.localhost:3000
```
