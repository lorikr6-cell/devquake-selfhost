import { describe, expect, it } from 'vitest';
import { messageKeys } from '@devquake/ui';
import plugin from '../index';
import { appMessages } from './index';
import { TIPS_PAGES } from './tips';

// Every page in the tips map exists and has its three tips (PageTips, @devquake/ui).
describe('page tips', () => {
  const keys = new Set(messageKeys(appMessages('en')));

  it('are for pages the app has', () => {
    const pages = Object.keys(plugin.pages);
    for (const path of Object.keys(TIPS_PAGES)) expect(pages, path).toContain(path);
  });

  it('say how to see, add and change on every page', () => {
    for (const key of new Set(Object.values(TIPS_PAGES))) {
      for (const part of ['see', 'create', 'edit']) {
        expect(keys.has(`tips.${key}.${part}`), `tips.${key}.${part}`).toBe(true);
      }
    }
  });
});
