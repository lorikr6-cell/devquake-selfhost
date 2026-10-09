# Pulse

DevQuake app served at `https://pulse.devquake.com` (local: `http://pulse.localhost:3000`): a
realtime events API. Own MySQL database (ADR 0007); the developer API uses **key routes** and the
owner's access level from the host (ADR 0023).

A member creates **API services** (apps). Their server (secret key), their users (client tokens)
or pages on their verified websites (public key) send **events** — a fixed frame
`{ channel, event, data }` with the member's own flat key:value `data` — and every browser
listening to the channel receives them live (Server-Sent Events, with polling as fallback).
Members may describe the keys of each event (**event types**) and refuse everything else
(**strict**). Services are never shared with other members.

## Routes

| Type | Pattern                       | File                     | Purpose                                                        |
| ---- | ----------------------------- | ------------------------ | -------------------------------------------------------------- |
| Page | `/`                           | `src/pages/home.tsx`     | Services, new service (secret shown once), plan and limits     |
| Page | `/apps/:id`                   | `src/pages/app.tsx`      | Keys, websites (DNS proof), data structure, code, usage, log   |
| Page | `/apps/:id/test`              | `src/pages/test.tsx`     | Live test: listen and send as the owner, two-device scenario   |
| Page | `/help`                       | `src/pages/help.tsx`     | User manual and code examples; **public** (ADR 0009)           |
| Page | `/demo`                       | `src/pages/demo.tsx`     | Check it live: two browsers, one private channel (ADR 0029)    |
| API  | `/health`                     | `src/api/health.ts`      | Liveness                                                       |
| API  | `/apps`                       | `src/api/apps.ts`        | GET own services; POST `{ name }` → `{ id, secret }`           |
| API  | `/apps/:id`                   | `src/api/app.ts`         | PATCH name and settings; DELETE with all its data              |
| API  | `/apps/:id/secret`            | `src/api/secret.ts`      | POST: new secret (previous one valid 24 h)                     |
| API  | `/apps/:id/origins`           | `src/api/origins.ts`     | POST `{ origin }`: add a website                               |
| API  | `/apps/:id/origins/:originId` | `src/api/origin.ts`      | POST: check the DNS TXT proof; DELETE                          |
| API  | `/apps/:id/event-types`       | `src/api/event-types.ts` | PUT all event types                                            |
| API  | `/apps/:id/test-token`        | `src/api/test-token.ts`  | POST: a 10-minute client token for the live test               |
| API  | `/demo/token`                 | `src/api/demo-token.ts`  | POST `{ browser }`: a 10-minute demo token for own channel     |
| API  | `/admin/calls`                | `src/api/admin/calls.ts` | Admins: GET call totals and log size; POST clean; PUT interval |
| API  | `/v1/events`                  | `src/api/v1/events.ts`   | **Key route**: POST one event (202 `{ id, at }`)               |
| API  | `/v1/stream`                  | `src/api/v1/stream.ts`   | **Key route**: GET live events (SSE, `Last-Event-ID` catch-up) |
| API  | `/v1/poll`                    | `src/api/v1/poll.ts`     | **Key route**: GET events after an id (fallback)               |
| API  | `/v1/client`                  | `src/api/v1/client.ts`   | **Key route**: GET the browser library (JavaScript)            |

**Key routes** (`manifest.keyRoutes`, ADR 0023): the host lets them through without a session,
subscription or same-origin check and routes CORS preflights (OPTIONS) to them. Every call is
identified in `src/lib/gateway.ts`; the extension-less `/v1/client` is on purpose (the host's proxy
skips paths with a file extension).

## Security model (`src/lib/gateway.ts`, `src/lib/keys.ts`)

| Credential         | Where           | May                                                  | Checks                                                                                      |
| ------------------ | --------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Public key `pk_…`  | web pages       | listen to public channels; send if `browser_publish` | `Origin` must be a **DNS-verified** website (or localhost when allowed)                     |
| Secret key `sk_…`  | member's server | everything; signs client tokens                      | refused with an `Origin` (secret in a browser); optional IP allowlist; IPs counted (hashed) |
| Client token (JWT) | member's users  | the channels in `ch`; send if `pub`                  | HS256 with the secret (current or previous), `exp` ≤ 1 h, `Origin` verified when present    |
| Owner (live test)  | pulse itself    | everything                                           | same origin as the app and signed in as the owner                                           |

- Secrets are never stored: `sk_<public key id>_<HMAC-SHA-256(PULSE_MASTER_KEY, app id + salt)>`,
  checked by deriving again (timing-safe). Rotation changes the salt; the old secret works
  24 hours (`prev_secret_*`).
- Channels starting with `private-` never work with the public key alone.
- Anti-sharing: verified websites, secret refused in browsers, optional server IPs, per-app
  limits (a shared key cannot exceed the owner's plan), distinct secret-key addresses per day
  with a dashboard warning above 3, a security log (throttled to one entry per kind a minute),
  30 failed keys per IP in 10 minutes → 429.
- The owner's access comes from `ctx.accessOf` (member / trial / none, cached a minute): no
  subscription → 402 `subscription_required`.

## Limits (`src/lib/limits.ts`)

| Plan     | Services | Connections | Events/day | Events/min (burst) | Data  | Delay | History |
| -------- | -------- | ----------- | ---------- | ------------------ | ----- | ----- | ------- |
| trial    | 1        | 3           | 300        | 10 (3)             | 512 B | 3 s   | 1 h     |
| standard | 3        | 25          | 10,000     | 120 (10)           | 2 KB  | —     | 24 h    |
| full     | 20       | 200         | 250,000    | 1,200 (50)         | 8 KB  | —     | 7 days  |

`full` is set by DevQuake in the `accounts` table (`plan = 'full'`) after a "full access"
request (the plan panel links to the contact form); later this is where paid plans plug in.
Every process holds at most `PULSE_MAX_STREAMS` (default 30) live connections for everybody, so
Pulse can never take all of the site's connection slots; new ones get 503 `busy` and the client
falls back to polling. Live connections close after 20 s (trial) / 50 s and reconnect.

## Delivery (`src/lib/hub.ts`)

Events are stored in `events` by whichever process receives them. Each process runs **one**
query a second (`id > last`) while it has open connections and hands the rows to its own
listeners (by app, channel, cursor; trial events are held for the delay). A process delivers its
own events at once (`poke`). Open connections are counted across processes in `streams`
(`seen_at` refreshed every 30 s). The SSE response starts with 2 KB of padding and sends
`Cache-Control: no-transform` and `X-Accel-Buffering: no` so proxies do not hold it back.

**Hosting check (roadmap "realtime spike")**: after deploying, open the live test on two devices.
"Live" means SSE works through Hostinger's proxy; "Connected (polling)" means it is buffered or
blocked there and everything runs on polling (still working, a few seconds slower). Record the
result in ADR 0023.

## Database

Own database `u962314563_pulse` (ADR 0007), configured with `PULSE_DB_NAME`, `PULSE_DB_USER`,
`PULSE_DB_PWD` (optional `PULSE_DB_HOST`/`PULSE_DB_PORT`). Without them, or without
`PULSE_MASTER_KEY` (32 random bytes, base64: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`, or `openssl rand -base64 32` in Git Bash), the app says it is being
set up and the API answers 503. Never change the master key: every secret key would stop working.
Optional `PULSE_MAX_STREAMS`.

| File                  | Adds                                                                                             |
| --------------------- | ------------------------------------------------------------------------------------------------ |
| `0001_pulse.sql`      | accounts, apps, app_origins, event_types, events, usage_daily, server_ips, security_log, streams |
| `0002_api_calls.sql`  | api_calls (call log), api_totals (call totals), settings (log cleaning)                          |
| `0003_pulse_demo.sql` | `apps.demo`: DevQuake's own demo service (user 0) for Check it live                              |

Scheduled hook (`src/platform.ts`, every few minutes): events older than a day (7 days for
`full`), usage and server IPs older than 35 days, security log older than 30 days, dead
connections, expired previous secrets, demo events older than an hour. `deleteUserData` removes the member's services with all
rows and their `accounts` row (account deletion, unsubscribing, unused trials).

## Check it live (`/demo`, ADR 0029)

A member opens `/demo` in two browsers signed in to the same account. `POST /api/demo/token`
signs a 10-minute client token of DevQuake's own demo service (`apps.demo = 1`, `user_id` 0,
created by `demoApp` on first use) for the member's private channel `private-demo-u<id>`, with
`sub` = `u<id>.<browser>`. The page listens with SSE (poll fallback) and sends with
`POST /api/v1/events` like any client. The frame (channel, `demo.message`/`demo.json`,
`demo_from`, `demo_sent_at`) is fixed; the member's message or flat JSON (`parseDemoJson`) goes
into `data`. The demo service always gets the `full` plan, each member is limited to 30 events a
minute (`demo:<member>` bucket in `v1/events.ts`), it is left out of the stats and its events are
deleted after an hour. Timings use each browser's clock offset to the server (`/api/health`).

## Going live

1. Merge to `main`; CI builds and Hostinger redeploys `devquake.com`.
2. Hostinger: subdomain `pulse`, DNS record if needed, SSL, and `public_html/pulse/.htaccess` (a
   copy of `public_html/shopping/.htaccess`). See the deployment guide, "App subdomains on
   Hostinger".
3. Database: create `u962314563_pulse`; add `PULSE_DB_NAME`, `PULSE_DB_USER`, `PULSE_DB_PWD` and
   `PULSE_MASTER_KEY` in hPanel → Environment variables **and** in `devquake.env`; apply
   `db/migrations/0001_pulse.sql` (`pnpm db:migrate --plugin pulse` or phpMyAdmin).
4. Restart the app subdomains: touch `hbuilds/current/nodejs/tmp/restart.txt`.
5. `/admin-cp/projects`: create the project with plugin id `pulse`, tick **Public** and
   **Online**, set the **NPS cost**.
6. Check `https://pulse.devquake.com/api/health`, then run the live test on two devices (see
   "Hosting check").
