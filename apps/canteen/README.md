# Social canteen — self-hosted

For organisations that feed elderly people, on your own server: profiles with ID card reading, meal plans and the kitchen sheet, delivery routes with a map and the drivers' phones, and a medical file, each role seeing only what it needs.

> **Prefer not to run a server?** Social canteen is free on DevQuake, hosted for you:
> [canteen.devquake.com](https://canteen.devquake.com/?utm_source=selfhost&utm_medium=readme&utm_campaign=canteen)

[![Deploy on Hostinger](https://assets.hostinger.com/vps/deploy.svg)](https://www.hostinger.com/docker-hosting?compose_url=https%3A%2F%2Fraw.githubusercontent.com%2Florikr6-cell%2Fdevquake-selfhost%2Fmain%2Fapps%2Fcanteen%2Fdocker-compose.yml&REFERRALCODE=BYLLORIKRXAQ)

For: Social services, NGOs, parishes and care homes that cook for elderly people and deliver meals to their homes.

## What it does

- People living at home or in your care home: address, diet, allergies, a note for the driver, birthdays in a calendar
- The ID card read on the device, personal numbers and every document stored encrypted, and a record of who opened them
- Weekly menus with diet variants and a printable kitchen sheet with portions, allergies and box labels
- Delivery routes per driver with time windows, the order computed from the map (optional OpenRouteService key), printed sheets
- Drivers on their phone: the route as a list or on a map, what is in each package, a tick and a comment per stop
- A medical file for the medical staff: medications and the daily round, notes, hospital stays and papers
- Roles for organisers, coordinators, kitchen, drivers and medical staff; the whole organisation to Excel and back

## Deploy

**On Hostinger:** click **Deploy on Hostinger** above, choose a VPS plan and finish the
checkout. The VPS opens Docker Manager with this app's
[docker-compose.yml](docker-compose.yml) ready: deploy it.

**Anywhere with Docker:** copy [docker-compose.yml](docker-compose.yml) (and, if you want to
change settings, [.env.example](.env.example) as `.env`) to the server, then:

```sh
docker compose up -d
```

It runs three containers: the app, its own MySQL database and Caddy for HTTPS. Nothing here
depends on DevQuake's servers.

## First run

1. Open `http://<your server's IP>/` (or your domain, see below). The first start creates the
   database tables and the app's secrets by itself; it can take a minute.
2. The **setup page** asks for the admin account: your name, email and a password. It is shown
   only once.
3. Invite the people who should use the app from **This instance** (top right): each gets a
   link that works once.

## Your domain and HTTPS

Point your domain's DNS (an A record) at the server, set `DOMAIN=canteen.example.com` and run
`docker compose up -d` again: Caddy gets a certificate by itself and the app is served over
HTTPS.

## Configuration

Everything is set with environment variables: in Hostinger's Docker Manager, or in a `.env`
file next to `docker-compose.yml` ([.env.example](.env.example) explains each one). Restart
with `docker compose up -d` after a change.

| Variable | Default | What it does |
| --- | --- | --- |
| `DOMAIN` | — | Your domain for this app (e.g. canteen.example.com), pointed at the server. Caddy then gets an HTTPS certificate by itself. Empty: plain HTTP on the server's IP address. |
| `PUBLIC_URL` | — | The address people open, for links in emails. Empty: https://DOMAIN, or the address of each request. |
| `HTTP_PORT` | `80` | Port for HTTP on the server. |
| `HTTPS_PORT` | `443` | Port for HTTPS on the server. |
| `DB_NAME` | `canteen` | Database name. |
| `DB_USER` | `canteen` | Database user. |
| `DB_PASSWORD` | `canteen-change-me` | Database password. The database is not reachable from outside the server, but change it before the first start if you can: it cannot be changed here afterwards. |
| `SMTP_HOST` | — | Your SMTP server, e.g. smtp.hostinger.com. Empty: no emails. |
| `SMTP_PORT` | `587` | 587 (STARTTLS) or 465 (TLS). |
| `SMTP_SECURE` | — | true for port 465. Empty: decided by the port. |
| `SMTP_USER` | — | SMTP user name. |
| `SMTP_PASSWORD` | — | SMTP password. |
| `SMTP_FROM` | — | Sender, e.g. "Pulse <no-reply@example.com>". Empty: SMTP_USER. |
| `DEFAULT_LOCALE` | `en` | Language of emails: en, de, ro, hu, it or es. |
| `SHOW_POWERED_BY` | `true` | false hides the "Powered by DevQuake" footer at the bottom of every page (see "The DevQuake footer"). |
| `APP_SECRET` | — | Instance secret. Made on first start and kept in the data volume; set it to manage it yourself. |
| `APP_VERSION` | `latest` | Image tag to run, e.g. a version number. |
| `CANTEEN_MASTER_KEY` | — | Encrypts personal numbers, ID card pictures, documents and the medical file (32 random bytes, base64). Made on first start and kept in the data volume; set it to manage it yourself. Keep a copy: losing or changing it makes everything it encrypted unreadable. |
| `CANTEEN_ORS_KEY` | — | Optional: a free key from openrouteservice.org. Shows "Compute the order from the map" on routes and places the drivers' stops on their map. Only addresses are sent, never names. |

## Updating and backups

```sh
docker compose pull && docker compose up -d
```

Updates run their database changes by themselves. Back up the `db-data` volume (or a
`mysqldump`) and the `app-data` volume, which holds the generated secrets.

## Without Docker

On a server with Node.js 22 and MySQL 8: clone the repository, then

```sh
pnpm install
node scripts/setup.mjs canteen   # asks for the database, tests it, creates it, writes .env
pnpm build && pnpm start
```

## The DevQuake footer

Every page ends with a small footer: "Self-hosted Social canteen · Powered by" and the DevQuake logo,
which links to devquake.com. We would appreciate it if you kept it: it is how other people find
DevQuake, and it keeps these apps free. You are free to remove it, though: set
`SHOW_POWERED_BY=false`, or change the code. The MIT licence does not require the footer; it
only asks that the licence and copyright notice stay with copies of the code.

## About

Social canteen is a [DevQuake](https://devquake.com/?utm_source=selfhost&utm_medium=readme&utm_campaign=canteen) app (canteen 0.16.1),
packaged to run on its own. Licence: [MIT](../../LICENSE). Problems and ideas:
[GitHub issues](https://github.com/lorikr6-cell/devquake-selfhost/issues).
