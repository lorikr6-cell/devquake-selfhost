import { describe, expect, it } from 'vitest';
import { appOrigin, cookieDomain, homeOrigin, instanceDomain, placeOf } from './hosts';

const apps = ['expenses', 'utilities', 'cookbook', 'meals', 'shopping'];

describe('hosts', () => {
  it('takes the domain from DOMAIN, else an sslip.io name from PUBLIC_IP', () => {
    expect(instanceDomain({ DOMAIN: 'https://Home.Example.com/' })).toBe('home.example.com');
    expect(instanceDomain({ PUBLIC_IP: '203.0.113.5' })).toBe('203-0-113-5.sslip.io');
    expect(instanceDomain({ DOMAIN: 'lvh.me:3000' })).toBe('lvh.me:3000');
    expect(instanceDomain({ PUBLIC_IP: 'not-an-ip' })).toBeNull();
    expect(instanceDomain({})).toBeNull();
  });

  it('serves one app everywhere', () => {
    expect(placeOf('1.2.3.4', ['pulse'], false, null)).toEqual({ kind: 'app', id: 'pulse' });
    expect(placeOf('pulse.example.com', ['pulse'], false, 'example.com')).toEqual({
      kind: 'app',
      id: 'pulse',
    });
  });

  it('serves several apps by their first label, the home on the domain', () => {
    const d = 'example.com';
    expect(placeOf('example.com', apps, true, d)).toEqual({ kind: 'home' });
    expect(placeOf('Shopping.Example.com:443', apps, true, d)).toEqual({
      kind: 'app',
      id: 'shopping',
    });
    expect(placeOf('pulse.example.com', apps, true, d)).toEqual({ kind: 'unknown' });
    expect(placeOf('a.b.example.com', apps, true, d)).toEqual({ kind: 'unknown' });
    expect(placeOf('evilexample.com', apps, true, d)).toEqual({ kind: 'home' });
    expect(placeOf('203.0.113.5', apps, true, null)).toEqual({ kind: 'home' });
    expect(placeOf('meals.lvh.me:3000', apps, true, 'lvh.me:3000')).toEqual({
      kind: 'app',
      id: 'meals',
    });
  });

  it('builds addresses and the shared cookie domain', () => {
    expect(appOrigin('meals', 'https://example.com', true, 'example.com')).toBe(
      'https://meals.example.com',
    );
    expect(appOrigin('pulse', 'https://p.example.com', false, 'p.example.com')).toBe(
      'https://p.example.com',
    );
    expect(homeOrigin('http://meals.lvh.me:3000', true, 'lvh.me:3000')).toBe('http://lvh.me:3000');
    expect(cookieDomain(true, 'lvh.me:3000')).toBe('lvh.me');
    expect(cookieDomain(true, 'localhost:3000')).toBeUndefined();
    expect(cookieDomain(false, 'example.com')).toBeUndefined();
  });
});
