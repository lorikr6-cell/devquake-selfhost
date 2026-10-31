import { describe, expect, it } from 'vitest';
import { DEFAULT_DESIGN, FORMATS, checkDesign, formatPage, formatSize, sniffImage } from './design';

describe('the menu design', () => {
  it('keeps the owner’s choices within what the page can show', () => {
    expect(
      checkDesign({
        ...DEFAULT_DESIGN,
        title: '  Autumn  menu ',
        textColor: '#AABBCC',
        columns: 3,
      }),
    ).toEqual({
      ok: true,
      value: {
        title: 'Autumn menu',
        subtitle: '',
        format: 'a4',
        font: 'serif',
        textColor: '#aabbcc',
        accentColor: '#b4532a',
        panel: 'light',
        columns: 1,
        showAllergens: true,
        onPublic: true,
      },
    });
    expect(checkDesign({ ...DEFAULT_DESIGN, font: 'comic' })).toMatchObject({ ok: false });
    expect(checkDesign({ ...DEFAULT_DESIGN, panel: 'neon' })).toMatchObject({ ok: false });
    expect(checkDesign({ ...DEFAULT_DESIGN, accentColor: 'red' })).toMatchObject({ ok: false });
  });

  it('offers A4 and nine ratios, each with its page and picture size', () => {
    expect(FORMATS.map((f) => f.id)).toEqual([
      'a4',
      '1:1',
      '4:3',
      '3:4',
      '16:9',
      '9:16',
      '3:2',
      '2:3',
      '5:4',
      '4:5',
    ]);
    expect(formatSize('a4')).toEqual({ width: 1240, height: 1754 });
    expect(formatSize('16:9')).toEqual({ width: 1754, height: 987 });
    expect(formatSize('9:16')).toEqual({ width: 987, height: 1754 });
    expect(formatSize('1:1')).toEqual({ width: 1754, height: 1754 });
    expect(formatPage('a4')).toBe('A4');
    expect(formatPage('4:5')).toBe('238mm 297mm');
    expect(checkDesign({ ...DEFAULT_DESIGN, format: '7:3' })).toMatchObject({
      ok: true,
      value: { format: 'a4' },
    });
    expect(checkDesign({ ...DEFAULT_DESIGN, format: '3:2' })).toMatchObject({
      ok: true,
      value: { format: '3:2' },
    });
  });

  it('takes only JPEG, PNG and WebP backgrounds, by their content', () => {
    const pad = new Array(12).fill(0);
    expect(sniffImage(new Uint8Array([0xff, 0xd8, 0xff, ...pad]))).toBe('image/jpeg');
    expect(sniffImage(new TextEncoder().encode('RIFF\0\0\0\0WEBPVP8 '))).toBe('image/webp');
    expect(sniffImage(new TextEncoder().encode('<svg onload=x>    '))).toBeNull();
  });
});
