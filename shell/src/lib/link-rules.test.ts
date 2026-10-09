import { describe, expect, it } from 'vitest';
import {
  fillTarget,
  jsonCopy,
  linkedBothWays,
  pointDeclared,
  returnUrlWithin,
  targetDeclared,
  type AppLinks,
} from './link-rules';

const t = { en: 'x' };
const expenses: AppLinks = {
  id: 'expenses',
  links: {
    offers: [{ id: 'expense.add', kind: 'write', title: t }],
    targets: [{ id: 'expense', path: '/groups/:id/expenses/:expenseId', title: t }],
    uses: [{ app: 'shopping', targets: ['list'], benefit: t }],
  },
};
const shopping: AppLinks = {
  id: 'shopping',
  links: {
    offers: [{ id: 'list.add-items', kind: 'write', title: t, apps: ['meals'] }],
    targets: [{ id: 'list', path: '/lists/:id', title: t }],
    uses: [{ app: 'expenses', points: ['expense.add'], targets: ['expense'], benefit: t }],
  },
};
const cookbook: AppLinks = {
  id: 'cookbook',
  links: { uses: [{ app: 'shopping', points: ['list.add-items'], benefit: t }] },
};

describe('link rules', () => {
  it('lets a call through only when both sides declare it', () => {
    expect(pointDeclared(shopping, expenses, 'expense.add')).toBe(true);
    expect(pointDeclared(expenses, shopping, 'list.add-items')).toBe(false);
    // Offered to meals only.
    expect(pointDeclared(cookbook, shopping, 'list.add-items')).toBe(false);
  });

  it('opens declared targets with their parameters', () => {
    expect(targetDeclared(shopping, expenses, 'expense')).toBe(true);
    expect(targetDeclared(cookbook, shopping, 'list')).toBe(false);
    expect(fillTarget('/groups/:id/expenses/:expenseId', { id: '1', expenseId: '9' })).toBe(
      '/groups/1/expenses/9',
    );
    expect(fillTarget('/lists/:id', {})).toBeNull();
    expect(linkedBothWays(expenses, shopping)).toBe(true);
  });

  it('copies data as JSON within the size limit', () => {
    expect(jsonCopy({ a: 1, d: new Date(0) })).toEqual({
      value: { a: 1, d: '1970-01-01T00:00:00.000Z' },
    });
    expect(jsonCopy('x'.repeat(70_000))).toBeNull();
    const loop: Record<string, unknown> = {};
    loop.self = loop;
    expect(jsonCopy(loop)).toBeNull();
  });

  it('keeps the way back inside the app it came from', () => {
    const origin = 'https://shopping.example.com';
    expect(returnUrlWithin(origin, '/lists/4')).toBe('https://shopping.example.com/lists/4');
    expect(returnUrlWithin(origin, 'https://shopping.example.com/x')).toBe(
      'https://shopping.example.com/x',
    );
    expect(returnUrlWithin(origin, 'https://evil.example/')).toBeNull();
    expect(returnUrlWithin(origin, '//evil.example/')).toBeNull();
  });
});
