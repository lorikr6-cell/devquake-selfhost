# Venue — self-hosted

Your café, bistro, fast food or bar on its own server: the menu with VAT rates and the 14 allergens, staff with PINs on a shared tablet, and a public menu for your guests.

> **Prefer not to run a server?** Venue is free on DevQuake, hosted for you:
> [venue.devquake.com](https://venue.devquake.com/?utm_source=selfhost&utm_medium=readme&utm_campaign=venue)

[![Deploy on Hostinger](https://assets.hostinger.com/vps/deploy.svg)](https://www.hostinger.com/docker-hosting?compose_url=https%3A%2F%2Fraw.githubusercontent.com%2Florikr6-cell%2Fdevquake-selfhost%2Fmain%2Fapps%2Fvenue%2Fdocker-compose.yml&REFERRALCODE=BYLLORIKRXAQ)

For: Cafés, bistros, fast food places, small restaurants and bars.

## What it does

- Hungary and Romania ready with their currency and VAT rates; any other country set up by hand
- A menu in categories with prices, VAT rates, where each item is prepared and the 14 EU allergens
- Staff with a role and a PIN for the shared tablet, without accounts of their own
- Tablets enabled by the owner and disabled at once when one is lost
- A public menu for guests, for a QR code on the tables

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

Point your domain's DNS (an A record) at the server, set `DOMAIN=venue.example.com` and run
`docker compose up -d` again: Caddy gets a certificate by itself and the app is served over
HTTPS.

## Configuration

Everything is set with environment variables: in Hostinger's Docker Manager, or in a `.env`
file next to `docker-compose.yml` ([.env.example](.env.example) explains each one). Restart
with `docker compose up -d` after a change.

| Variable | Default | What it does |
| --- | --- | --- |
| `DOMAIN` | — | Your domain for this app (e.g. venue.example.com), pointed at the server. Caddy then gets an HTTPS certificate by itself. Empty: plain HTTP on the server's IP address. |
| `PUBLIC_URL` | — | The address people open, for links in emails. Empty: https://DOMAIN, or the address of each request. |
| `HTTP_PORT` | `80` | Port for HTTP on the server. |
| `HTTPS_PORT` | `443` | Port for HTTPS on the server. |
| `DB_NAME` | `venue` | Database name. |
| `DB_USER` | `venue` | Database user. |
| `DB_PASSWORD` | `venue-change-me` | Database password. The database is not reachable from outside the server, but change it before the first start if you can: it cannot be changed here afterwards. |
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
node scripts/setup.mjs venue   # asks for the database, tests it, creates it, writes .env
pnpm build && pnpm start
```

## The DevQuake footer

Every page ends with a small footer: "Self-hosted Venue · Powered by" and the DevQuake logo,
which links to devquake.com. We would appreciate it if you kept it: it is how other people find
DevQuake, and it keeps these apps free. You are free to remove it, though: set
`SHOW_POWERED_BY=false`, or change the code. The MIT licence does not require the footer; it
only asks that the licence and copyright notice stay with copies of the code.

## About

Venue is a [DevQuake](https://devquake.com/?utm_source=selfhost&utm_medium=readme&utm_campaign=venue) app (venue 0.8.0),
packaged to run on its own. Licence: [MIT](../../LICENSE). Problems and ideas:
[GitHub issues](https://github.com/lorikr6-cell/devquake-selfhost/issues).
