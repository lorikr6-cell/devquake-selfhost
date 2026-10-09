# Darts

DevQuake app served at `https://darts.devquake.com` (local: `http://darts.localhost:3000`). Own
MySQL database (ADR 0007); design decisions in ADR 0027; spec in
`docs/plugins/ideas/darts.md`.

Players set up a **profile** (name at the board, hand, level, entry mode, favourite double) and
play in three **modes**:

- **Practice**: alone; any game or a drill (`targets`, `checkout`), including drills generated
  from the player's statistics (`/api/drills`). Every visit is kept.
- **Casual**: the owner creates a game with a join code (QR), players join, the owner starts it
  (Killer numbers drawn, optional random order) and can remove players (the game restarts and
  waits for players again).
- **Tournament**: a knock-out on the organiser's boards. Boards have codes (QR); joining with a
  board's code places the player on it, with the tournament's code on the quietest board. The
  organiser draws each round from suggested pairs (similar strength; bye for the strongest
  without one) and may swap players; matches go on free boards or wait for one. Entry fee,
  currency, organiser percentage and "paid" are bookkeeping only.

Games (`src/lib/engine/games.ts`): X01 (301/501/701/1001; straight/double in; double/single/master
out; legs), Cricket (standard/cut-throat; legs), Shanghai (7/20 rounds, bull tie-break), Around the
Clock (any/doubles), Killer (3/5 lives), Count-Up (8/10/20 rounds), and the drills.

## Routes

| Type | Pattern                              | File                           | Purpose                                                     |
| ---- | ------------------------------------ | ------------------------------ | ----------------------------------------------------------- |
| Page | `/`                                  | `src/pages/home.tsx`           | Modes, my tournament match, games to continue, join by code |
| Page | `/profile`                           | `src/pages/profile.tsx`        | Set up (`?setup=1`, required first) or edit the profile     |
| Page | `/practice`                          | `src/pages/practice.tsx`       | Drills made for me, new practice game, sessions             |
| Page | `/casual`                            | `src/pages/casual.tsx`         | Join by code, new casual game, my casual games              |
| Page | `/tournaments`                       | `src/pages/tournaments.tsx`    | My tournaments, join by code                                |
| Page | `/tournaments/new`                   | `src/pages/tournament-new.tsx` | New tournament (game, fee, share, boards, play too)         |
| Page | `/tournaments/:id`                   | `src/pages/tournament.tsx`     | Bracket (SVG), my match; organiser: rounds, boards/QR, fees |
| Page | `/games/:id`                         | `src/pages/game.tsx`           | Lobby, scoring, result, visits (players; others → watch)    |
| Page | `/watch/:code`                       | `src/pages/watch.tsx`          | Read-only live game (**signed-in route**)                   |
| Page | `/join/:code`                        | `src/pages/join.tsx`           | QR/link target: game, tournament, board (or its live match) |
| Page | `/stats`                             | `src/pages/stats.tsx`          | Own statistics, skills, heat map, opponents                 |
| Page | `/help`                              | `src/pages/help.tsx`           | User manual; **public** (ADR 0009)                          |
| API  | `/health`                            | `src/api/health.ts`            | Liveness                                                    |
| API  | `/profile`                           | `src/api/profile.ts`           | GET, PUT                                                    |
| API  | `/games`                             | `src/api/games.ts`             | POST practice/casual game or drill                          |
| API  | `/games/:id`                         | `src/api/game.ts`              | GET (`?v=` → `{changed:false}`), DELETE (owner)             |
| API  | `/games/:id/start`                   | `src/api/game-start.ts`        | POST: owner starts a casual game                            |
| API  | `/games/:id/visits`                  | `src/api/visits.ts`            | POST `{darts, seq}`; DELETE = undo own last visit           |
| API  | `/games/:id/players/:playerId`       | `src/api/game-player.ts`       | DELETE: remove a player / leave                             |
| API  | `/join`                              | `src/api/join.ts`              | POST `{code}` → join game/tournament, `{href}`              |
| API  | `/watch/:code`                       | `src/api/watch.ts`             | GET live game read-only (**signed-in route**)               |
| API  | `/tournaments`                       | `src/api/tournaments.ts`       | POST create (boards with codes)                             |
| API  | `/tournaments/:id`                   | `src/api/tournament.ts`        | GET `?v=` (polling), PATCH settings, DELETE                 |
| API  | `/tournaments/:id/boards`            | `src/api/boards.ts`            | POST add board                                              |
| API  | `/tournaments/:id/boards/:boardId`   | `src/api/board.ts`             | PATCH rename, DELETE                                        |
| API  | `/tournaments/:id/players/:playerId` | `src/api/tournament-player.ts` | PATCH paid/board, DELETE (registration only)                |
| API  | `/tournaments/:id/rounds`            | `src/api/rounds.ts`            | GET suggested pairs, POST start round with pairs            |
| API  | `/drills`                            | `src/api/drills.ts`            | POST generate drills from my statistics                     |
| API  | `/drills/:id`                        | `src/api/drill.ts`             | DELETE                                                      |

## How it works

- **Engine** (`src/lib/engine`, pure, tested): `play(setup, visits)` replays a game and refuses
  invalid visits with `EngineError` codes (translated `errors.<code>`); `preview` applies
  unsent darts in the browser; `suggest.ts` computes finishing routes, setup shots and targets.
  Each logged dart records its aim when the rules make it clear (statistics).
- **One-click visits** (`src/lib/engine/quick.ts`, tested): whole visits likely at this
  point of the game (finishes, the player's frequent visits from `habitVisits`, common totals
  composed of darts around the 20; hits on the target in other games), each replayed with the
  rules and required to end the visit without a bust.
- **Score progress** (`src/lib/progress.ts`, `components/score-progress.tsx`): each logged
  visit carries the player's score after it (`VisitLog.after`); the game screen and the
  tournament page (`TournamentView.progress`) show a line chart and the visits in order, with
  a search by player name.
- **Concurrency**: `addVisit` locks the game row; `visits (game_id, seq)` is unique; the client
  sends `seq` = visits it saw (`errors.outOfDate` otherwise).
- **Live**: game screen polls every 2 s, tournament page every 5 s, using a `version` counter.
- **Statistics** (`src/lib/stats.ts`): replays the player's last 300 games: results per mode,
  opponents, visit totals, segment heat map, six skills (scoring, doubles, trebles, bull,
  accuracy, consistency) with minimum samples; `src/lib/drills.ts` turns weak skills into drills.
- **Platform hooks** (`src/platform.ts`): `getStats`, `deleteUserData` (deletes owned data,
  anonymises the person in shared games/tournaments), `scheduled` (removes casual games nobody
  joined for 14 days).

## Configuration

- `DARTS_DB_NAME`, `DARTS_DB_USER`, `DARTS_DB_PWD` (the host derives `<ID>_DB_*` from `darts`).

| Migration        | Adds                                                                                   |
| ---------------- | -------------------------------------------------------------------------------------- |
| `0001_darts.sql` | profiles, tournaments, boards, tournament_players, drills, games, game_players, visits |

## Development

```bash
pnpm dev                                 # from the repo root, then http://darts.localhost:3000
pnpm --filter @devquake/plugin-darts test
pnpm db:migrate --plugin darts           # needs DARTS_DB_* in the environment
```
