import { describe, expect, it } from 'vitest';
import { translator } from '../i18n';
import { describeEvent as describe_, timeAgo as ago } from './events';

const t = translator('en', 'events');
const describeEvent = (e: Parameters<typeof describe_>[0]) => describe_(e, t);
const timeAgo = (iso: string, now: Date) => ago(iso, t, now);

describe('describeEvent', () => {
  it('says who did what', () => {
    expect(describeEvent({ kind: 'item_done', userName: 'Ana', itemName: 'Milk' })).toBe(
      'Ana picked up Milk',
    );
    expect(describeEvent({ kind: 'item_dropped', userName: 'Bob', itemName: 'Chips' })).toBe(
      'Bob struck out Chips (not needed)',
    );
    expect(describeEvent({ kind: 'member_joined', userName: 'Cid', itemName: null })).toBe(
      'Cid joined the list',
    );
    expect(describeEvent({ kind: 'item_added', userName: null, itemName: 'Eggs' })).toBe(
      'Someone added Eggs',
    );
    expect(describeEvent({ kind: 'something_new', userName: 'Ana', itemName: null })).toBe(
      'Ana changed the list',
    );
  });
});

describe('timeAgo', () => {
  const now = new Date('2026-09-24T12:00:00Z');
  it('rounds to friendly units', () => {
    expect(timeAgo('2026-09-24T11:59:30Z', now)).toBe('just now');
    expect(timeAgo('2026-09-24T11:55:00Z', now)).toBe('5 min ago');
    expect(timeAgo('2026-09-24T09:00:00Z', now)).toBe('3 h ago');
    expect(timeAgo('2026-09-22T12:00:00Z', now)).toBe('2 d ago');
    expect(timeAgo('2026-09-24T12:00:05Z', now)).toBe('just now'); // clock skew
  });
});

describe('other languages', () => {
  it('describes events and times in the page language', () => {
    const de = translator('de', 'events');
    expect(describe_({ kind: 'item_done', userName: 'Ana', itemName: 'Milch' }, de)).toContain(
      'Ana',
    );
    expect(describe_({ kind: 'item_done', userName: 'Ana', itemName: 'Milch' }, de)).toContain(
      'Milch',
    );
    const hu = translator('hu', 'events');
    expect(ago('2026-09-24T11:55:00Z', hu, new Date('2026-09-24T12:00:00Z'))).toContain('5');
  });
});
