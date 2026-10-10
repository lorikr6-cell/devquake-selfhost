# Store — self-hosted

Your own online shop on your own server: products of any type, campaigns, vouchers and newsletters, reviews, buyer accounts, your own design, card, PayPal, bank transfer or cash on delivery, and pages search engines can index.

> **More apps without a server?** DevQuake hosts free apps for your household, health and hobbies:
> [devquake.com](https://devquake.com/?utm_source=selfhost&utm_medium=readme&utm_campaign=store)

[![Deploy on Hostinger](https://assets.hostinger.com/vps/deploy.svg)](https://www.hostinger.com/docker-hosting?compose_url=https%3A%2F%2Fraw.githubusercontent.com%2Florikr6-cell%2Fdevquake-selfhost%2Fmain%2Fapps%2Fstore%2Fdocker-compose.yml&REFERRALCODE=BYLLORIKRXAQ)

For: Makers, small brands and local shops who want to sell online without a monthly shop subscription.

## What it does

- Products of any type with their own fields (ready-made for electronics, clothing, books, food and more), options, photos, stock, vendors and sale prices
- Card payments with your own Stripe account, PayPal, bank transfer and cash on delivery: the money goes straight to you
- Automatic discounts and free shipping from an amount or a number of items, shown in the cart before checkout
- Campaigns, voucher codes, announcements and email newsletters with product cards to confirmed subscribers
- Buyers need no account to order; with one they see their orders and write to you. Reviews, product comparison, sharing and QR codes
- Your own logo, banner, colours and fonts; search engine texts with a score per product; Google Analytics, Google Ads or the Meta pixel after the buyer agrees
- A team where each member can have several roles (products, marketing, support, shipping, maintenance) and an overview of their tasks; statistics per product
- Maintenance mode, and your shop in any language: copy the labels, translate them and paste them back

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

Point your domain's DNS (an A record) at the server, set `DOMAIN=store.example.com` and run
`docker compose up -d` again: Caddy gets a certificate by itself and the app is served over
HTTPS.

## Configuration

Everything is set with environment variables: in Hostinger's Docker Manager, or in a `.env`
file next to `docker-compose.yml` ([.env.example](.env.example) explains each one). Restart
with `docker compose up -d` after a change.

| Variable | Default | What it does |
| --- | --- | --- |
| `DOMAIN` | — | Your domain for this app (e.g. store.example.com), pointed at the server. Caddy then gets an HTTPS certificate by itself. Empty: plain HTTP on the server's IP address. |
| `PUBLIC_URL` | — | The address people open, for links in emails. Empty: https://DOMAIN, or the address of each request. |
| `HTTP_PORT` | `80` | Port for HTTP on the server. |
| `HTTPS_PORT` | `443` | Port for HTTPS on the server. |
| `DB_NAME` | `store` | Database name. |
| `DB_USER` | `store` | Database user. |
| `DB_PASSWORD` | `store-change-me` | Database password. The database is not reachable from outside the server, but change it before the first start if you can: it cannot be changed here afterwards. |
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
| `STORE_MASTER_KEY` | — | Encrypts the Stripe and PayPal secrets the shop owner enters (32 random bytes, base64). Made on first start and kept in the data volume; set it to manage it yourself. Changing it makes the saved secrets unreadable: enter them again. |

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
node scripts/setup.mjs store   # asks for the database, tests it, creates it, writes .env
pnpm build && pnpm start
```

## About

Store is a [DevQuake](https://devquake.com/?utm_source=selfhost&utm_medium=readme&utm_campaign=store) app (store 0.3.0),
packaged to run on its own. Licence: [MIT](../../LICENSE). Problems and ideas:
[GitHub issues](https://github.com/lorikr6-cell/devquake-selfhost/issues).
