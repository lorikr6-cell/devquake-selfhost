import type { PluginEmail, PluginLocale } from '@devquake/plugin-sdk';
import { localizePath } from '@devquake/ui';
import { translator } from '../i18n';

/**
 * A comment on the member's public recipe: who wrote what on which recipe, kept in their
 * messages on devquake.com and shown as a notification (ADR 0037; no email). The host shows when
 * it arrived in the member's own time zone.
 */
export function commentEmail(
  c: { recipeId: number; title: string; name: string; body: string },
  locale: PluginLocale,
  baseUrl: string,
): PluginEmail {
  const t = translator(locale, 'commentEmail');
  return {
    subject: t('subject', { name: c.name, title: c.title }),
    preheader: c.body.slice(0, 140),
    heading: t('heading', { title: c.title }),
    paragraphs: [t('intro', { name: c.name, title: c.title }), c.body],
    rows: [
      [t('recipe'), c.title],
      [t('from'), c.name],
    ],
    button: {
      label: t('button'),
      url: `${baseUrl}${localizePath(`/r/${c.recipeId}`, locale)}#comments`,
    },
    footer: t('footer'),
  };
}

/** The NPS point for a recipe's next hundred recommendations (ADR 0037). */
export function pointEmail(
  r: { recipeId: number; title: string; recommendations: number },
  locale: PluginLocale,
  baseUrl: string,
): PluginEmail {
  const t = translator(locale, 'pointEmail');
  return {
    subject: t('subject', { title: r.title }),
    preheader: t('preheader', { count: r.recommendations }),
    heading: t('heading'),
    paragraphs: [t('intro', { title: r.title, count: r.recommendations })],
    button: { label: t('button'), url: `${baseUrl}${localizePath(`/r/${r.recipeId}`, locale)}` },
    footer: t('footer'),
  };
}
