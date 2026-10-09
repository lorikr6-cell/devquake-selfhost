# Shared expenses

DevQuake app served at `https://expenses.devquake.com` (local: `http://expenses.localhost:3000`).
Own MySQL database (ADR 0007); decisions in [ADR 0055](../../docs/adr/0055-shared-expenses.md);
idea in `docs/plugins/ideas/expenses.md`.

People share costs in **groups** (trip, flat, couple, event, other) with one currency. The creator
is the owner; others join with an **invite link / code / QR** (free access for invitees,
ADR 0043), from the owner's DevQuake referrals, or are added **by name without an account**.
**Expenses** record what, how much, who paid, the day and a category, split **equally**, **by
shares**, **by percent** or as **exact amounts**; the parts are computed in whole cents and stored.
**Balances** show who is owed and who owes, **settling up** suggests the fewest transfers, and
**payments** record them. Expenses have **comments**; the **activity** feed lists every change;
**statistics** show spending by category, month and person.

## Routes

| Type | Pattern                                         | File                     |
| ---- | ----------------------------------------------- | ------------------------ |
| Page | `/`                                             | `src/pages/home.tsx`     |
| Page | `/groups/:id`                                   | `src/pages/group.tsx`    |
| Page | `/groups/:id/balances`                          | `src/pages/balances.tsx` |
| Page | `/groups/:id/activity`                          | `src/pages/activity.tsx` |
| Page | `/groups/:id/stats`                             | `src/pages/stats.tsx`    |
| Page | `/groups/:id/members`                           | `src/pages/members.tsx`  |
| Page | `/groups/:id/expenses/:expenseId`               | `src/pages/expense.tsx`  |
| Page | `/join/:code` (signed-in route)                 | `src/pages/join.tsx`     |
| Page | `/help` (public)                                | `src/pages/help.tsx`     |
| API  | `/health`                                       | `src/api/health.ts`      |
| API  | `/groups` POST                                  | `src/api/groups.ts`      |
| API  | `/groups/:id` PATCH, DELETE                     | `src/api/group.ts`       |
| API  | `/groups/:id/expenses` POST                     | `src/api/expenses.ts`    |
| API  | `/groups/:id/expenses/:expenseId` PATCH, DELETE | `src/api/expense.ts`     |
| API  | `/groups/:id/expenses/:expenseId/comments` POST | `src/api/comments.ts`    |
| API  | `/groups/:id/comments/:commentId` DELETE        | `src/api/comment.ts`     |
| API  | `/groups/:id/payments` POST                     | `src/api/payments.ts`    |
| API  | `/groups/:id/payments/:paymentId` DELETE        | `src/api/payment.ts`     |
| API  | `/groups/:id/invite` POST                       | `src/api/invite.ts`      |
| API  | `/groups/:id/members` POST                      | `src/api/members.ts`     |
| API  | `/groups/:id/members/:memberId` PATCH, DELETE   | `src/api/member.ts`      |
| API  | `/join` POST (signed-in route)                  | `src/api/join.ts`        |

## Links with other apps (ADR 0035)

| Link point        | Kind  | What                                                                |
| ----------------- | ----- | ------------------------------------------------------------------- |
| `groups.overview` | read  | The member's groups: name, kind, currency, user ids of members      |
| `expense.add`     | write | An expense paid by the member (equal, or exact amounts per user id) |

Targets: `group` (`/groups/:id`), `expense` (`/groups/:id/expenses/:expenseId`). Utilities adds a
bill with everyone's exact share; Shopping adds what was bought, split equally. The same source
(`utilities:bill:42`) twice changes nothing.

## Database

`db/migrations/0001_expenses.sql` and `0002_expense_source.sql` on the app's own database (`EXPENSES_DB_*`): `expense_groups`,
`group_members`, `group_invites`, `expenses`, `expense_shares`, `payments`, `expense_comments`,
`group_activity`. The platform's project row: `db/migrations/0054_expenses_project.sql`.

```bash
pnpm db:migrate --plugin expenses
```

## Development

```bash
pnpm dev   # from the repo root, then open http://expenses.localhost:3000
```
