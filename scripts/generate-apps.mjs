#!/usr/bin/env node
/**
 * Writes each app's deployment files from apps/<id>/app.json and selfhost.json, so every app is
 * set up the same way (Hostinger's "Deploy on Hostinger" rules, ADR 0054 in DevQuake):
 *
 *   apps/<id>/docker-compose.yml   the app, MySQL and Caddy (HTTPS), defaults for every variable
 *   apps/<id>/.env.example         every variable, explained
 *   apps/<id>/README.md            the Deploy button, first run, configuration, updates
 *
 *   node scripts/generate-apps.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(fs.readFileSync(path.join(root, 'selfhost.json'), 'utf8'));
const pkgVersion = (plugin) => {
  const p = path.join(root, 'vendor', 'plugins', plugin, 'package.json');
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')).version : '?';
};

const isMulti = (app) => app.plugins.length > 1;

/** Variables every instance has, grouped for .env.example and the README. */
const common = (app) => [
  {
    group: 'Address and HTTPS',
    vars: [
      isMulti(app)
        ? {
            name: 'DOMAIN',
            default: '',
            help: `Your domain (e.g. home.example.com). The home opens on it and each app on its own name: ${app.plugins.map((p) => `${p}.<domain>`).join(', ')}. Point the domain and those names (or a wildcard *.<domain>) at the server; Caddy gets HTTPS certificates by itself.`,
          }
        : {
            name: 'DOMAIN',
            default: '',
            help: `Your domain for this app (e.g. ${app.id}.example.com), pointed at the server. Caddy then gets an HTTPS certificate by itself. Empty: plain HTTP on the server's IP address.`,
          },
      ...(isMulti(app)
        ? [
            {
              name: 'PUBLIC_IP',
              default: '',
              help: "No domain? The server's IP address (e.g. 203.0.113.5): the apps then use free sslip.io names (203-0-113-5.sslip.io, expenses.203-0-113-5.sslip.io, ...) with HTTPS, without setting up DNS. Ignored when DOMAIN is set.",
            },
          ]
        : []),
      {
        name: 'PUBLIC_URL',
        default: '',
        help: 'The address people open, for links in emails. Empty: https://DOMAIN, or the address of each request.',
      },
      { name: 'HTTP_PORT', default: '80', help: 'Port for HTTP on the server.', compose: 'caddy' },
      {
        name: 'HTTPS_PORT',
        default: '443',
        help: 'Port for HTTPS on the server.',
        compose: 'caddy',
      },
    ],
  },
  isMulti(app)
    ? {
        group: 'Database (the MySQL container in this file)',
        vars: [
          {
            name: 'DB_NAME',
            default: app.id,
            help: `The instance's database; each app gets its own next to it (${app.id}_expenses, ...).`,
          },
          {
            name: 'DB_ROOT_PASSWORD',
            default: `${app.id}-change-me`,
            help: "MySQL's root password: the app creates one database per app, which needs root. The database is not reachable from outside the server, but change it before the first start if you can: it cannot be changed here afterwards.",
          },
        ],
      }
    : {
        group: 'Database (the MySQL container in this file)',
        vars: [
          { name: 'DB_NAME', default: app.id, help: 'Database name.' },
          { name: 'DB_USER', default: app.id, help: 'Database user.' },
          {
            name: 'DB_PASSWORD',
            default: `${app.id}-change-me`,
            help: 'Database password. The database is not reachable from outside the server, but change it before the first start if you can: it cannot be changed here afterwards.',
          },
        ],
      },
  {
    group: 'Email (optional: reminders and notices)',
    vars: [
      {
        name: 'SMTP_HOST',
        default: '',
        help: 'Your SMTP server, e.g. smtp.hostinger.com. Empty: no emails.',
      },
      { name: 'SMTP_PORT', default: '587', help: '587 (STARTTLS) or 465 (TLS).' },
      { name: 'SMTP_SECURE', default: '', help: 'true for port 465. Empty: decided by the port.' },
      { name: 'SMTP_USER', default: '', help: 'SMTP user name.' },
      { name: 'SMTP_PASSWORD', default: '', help: 'SMTP password.' },
      {
        name: 'SMTP_FROM',
        default: '',
        help: 'Sender, e.g. "Pulse <no-reply@example.com>". Empty: SMTP_USER.',
      },
    ],
  },
  {
    group: 'Instance',
    vars: [
      { name: 'DEFAULT_LOCALE', default: 'en', help: 'Language of emails: en, de, ro or hu.' },
      {
        name: 'SHOW_POWERED_BY',
        default: 'true',
        help: 'false hides the "powered by DevQuake" line at the bottom of every page.',
      },
      {
        name: 'APP_SECRET',
        default: '',
        help: 'Instance secret. Made on first start and kept in the data volume; set it to manage it yourself.',
      },
      {
        name: 'APP_VERSION',
        default: 'latest',
        help: 'Image tag to run, e.g. a version number.',
        compose: 'image',
      },
    ],
  },
];

function groups(app) {
  const own = [
    ...Object.entries(app.secrets ?? {}).map(([name, s]) => ({ name, default: '', help: s.help })),
    ...(app.env ?? []),
  ];
  return [...common(app), ...(own.length ? [{ group: `${app.name}`, vars: own }] : [])];
}

function compose(app) {
  const appVars = groups(app)
    .flatMap((g) => g.vars)
    .filter((v) => !v.compose);
  const quote = (s) => (s === '' || /^[\w.@:/-]+$/.test(s) ? s : JSON.stringify(s));
  const multi = isMulti(app);
  const envLines = [
    '      DB_HOST: db',
    '      DB_PORT: 3306',
    ...(multi ? ['      DB_USER: root'] : []),
    ...appVars
      .filter((v) => !(multi && v.name === 'DB_ROOT_PASSWORD'))
      .map((v) => `      ${v.name}: \${${v.name}:-${quote(v.default)}}`),
    ...(multi ? [`      DB_PASSWORD: \${DB_ROOT_PASSWORD:-${app.id}-change-me}`] : []),
  ];
  const dbEnv = multi
    ? `      MYSQL_DATABASE: \${DB_NAME:-${app.id}}
      MYSQL_ROOT_PASSWORD: \${DB_ROOT_PASSWORD:-${app.id}-change-me}`
    : `      MYSQL_DATABASE: \${DB_NAME:-${app.id}}
      MYSQL_USER: \${DB_USER:-${app.id}}
      MYSQL_PASSWORD: \${DB_PASSWORD:-${app.id}-change-me}
      MYSQL_RANDOM_ROOT_PASSWORD: 'yes'`;
  const ping = multi
    ? `'mysqladmin ping -h 127.0.0.1 -uroot -p"$$MYSQL_ROOT_PASSWORD" --silent'`
    : `'mysqladmin ping -h 127.0.0.1 -u"$$MYSQL_USER" -p"$$MYSQL_PASSWORD" --silent'`;
  // Several apps: Caddy serves the home and every app's name, built from DOMAIN or PUBLIC_IP.
  const caddy = multi
    ? `  # The home and every app on its own name, with HTTPS, from DOMAIN (or PUBLIC_IP's sslip.io
  # names); anything else (the bare IP) over plain HTTP, where the home explains what to set.
  caddy:
    image: caddy:2.8-alpine
    restart: unless-stopped
    depends_on:
      - app
    environment:
      DOMAIN: \${DOMAIN:-}
      PUBLIC_IP: \${PUBLIC_IP:-}
      APPS: ${app.plugins.join(' ')}
    command:
      - sh
      - -c
      - |
        D="$$DOMAIN"
        if [ -z "$$D" ] && [ -n "$$PUBLIC_IP" ]; then D="$$(echo "$$PUBLIC_IP" | tr . -).sslip.io"; fi
        : > /etc/caddy/Caddyfile
        if [ -n "$$D" ]; then
          H="$$D"; for a in $$APPS; do H="$$H, $$a.$$D"; done
          printf '%s {\\n\\treverse_proxy app:3000\\n}\\n' "$$H" >> /etc/caddy/Caddyfile
        fi
        printf ':80 {\\n\\treverse_proxy app:3000\\n}\\n' >> /etc/caddy/Caddyfile
        exec caddy run --config /etc/caddy/Caddyfile --adapter caddyfile
    ports:`
    : `  # HTTPS by itself once DOMAIN is set and pointed at the server; plain HTTP on port 80 until then.
  caddy:
    image: caddy:2.8-alpine
    restart: unless-stopped
    depends_on:
      - app
    command: caddy reverse-proxy --from \${DOMAIN:-:80} --to app:3000
    ports:`;
  return `# ${app.name}, self-hosted (DevQuake). ${config.repository ? `https://github.com/${config.repository}` : ''}
# Deploy on Hostinger, or anywhere with Docker: docker compose up -d
# Every variable has a default; set your own in the host's Docker Manager or a .env file next to
# this one (see .env.example). Generated by scripts/generate-apps.mjs: edit app.json instead.
name: devquake-${app.id}

services:
  app:
    image: ${config.registry}/devquake-${app.id}:\${APP_VERSION:-latest}
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
    environment:
${envLines.join('\n')}
    volumes:
      - app-data:/data

  db:
    image: mysql:8.4
    restart: unless-stopped
    command: --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci
    environment:
${dbEnv}
    volumes:
      - db-data:/var/lib/mysql
    healthcheck:
      test: ['CMD-SHELL', ${ping}]
      interval: 5s
      timeout: 5s
      retries: 30
      start_period: 30s

${caddy}
      - '\${HTTP_PORT:-80}:80'
      - '\${HTTPS_PORT:-443}:443'
    volumes:
      - caddy-data:/data

volumes:
  app-data:
  db-data:
  caddy-data:
`;
}

function envExample(app) {
  const lines = [
    `# ${app.name}, self-hosted: every setting. Copy to .env next to docker-compose.yml and`,
    '# change what you need; empty lines keep the default. Restart after changes:',
    '#   docker compose up -d',
    '',
  ];
  for (const g of groups(app)) {
    lines.push(`# --- ${g.group} ${'-'.repeat(Math.max(3, 90 - g.group.length))}`, '');
    for (const v of g.vars) {
      for (const part of wrap(v.help, 96)) lines.push(`# ${part}`);
      lines.push(`${v.name}=${v.default}`, '');
    }
  }
  return lines.join('\n');
}

function wrap(text, width) {
  const out = [];
  let line = '';
  for (const word of text.split(' ')) {
    if ((line + ' ' + word).trim().length > width) {
      out.push(line.trim());
      line = word;
    } else line += ` ${word}`;
  }
  if (line.trim()) out.push(line.trim());
  return out;
}

const utm = (app, medium) =>
  `utm_source=selfhost&utm_medium=${medium}&utm_campaign=${encodeURIComponent(app.id)}`;

function deployLink(app) {
  const raw = `https://raw.githubusercontent.com/${config.repository}/${config.branch}/apps/${app.id}/docker-compose.yml`;
  const referral = config.hostingerReferralCode
    ? `&REFERRALCODE=${encodeURIComponent(config.hostingerReferralCode)}`
    : '';
  return `https://www.hostinger.com/docker-hosting?compose_url=${encodeURIComponent(raw)}${referral}`;
}

/** How the instance gets its address(es): one domain, or for several apps one name per app. */
function addresses(app) {
  if (!isMulti(app)) {
    return `## Your domain and HTTPS

Point your domain's DNS (an A record) at the server, set \`DOMAIN=${app.id}.example.com\` and run
\`docker compose up -d\` again: Caddy gets a certificate by itself and the app is served over
HTTPS.`;
  }
  const names = app.plugins.map((p) => `\`${p}.home.example.com\``).join(', ');
  return `## The apps' addresses

${app.name} opens on your domain and each app on its own name under it, with one sign-in for
all of them. Choose one:

- **Your domain:** point \`home.example.com\` and ${names} (or a wildcard \`*.home.example.com\`)
  at the server with A records, set \`DOMAIN=home.example.com\` and run \`docker compose up -d\`
  again. Caddy gets a certificate for every name by itself.
- **No domain yet:** set \`PUBLIC_IP\` to the server's IP address (e.g. \`203.0.113.5\`) and run
  \`docker compose up -d\` again. The apps then use free [sslip.io](https://sslip.io) names, such
  as \`https://203-0-113-5.sslip.io\` and \`https://expenses.203-0-113-5.sslip.io\`, with HTTPS
  and no DNS to set up.

Until then, \`http://<your server's IP>/\` shows the home with these instructions; the setup page
works there too.

## Working together

The apps are connected for everyone on your server: a utility bill or what you bought on a
shopping list becomes a shared expense in one tap, recipes go into the meal plan, and the meal
plan fills a shopping list.`;
}

function readme(app) {
  const versions = app.plugins.map((p) => `${p} ${pkgVersion(p)}`).join(', ');
  const table = groups(app)
    .flatMap((g) => g.vars)
    .map((v) => `| \`${v.name}\` | ${v.default === '' ? '—' : `\`${v.default}\``} | ${v.help} |`)
    .join('\n');
  return `# ${app.name} — self-hosted

${app.tagline}

> ${app.hostedNote ?? `**Prefer not to run a server?** ${app.name} is free on DevQuake, hosted for you:`}
> [${new URL(app.hostedUrl).host}](${app.hostedUrl}/?${utm(app, 'readme')})

[![Deploy on Hostinger](https://assets.hostinger.com/vps/deploy.svg)](${deployLink(app)})

For: ${app.audience}

## What it does

${app.features.map((f) => `- ${f}`).join('\n')}

## Deploy

**On Hostinger:** click **Deploy on Hostinger** above, choose a VPS plan and finish the
checkout. The VPS opens Docker Manager with this app's
[docker-compose.yml](docker-compose.yml) ready: deploy it.

**Anywhere with Docker:** copy [docker-compose.yml](docker-compose.yml) (and, if you want to
change settings, [.env.example](.env.example) as \`.env\`) to the server, then:

\`\`\`sh
docker compose up -d
\`\`\`

It runs three containers: the app, its own MySQL database and Caddy for HTTPS. Nothing here
depends on DevQuake's servers.

## First run

1. Open \`http://<your server's IP>/\` (or your domain, see below). The first start creates the
   database tables and the app's secrets by itself; it can take a minute.
2. The **setup page** asks for the admin account: your name, email and a password. It is shown
   only once.
3. Invite the people who should use the app from **This instance** (top right): each gets a
   link that works once.

${addresses(app)}

## Configuration

Everything is set with environment variables: in Hostinger's Docker Manager, or in a \`.env\`
file next to \`docker-compose.yml\` ([.env.example](.env.example) explains each one). Restart
with \`docker compose up -d\` after a change.

| Variable | Default | What it does |
| --- | --- | --- |
${table}

## Updating and backups

\`\`\`sh
docker compose pull && docker compose up -d
\`\`\`

Updates run their database changes by themselves. Back up the \`db-data\` volume (or a
\`mysqldump\`) and the \`app-data\` volume, which holds the generated secrets.

## Without Docker

On a server with Node.js 22 and MySQL 8: clone the repository, then

\`\`\`sh
pnpm install
node scripts/setup.mjs ${app.id}   # asks for the database, tests it, creates it, writes .env
pnpm build && pnpm start
\`\`\`

## About

${app.name} is a [DevQuake](https://devquake.com/?${utm(app, 'readme')}) app (${versions}),
packaged to run on its own. Licence: [MIT](../../LICENSE). Problems and ideas:
[GitHub issues](https://github.com/${config.repository}/issues).
`;
}

const apps = fs
  .readdirSync(path.join(root, 'apps'))
  .filter((id) => fs.existsSync(path.join(root, 'apps', id, 'app.json')));
for (const id of apps) {
  const app = JSON.parse(fs.readFileSync(path.join(root, 'apps', id, 'app.json'), 'utf8'));
  const dir = path.join(root, 'apps', id);
  fs.writeFileSync(path.join(dir, 'docker-compose.yml'), compose(app));
  fs.writeFileSync(path.join(dir, '.env.example'), envExample(app));
  fs.writeFileSync(path.join(dir, 'README.md'), readme(app));
  console.log(`[apps] ${id}: docker-compose.yml, .env.example, README.md`);
}
if (!config.hostingerReferralCode) {
  console.warn(
    '[apps] selfhost.json has no hostingerReferralCode: the Deploy buttons earn nothing yet.',
  );
}
