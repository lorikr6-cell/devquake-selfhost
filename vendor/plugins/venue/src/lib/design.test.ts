import { describe, expect, it } from 'vitest';
import { DEFAULT_DESIGN, checkDesign, sniffImage } from './design';

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

  it('takes only JPEG, PNG and WebP backgrounds, by their content', () => {
    const pad = new Array(12).fill(0);
    expect(sniffImage(new Uint8Array([0xff, 0xd8, 0xff, ...pad]))).toBe('image/jpeg');
    expect(sniffImage(new TextEncoder().encode('RIFF\0\0\0\0WEBPVP8 '))).toBe('image/webp');
    expect(sniffImage(new TextEncoder().encode('<svg onload=x>    '))).toBeNull();
  });
});
