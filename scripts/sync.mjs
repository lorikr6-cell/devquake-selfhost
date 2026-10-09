#!/usr/bin/env node
/**
 * Copies the released DevQuake code the instances run into vendor/ (ADR 0054 in DevQuake): the
 * shared packages and the plugins listed in apps/<id>/app.json. The plugins are never edited
 * here: fix them in DevQuake and sync again.
 *
 *   node scripts/sync.mjs                      every app, from ../devquake
 *   node scripts/sync.mjs --from <path>        another DevQuake checkout
 *   node scripts/sync.mjs pulse darts          only these apps (and the shared packages)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const fromIndex = args.indexOf('--from');
const source = path.resolve(root, fromIndex === -1 ? '../devquake' : args[fromIndex + 1]);
const only = args.filter(
  (a, i) => !a.startsWith('--') && (fromIndex === -1 || i !== fromIndex + 1),
);

if (!fs.existsSync(path.join(source, 'packages', 'plugin-sdk'))) {
  console.error(`[sync] No DevQuake checkout at ${source}. Pass --from <path>.`);
  process.exit(1);
}

// Build output, dependencies and notes for DevQuake's own tooling stay behind.
const SKIP = new Set(['node_modules', '.next', '.turbo', 'CLAUDE.md']);
function copy(from, to) {
  fs.rmSync(to, { recursive: true, force: true });
  fs.cpSync(from, to, { recursive: true, filter: (src) => !SKIP.has(path.basename(src)) });
}

const apps = fs
  .readdirSync(path.join(root, 'apps'))
  .filter((id) => fs.existsSync(path.join(root, 'apps', id, 'app.json')))
  .filter((id) => only.length === 0 || only.includes(id));

for (const pkg of ['plugin-sdk', 'ui', 'tsconfig']) {
  copy(path.join(source, 'packages', pkg), path.join(root, 'vendor', 'packages', pkg));
  console.log(`[sync] packages/${pkg}`);
}
for (const id of apps) {
  const app = JSON.parse(fs.readFileSync(path.join(root, 'apps', id, 'app.json'), 'utf8'));
  for (const plugin of app.plugins) {
    copy(path.join(source, 'plugins', plugin), path.join(root, 'vendor', 'plugins', plugin));
    const { version } = JSON.parse(
      fs.readFileSync(path.join(root, 'vendor', 'plugins', plugin, 'package.json'), 'utf8'),
    );
    console.log(`[sync] plugins/${plugin} ${version}`);
  }
}
console.log('[sync] Done. Next: pnpm install, then node scripts/select-app.mjs <app>.');
