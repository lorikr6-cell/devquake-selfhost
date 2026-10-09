import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// The app asks and informs with its own dialogs and notifications (feedback.tsx), never the
// browser's alert(), confirm() or prompt(), which cannot be styled or translated consistently.
const files = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    const path = join(dir, f);
    if (statSync(path).isDirectory()) return files(path);
    return /\.tsx?$/.test(f) && !f.endsWith('.test.ts') ? [path] : [];
  });

describe('dialogs', () => {
  it('never uses the browser’s alert, confirm or prompt', () => {
    const src = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
    const offenders = files(src).filter((f) =>
      /(?<![\w.])(?:window\.)?(?:alert|confirm|prompt)\(/.test(
        readFileSync(f, 'utf8')
          // Comments may mention them; the app's own confirm() (useFeedback) is fine.
          .replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '')
          .replace(/await confirm\(|const confirm|confirm\s*=|confirm: \(/g, ''),
      ),
    );
    expect(offenders).toEqual([]);
  });
});
