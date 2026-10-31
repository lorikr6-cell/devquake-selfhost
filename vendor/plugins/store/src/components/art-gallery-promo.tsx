import { cache } from 'react';
import type { PluginContext } from '@devquake/plugin-sdk';
import { ArtGalleryLogo, cn, localizePath, type Locale } from '@devquake/ui';
import { translator } from '../i18n';
import { S } from './shop-style';

// The DevQuake art gallery in the shop (owner's request): what it is, and that some of its most
// appreciated works may become designs for DevQuake products, always with the artist's
// consent and under terms agreed with them. Shown to everyone, above "Made by DevQuake", only
// while the owner has turned on "promoteArtGallery" in /admin-cp (once the gallery is open:
// the shop cannot see the gallery's doors itself).

const state = cache(() => ({ hostUrl: null as string | null }));

/** Decides once per request whether the shop's pages show the art gallery section. */
export async function prepareArtPromo(ctx: PluginContext): Promise<void> {
  const on = ctx.settings
    ? await ctx.settings.enabled('promoteArtGallery').catch(() => false)
    : false;
  state().hostUrl = on ? ctx.hostUrl : null;
}

export function ArtGalleryPromo({ locale }: { locale: Locale }) {
  const hostUrl = state().hostUrl;
  if (!hostUrl) return null;
  const t = translator(locale, 'artPromo');
  const gallery = `${hostUrl}${localizePath('/art-gallery', locale)}`;
  return (
    <aside aria-labelledby="art-gallery-promo" className={cn('space-y-3 text-sm', S.panel)}>
      <p>
        <a href={gallery} aria-label={t('visit')}>
          <ArtGalleryLogo size={28} text={t('logoText')} art={t('logoArt')} />
        </a>
      </p>
      <h2 id="art-gallery-promo" className={cn('text-lg font-semibold', S.heading)}>
        {t('title')}
      </h2>
      <p className="max-w-3xl">{t('body')}</p>
      <ul className="list-disc space-y-1 ps-5">
        <li>{t('consent')}</li>
        <li>{t('copyright')}</li>
        <li>{t('share')}</li>
        <li>{t('credit')}</li>
      </ul>
      <div className="flex flex-wrap gap-2">
        <a href={gallery} className={S.button}>
          {t('visit')}
        </a>
        <a
          href={`${hostUrl}${localizePath('/art-gallery/mine/upload', locale)}`}
          className={S.buttonSecondary}
        >
          {t('show')}
        </a>
      </div>
      <p className={cn('max-w-3xl text-xs', S.muted)}>{t('note')}</p>
    </aside>
  );
}
