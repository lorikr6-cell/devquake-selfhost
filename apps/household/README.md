# Household — self-hosted

Your household's apps on your own server: shared expenses and utility bills, recipes, a meal planner and shared shopping lists, with one sign-in and working together.

> **Prefer not to run a server?** Household is free on DevQuake, hosted for you:
> [devquake.com](https://devquake.com/?utm_source=selfhost&utm_medium=readme&utm_campaign=household)

[![Deploy on Hostinger](https://assets.hostinger.com/vps/deploy.svg)](https://www.hostinger.com/docker-hosting?compose_url=https%3A%2F%2Fraw.githubusercontent.com%2Florikr6-cell%2Fdevquake-selfhost%2Fmain%2Fapps%2Fhousehold%2Fdocker-compose.yml&REFERRALCODE=BYLLORIKRXAQ)

For: Flatmates, couples and families who want their household's money and meals on their own server.

## What it does

- Shared expenses: who paid what, who owes whom, and the fewest transfers to settle up
- Utility bills: upload the provider's PDF, split it with flatmates, see who paid
- Recipes, a weekly meal planner and shared shopping lists that fill each other
- A bill or what you bought becomes a shared expense in one tap
- One sign-in for every app; invite the people you live with by link

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

## The apps' addresses

Household opens on your domain and each app on its own name under it, with one sign-in for
all of them. Choose one:

- **Your domain:** point `home.example.com` and `expenses.home.example.com`, `utilities.home.example.com`, `shopping.home.example.com`, `cookbook.home.example.com`, `meals.home.example.com` (or a wildcard `*.home.example.com`)
  at the server with A records, set `DOMAIN=home.example.com` and run `docker compose up -d`
  again. Caddy gets a certificate for every name by itself.
- **No domain yet:** set `PUBLIC_IP` to the server's IP address (e.g. `203.0.113.5`) and run
  `docker compose up -d` again. The apps then use free [sslip.io](https://sslip.io) names, such
  as `https://203-0-113-5.sslip.io` and `https://expenses.203-0-113-5.sslip.io`, with HTTPS
  and no DNS to set up.

Until then, `http://<your server's IP>/` shows the home with these instructions; the setup page
works there too.

## Working together

The apps are connected for everyone on your server: a utility bill or what you bought on a
shopping list becomes a shared expense in one tap, recipes go into the meal plan, and the meal
plan fills a shopping list.

## Configuration

Everything is set with environment variables: in Hostinger's Docker Manager, or in a `.env`
file next to `docker-compose.yml` ([.env.example](.env.example) explains each one). Restart
with `docker compose up -d` after a change.

| Variable | Default | What it does |
| --- | --- | --- |
| `DOMAIN` | — | Your domain (e.g. home.example.com). The home opens on it and each app on its own name: expenses.<domain>, utilities.<domain>, shopping.<domain>, cookbook.<domain>, meals.<domain>. Point the domain and those names (or a wildcard *.<domain>) at the server; Caddy gets HTTPS certificates by itself. |
| `PUBLIC_IP` | — | No domain? The server's IP address (e.g. 203.0.113.5): the apps then use free sslip.io names (203-0-113-5.sslip.io, expenses.203-0-113-5.sslip.io, ...) with HTTPS, without setting up DNS. Ignored when DOMAIN is set. |
| `PUBLIC_URL` | — | The address people open, for links in emails. Empty: https://DOMAIN, or the address of each request. |
| `HTTP_PORT` | `80` | Port for HTTP on the server. |
| `HTTPS_PORT` | `443` | Port for HTTPS on the server. |
| `DB_NAME` | `household` | The instance's database; each app gets its own next to it (household_expenses, ...). |
| `DB_ROOT_PASSWORD` | `household-change-me` | MySQL's root password: the app creates one database per app, which needs root. The database is not reachable from outside the server, but change it before the first start if you can: it cannot be changed here afterwards. |
| `SMTP_HOST` | — | Your SMTP server, e.g. smtp.hostinger.com. Empty: no emails. |
| `SMTP_PORT` | `587` | 587 (STARTTLS) or 465 (TLS). |
| `SMTP_SECURE` | — | true for port 465. Empty: decided by the port. |
| `SMTP_USER` | — | SMTP user name. |
| `SMTP_PASSWORD` | — | SMTP password. |
| `SMTP_FROM` | — | Sender, e.g. "Pulse <no-reply@example.com>". Empty: SMTP_USER. |
| `DEFAULT_LOCALE` | `en` | Language of emails: en, de, ro or hu. |
| `SHOW_POWERED_BY` | `true` | false hides the "powered by DevQuake" line at the bottom of every page. |
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
node scripts/setup.mjs household   # asks for the database, tests it, creates it, writes .env
pnpm build && pnpm start
```

## About

Household is a [DevQuake](https://devquake.com/?utm_source=selfhost&utm_medium=readme&utm_campaign=household) app (expenses 0.2.0, utilities 0.11.0, shopping 0.21.0, cookbook 0.6.1, meals 0.4.1),
packaged to run on its own. Licence: [MIT](../../LICENSE). Problems and ideas:
[GitHub issues](https://github.com/lorikr6-cell/devquake-selfhost/issues).
