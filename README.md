# DevQuake self-hosted

[DevQuake](https://devquake.com/?utm_source=selfhost&utm_medium=readme&utm_campaign=repo) apps
packaged to run on your own server: one app per instance, with its own MySQL database, set up
from a single `docker-compose.yml`. No dependency on DevQuake's servers.

> **Prefer not to run a server?** Every app is free on
> [devquake.com](https://devquake.com/?utm_source=selfhost&utm_medium=readme&utm_campaign=repo),
> hosted for you.

## Apps

| App                                | For                                                            | Deploy                                |
| ---------------------------------- | -------------------------------------------------------------- | ------------------------------------- |
| [Pulse](apps/pulse/README.md)      | A self-hosted realtime events API (a Pusher-style service)     | [README](apps/pulse/README.md#deploy) |
| [Darts club](apps/darts/README.md) | Clubs and pubs: profiles, practice, live games and tournaments | [README](apps/darts/README.md#deploy) |

Planned: **Household** (shared expenses with utility bills, recipes, meal plans and shopping
lists in one instance) and **Store** (a lightweight shop with payments and shipping).

Each app's README has the **Deploy on Hostinger** button, the first run and every setting.

## How an instance works

- **Single tenant:** one admin (created on the first run in the browser) and the members they
  invite with one-time links.
- **Configured with environment variables only:** the database, the address, email (SMTP) and the
  app's settings; each app's `.env.example` explains them, and `docker-compose.yml` has a working
  default for every one.
- **Starts by itself:** it waits for the database, creates and updates its tables, and makes the
  secrets it needs in the `/data` volume.
- **Three containers:** the app, MySQL 8 and Caddy, which serves HTTPS once `DOMAIN` is set.

## This repository

```
shell/                     the host: runs one DevQuake app with its own sign-in and database
vendor/                    DevQuake's shared packages and the apps' code (scripts/sync.mjs)
apps/<app>/app.json        what an app is: its plugin, variables and description
apps/<app>/…               docker-compose.yml, .env.example, README.md (scripts/generate-apps.mjs)
scripts/                   sync, select-app, generate-apps, setup
Dockerfile                 one image per app: --build-arg APP=<app>
```

The apps are developed in DevQuake; `vendor/` holds released copies, never edited here.

### Development

```sh
pnpm install
node scripts/select-app.mjs pulse      # the app the shell runs
cp apps/pulse/.env.example shell/.env  # then set DB_* to a local MySQL
pnpm dev                               # http://localhost:3000
```

Updating from DevQuake (a checkout next to this one):

```sh
node scripts/sync.mjs                  # copies the released packages and apps into vendor/
node scripts/generate-apps.mjs         # rewrites each app's compose file, env example, README
pnpm install && pnpm typecheck
```

Building and running an image locally:

```sh
APP=pulse docker compose -f apps/pulse/docker-compose.yml -f docker-compose.build.yml up --build
```

GitHub Actions ([images.yml](.github/workflows/images.yml)) builds every app, starts its Compose
stack, checks the first run and publishes the images to GHCR.

`selfhost.json` holds the repository, the image registry and the Hostinger referral code used by
the Deploy buttons.

## Licence

[AGPL-3.0](LICENSE). Running a changed version for others means offering them its source.
