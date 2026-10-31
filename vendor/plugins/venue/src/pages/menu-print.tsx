import type { PluginPageProps } from '@devquake/plugin-sdk';
import { MenuSheet } from '../components/menu-sheet';
import { PrintButton } from '../components/print-button';
import { localeOf, translator } from '../i18n';
import { designOf, formatPage, formatSize } from '../lib/design';
import { ownVenue } from '../lib/page';
import { publicMenu } from './public-menu';

export async function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('design.printTitle') };
}

/**
 * The menu to print on A4, in the owner's design. The background repeats on every printed page
 * (a fixed element) and the texts flow across pages.
 */
export default async function MenuPrint({ ctx }: PluginPageProps) {
  const t = translator(localeOf(ctx));
  const own = await ownVenue(ctx);
  if ('blocked' in own) return own.blocked;
  const [design, menu] = await Promise.all([
    designOf(own.db, own.venue.id),
    publicMenu(own.db, own.venue),
  ]);
  const bg =
    design.background !== null ? `/api/menu/design/background?v=${design.background}` : null;
  const size = formatSize(design.format);
  return (
    <div>
      <style>{`@page { size: ${formatPage(design.format)}; margin: 0; }
@media print {
  header, footer, nav, .dq-tips, .no-print { display: none !important; }
  main { max-width: none !important; padding: 0 !important; }
  .menu-print { box-shadow: none !important; padding: 18mm 16mm !important;
    -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .menu-print-bg { position: fixed !important; inset: 0; z-index: -1; }
}`}</style>
      <p className="no-print mb-4 flex flex-wrap gap-3 text-sm">
        <PrintButton label={t('design.printNow')} />
        <a href="/menu/design" className="underline">
          {t('design.edit')}
        </a>
      </p>
      {bg ? (
        <div
          aria-hidden="true"
          className="menu-print-bg hidden print:block"
          style={{ backgroundImage: `url(${bg})`, backgroundSize: 'cover' }}
        />
      ) : null}
      <MenuSheet
        menu={menu}
        design={design}
        backgroundUrl={bg}
        allergenName={(a) => t(`menu.allergens.${a}`)}
        soldOut={t('menu.soldOut')}
        className="menu-print mx-auto w-full max-w-[210mm] p-10 shadow-lg"
        style={{ aspectRatio: `${size.width} / ${size.height}`, overflow: 'hidden' }}
      />
    </div>
  );
}
