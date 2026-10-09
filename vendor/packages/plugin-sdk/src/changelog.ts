import type { PluginChangelogEntry } from './types';

/**
 * Parses a plugin's CHANGELOG.md into release entries, newest first (the file's own order).
 * Understands the format every plugin uses:
 *
 *   ## 0.3.0            (or "## 0.3.0 — 2026-09-24" / "## [0.3.0] - 2026-09-24")
 *   - A change, possibly
 *     continued on an indented line.
 *
 * Other lines (the title, paragraphs) are ignored.
 */
export function parseChangelog(markdown: string): PluginChangelogEntry[] {
  const entries: PluginChangelogEntry[] = [];
  let current: PluginChangelogEntry | null = null;
  let note: string | null = null;

  const flush = () => {
    if (current && note) current.notes.push(note.trim());
    note = null;
  };

  for (const raw of markdown.split(/\r?\n/)) {
    const heading = raw.match(/^##\s+\[?v?(\d+(?:\.\d+){1,2}[^\]\s]*)\]?(?:\s*[—–-]\s*(.+))?\s*$/);
    if (heading) {
      flush();
      current = { version: heading[1]!, notes: [] };
      const date = heading[2]?.trim();
      if (date) current.date = date;
      entries.push(current);
      continue;
    }
    if (!current) continue;
    const bullet = raw.match(/^\s{0,1}[-*]\s+(.*)$/);
    if (bullet) {
      flush();
      note = bullet[1]!;
    } else if (note !== null && /^\s{2,}\S/.test(raw)) {
      note += ` ${raw.trim()}`;
    } else if (raw.trim() === '' || raw.startsWith('#')) {
      flush();
    }
  }
  flush();
  return entries;
}
