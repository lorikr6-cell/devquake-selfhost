import type { PluginPageProps } from '@devquake/plugin-sdk';
import { TabletManager } from '../components/tablet-manager';
import { localeOf, translator } from '../i18n';
import { listTablets } from '../lib/data';
import { ownVenue } from '../lib/page';

export async function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('nav.tablets') };
}

/** The venue's shared tablets: enable this device, disable any of them (ADR 0080). */
export default async function Tablets({ ctx }: PluginPageProps) {
  const t = translator(localeOf(ctx));
  const own = await ownVenue(ctx);
  if ('blocked' in own) return own.blocked;
  const tablets = await listTablets(own.db, own.venue.id);
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-bold">{t('nav.tablets')}</h1>
        <p className="text-ink/70 dark:text-paper/70">{t('tablets.intro')}</p>
      </header>
      <TabletManager
        timeZone={ctx.timeZone || 'UTC'}
        initial={tablets.map((tab) => ({
          id: tab.id,
          name: tab.name,
          lastUsedAt: tab.lastUsedAt ? new Date(tab.lastUsedAt).toISOString() : null,
          createdAt: new Date(tab.createdAt).toISOString(),
        }))}
      />
    </div>
  );
}
