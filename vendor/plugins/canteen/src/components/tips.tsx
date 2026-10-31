'use client';

import { PageTips as Tips, TipsToggle as Toggle, useT } from '@devquake/ui';

/**
 * How-to tips on each page (how to see details, add, change), floating in a corner (the shared
 * `PageTips` of @devquake/ui). On by default in a demo organisation, off elsewhere; the "Tips"
 * switch in the organisation's header turns them on or off on every page. The choice is kept
 * on this device only.
 */

const KEY = 'canteen-tips';

/** The switch in the organisation's header. */
export function TipsToggle({ demo }: { demo: boolean }) {
  return <Toggle defaultOn={demo} storageKey={KEY} withLabel />;
}

/** The page's tips, floating at the bottom of the screen while tips are on. */
export function PageTips({ page, demo }: { page: string; demo: boolean }) {
  const t = useT('tips');
  return (
    <Tips
      tip={{ see: t(`${page}.see`), create: t(`${page}.create`), edit: t(`${page}.edit`) }}
      defaultOn={demo}
      storageKey={KEY}
      footer={t('footer')}
    />
  );
}
