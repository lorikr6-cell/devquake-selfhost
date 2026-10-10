import { cache } from 'react';
import type { PluginContext } from '@devquake/plugin-sdk';
import { cn, type Locale } from '@devquake/ui';
import { translator } from '../i18n';
import { S } from './shop-style';

// The DevQuake promotion in the shop (ADR 0059): on store.devquake.com, visitors who are not
// DevQuake members see what the platform offers and how to join. Off unless the owner turns on
// "promoteDevQuake" in /admin-cp; members never see it.

const state = cache(() => ({ hostUrl: null as string | null }));

/** Decides once per request whether the shop's pages show the promotion. */
export async function preparePromo(ctx: PluginContext): Promise<void> {
  const on =
    !ctx.user && ctx.settings
      ? await ctx.settings.enabled('promoteDevQuake').catch(() => false)
      : false;
  state().hostUrl = on ? ctx.hostUrl : null;
}

export function DevQuakePromo({ locale }: { locale: Locale }) {
  const hostUrl = state().hostUrl;
  if (!hostUrl) return null;
  const t = translator(locale, 'promo');
  return (
    <aside aria-labelledby="devquake-promo" className={cn('space-y-3 text-sm', S.panel)}>
      <h2 id="devquake-promo" className={cn('text-lg font-semibold', S.heading)}>
        {t('title')}
      </h2>
      <p className="max-w-3xl">{t('body')}</p>
      <ul className="list-disc space-y-1 ps-5">
        <li>{t('apps')}</li>
        <li>{t('ideas')}</li>
        <li>{t('selfHost')}</li>
      </ul>
      <div className="flex flex-wrap gap-2">
        <a href={`${hostUrl}/#account`} className={S.button}>
          {t('join')}
        </a>
        <a href={hostUrl} className={S.buttonSecondary}>
          {t('explore')}
        </a>
      </div>
    </aside>
  );
}
