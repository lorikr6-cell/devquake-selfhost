#!/usr/bin/env node
/**
 * Setup without Docker (a VPS with Node.js 22 and MySQL 8): chooses the app, asks for the
 * database, tests it, creates the database and its user when you give an admin login, and writes
 * shell/.env. Then: pnpm build && pnpm start. The admin account is made in the browser.
 *
 *   node scripts/setup.mjs pulse
 */
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const app = process.argv[2];
if (!app || !fs.existsSync(path.join(root, 'apps', app, 'app.json'))) {
  console.error(
    `Usage: node scripts/setup.mjs <app>  (one of: ${fs.readdirSync(path.join(root, 'apps')).join(', ')})`,
  );
  process.exit(1);
}
const mysql = createRequire(path.join(root, 'shell', 'package.json'))('mysql2/promise');
const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = async (q, fallback = '') =>
  (await rl.question(`${q}${fallback ? ` [${fallback}]` : ''}: `)).trim() || fallback;
const IDENT = /^[A-Za-z0-9_]{1,64}$/;

console.log(`\nSetting up ${app}. Press Enter to keep the value in brackets.\n`);
const host = await ask('Database host', 'localhost');
const port = Number(await ask('Database port', '3306'));
let database = await ask('Database name', app.replace(/-/g, '_'));
let user = await ask('Database user', app.replace(/-/g, '_'));
while (!IDENT.test(database) || !IDENT.test(user)) {
  console.log('Use letters, digits and _ only.');
  database = await ask('Database name', app.replace(/-/g, '_'));
  user = await ask('Database user', app.replace(/-/g, '_'));
}
let password = await ask('Database password (empty: make a strong one)');
if (!password) password = crypto.randomBytes(18).toString('base64url');

const admin = await ask('Create the database and user with a MySQL admin login? (y/N)', 'n');
if (/^y/i.test(admin)) {
  const adminUser = await ask('MySQL admin user', 'root');
  const adminPassword = await ask('MySQL admin password');
  const conn = await mysql.createConnection({
    host,
    port,
    user: adminUser,
    password: adminPassword,
  });
  try {
    await conn.query(
      `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
    await conn.query('CREATE USER IF NOT EXISTS ?@? IDENTIFIED BY ?', [user, '%', password]);
    await conn.query('ALTER USER ?@? IDENTIFIED BY ?', [user, '%', password]);
    await conn.query(`GRANT ALL PRIVILEGES ON \`${database}\`.* TO ?@?`, [user, '%']);
    console.log(`Created database ${database} and user ${user}.`);
  } finally {
    await conn.end();
  }
}

try {
  const conn = await mysql.createConnection({ host, port, database, user, password });
  await conn.query('SELECT 1');
  await conn.end();
  console.log('The database connection works.');
} catch (err) {
  console.error(`Could not connect: ${err.message}. Check the values and run this again.`);
  rl.close();
  process.exit(1);
}

const publicUrl = await ask(
  'Public address (e.g. https://pulse.example.com, empty: from each request)',
);
const smtpHost = await ask('SMTP server for emails (empty: no emails)');
const smtp = smtpHost
  ? {
      SMTP_HOST: smtpHost,
      SMTP_PORT: await ask('SMTP port', '587'),
      SMTP_USER: await ask('SMTP user'),
      SMTP_PASSWORD: await ask('SMTP password'),
      SMTP_FROM: await ask('Sender address (empty: the SMTP user)'),
    }
  : {};
rl.close();

const env = {
  DB_HOST: host,
  DB_PORT: String(port),
  DB_NAME: database,
  DB_USER: user,
  DB_PASSWORD: password,
  PUBLIC_URL: publicUrl,
  DATA_DIR: path.join(root, 'data'),
  ...smtp,
};
const file = path.join(root, 'shell', '.env');
const body = Object.entries(env)
  .filter(([, v]) => v !== '')
  .map(([k, v]) => `${k}=${/[\s#"']/.test(v) ? JSON.stringify(v) : v}`)
  .join('\n');
fs.writeFileSync(
  file,
  `# Written by scripts/setup.mjs (${new Date().toISOString()}). See apps/${app}/.env.example.\n${body}\n`,
  { mode: 0o600 },
);
execFileSync(process.execPath, [path.join(root, 'scripts', 'select-app.mjs'), app], {
  stdio: 'inherit',
});
console.log(
  `\nWrote ${path.relative(root, file)}. Next:\n  pnpm build && pnpm start\nthen open the address and create the admin account.`,
);
