import { describe, expect, it } from 'vitest';
import { matchRoute } from './router';

const patterns = ['/', '/about', '/posts/:id', '/posts/new', '/docs/*rest'];

describe('matchRoute', () => {
  it('matches the root', () => {
    expect(matchRoute(patterns, '/')).toEqual({ pattern: '/', params: {} });
  });
  it('prefers static segments over params', () => {
    expect(matchRoute(patterns, '/posts/new')?.pattern).toBe('/posts/new');
  });
  it('extracts params', () => {
    expect(matchRoute(patterns, '/posts/42')).toEqual({
      pattern: '/posts/:id',
      params: { id: '42' },
    });
  });
  it('supports splats', () => {
    expect(matchRoute(patterns, '/docs/a/b/c')).toEqual({
      pattern: '/docs/*rest',
      params: { rest: 'a/b/c' },
    });
  });
  it('returns null when nothing matches', () => {
    expect(matchRoute(patterns, '/nope/nope')).toBeNull();
  });
  it('ignores trailing slashes', () => {
    expect(matchRoute(patterns, '/about/')?.pattern).toBe('/about');
  });
});
