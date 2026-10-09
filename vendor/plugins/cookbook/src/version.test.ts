import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseChangelog } from '@devquake/plugin-sdk';
import plugin from './index';

const { manifest } = plugin;

// Every fix or feature bumps the version shown in the app, with a CHANGELOG entry (ADR 0008).
// The three places that carry it must agree.
describe('version', () => {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  const changelog = parseChangelog(
    readFileSync(new URL('../CHANGELOG.md', import.meta.url), 'utf8'),
  );

  it('is the same in the manifest, package.json and the newest CHANGELOG entry', () => {
    expect(pkg.version).toBe(manifest.version);
    expect(changelog[0]?.version).toBe(manifest.version);
  });

  it('has a CHANGELOG with unique versions, newest first, each with notes', () => {
    const versions = changelog.map((e) => e.version);
    expect(new Set(versions).size).toBe(versions.length);
    const parts = (v: string) => v.split('.').map(Number);
    for (let i = 1; i < versions.length; i++) {
      const [a, b] = [parts(versions[i - 1]!), parts(versions[i]!)];
      const newer = a[0]! - b[0]! || a[1]! - b[1]! || a[2]! - b[2]!;
      expect(newer, `${versions[i - 1]} must be newer than ${versions[i]}`).toBeGreaterThan(0);
    }
    for (const entry of changelog) expect(entry.notes.length, entry.version).toBeGreaterThan(0);
  });

  // Translated release notes (ADR 0011) are optional, but when present they must cover the
  // same versions, so the app never shows a newer version without notes in that language.
  for (const lang of ['de', 'ro', 'hu']) {
    it(`CHANGELOG.${lang}.md has the same versions as the English one`, () => {
      const url = new URL(`../CHANGELOG.${lang}.md`, import.meta.url);
      let text: string;
      try {
        text = readFileSync(url, 'utf8');
      } catch {
        return;
      }
      const translated = parseChangelog(text);
      expect(translated.map((e) => e.version)).toEqual(changelog.map((e) => e.version));
      for (const entry of translated) expect(entry.notes.length, entry.version).toBeGreaterThan(0);
    });
  }
});
