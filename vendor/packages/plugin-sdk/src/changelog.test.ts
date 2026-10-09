import { describe, expect, it } from 'vitest';
import { parseChangelog } from './changelog';

describe('parseChangelog', () => {
  it('reads versions, dates and wrapped bullet points, newest first', () => {
    const md = [
      '# Changelog: Shared shopping lists',
      '',
      '## 0.3.0 — 2026-09-24',
      '',
      '- Product photos (migration `0003`): add one when creating a product,',
      '  shrunk in the browser.',
      '- **Usual products**: one tap.',
      '',
      '## [0.2.0] - 2026-09-20',
      '* Calendar',
      '',
      '## 0.1.0',
      '',
      'Intro paragraph that is not a note.',
      '- Initial release.',
    ].join('\n');
    expect(parseChangelog(md)).toEqual([
      {
        version: '0.3.0',
        date: '2026-09-24',
        notes: [
          'Product photos (migration `0003`): add one when creating a product, shrunk in the browser.',
          '**Usual products**: one tap.',
        ],
      },
      { version: '0.2.0', date: '2026-09-20', notes: ['Calendar'] },
      { version: '0.1.0', notes: ['Initial release.'] },
    ]);
  });

  it('returns nothing for text without version headings', () => {
    expect(parseChangelog('# Changelog\n\n- loose note')).toEqual([]);
    expect(parseChangelog('')).toEqual([]);
  });
});
