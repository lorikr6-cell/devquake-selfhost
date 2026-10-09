import type { PluginEmail, PluginLocale } from '@devquake/plugin-sdk';
import { localizePath } from '@devquake/ui';
import { translator } from '../i18n';

/**
 * A comment on the member's public meal: who wrote what on which meal, kept in their messages on
 * devquake.com and shown as a notification (ADR 0037; no email).
 */
export function commentEmail(
  c: { setId: number; title: string; name: string; body: string },
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
      [t('meal'), c.title],
      [t('from'), c.name],
    ],
    button: {
      label: t('button'),
      url: `${baseUrl}${localizePath(`/meals/${c.setId}`, locale)}#comments`,
    },
    footer: t('footer'),
  };
}
