import { describe, expect, it } from 'vitest';
import { iconsFromHtml, isPrivateAddress, logoKey, namedAs, sniffImage } from './logo-finder';

describe('logo finder', () => {
  it('stores logos under a plain key', () => {
    expect(logoKey('Kaufland România')).toBe('kaufland-romania');
    expect(logoKey('  H&M ')).toBe('h-and-m');
    expect(logoKey('!!!')).toBe('');
  });

  it('never fetches from private networks', () => {
    for (const ip of [
      '127.0.0.1',
      '10.1.2.3',
      '172.20.0.1',
      '192.168.1.1',
      '169.254.169.254',
      '100.64.0.1',
      '0.0.0.0',
      '::1',
      'fd00::1',
      'fe80::1',
      '::ffff:127.0.0.1',
    ]) {
      expect(isPrivateAddress(ip), ip).toBe(true);
    }
    for (const ip of ['8.8.8.8', '151.101.1.69', '2606:4700::6810:84e5']) {
      expect(isPrivateAddress(ip), ip).toBe(false);
    }
  });

  it('trusts the image bytes, not the header, and refuses SVG', () => {
    expect(sniffImage(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 0]))).toBe('image/png');
    expect(sniffImage(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe('image/jpeg');
    expect(
      sniffImage(new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg">')),
    ).toBeNull();
    expect(sniffImage(new TextEncoder().encode('RIFF....WEBPVP8 '))).toBe('image/webp');
  });

  it('prefers the largest touch icon of a page, without SVG', () => {
    const html = `<link rel="icon" href="/favicon-32.png" sizes="32x32">
      <link rel="apple-touch-icon" href="/apple-180.png" sizes="180x180">
      <link rel="icon" type="image/svg+xml" href="/logo.svg">
      <link rel="stylesheet" href="/x.css">`;
    expect(iconsFromHtml(html, 'https://shop.example/')).toEqual([
      'https://shop.example/apple-180.png',
      'https://shop.example/favicon-32.png',
    ]);
  });

  it('matches a Wikidata item only by its very name or an alias', () => {
    const e = {
      labels: { en: { value: 'Lidl' } },
      aliases: { de: [{ value: 'Lidl Dienstleistung' }] },
    };
    expect(namedAs(e, 'lidl')).toBe(true);
    expect(namedAs(e, 'Lidl Dienstleistung')).toBe(true);
    expect(namedAs(e, 'Lidl Cluj')).toBe(false);
  });
});
