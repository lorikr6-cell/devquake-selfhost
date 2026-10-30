import type { PluginPageProps } from '@devquake/plugin-sdk';
import { MenuDesigner } from '../components/menu-designer';
import { localeOf, translator } from '../i18n';
import { designOf } from '../lib/design';
import { ownVenue } from '../lib/page';
import { publicMenu } from './public-menu';

export async function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('design.pageTitle') };
}

/** The printable menu's design: pictures flattened into one background, texts on top. */
export default async function MenuDesignPage({ ctx }: PluginPageProps) {
  const t = translator(localeOf(ctx));
  const own = await ownVenue(ctx);
  if ('blocked' in own) return own.blocked;
  const [design, menu] = await Promise.all([
    designOf(own.db, own.venue.id),
    publicMenu(own.db, own.venue),
  ]);
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-bold">{t('design.pageTitle')}</h1>
        <p className="text-ink/70 dark:text-paper/70">{t('design.intro')}</p>
      </header>
      <MenuDesigner
        initial={design}
        backgroundUrl={
          design.background !== null ? `/api/menu/design/background?v=${design.background}` : null
        }
        menu={menu}
      />
    </div>
  );
}
