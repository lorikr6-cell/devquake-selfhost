import type { PluginEmail, PluginLocale } from '@devquake/plugin-sdk';
import { LOCALE_TAGS, localizePath } from '@devquake/ui';
import { translator } from '../i18n';
import type { Order, Store } from './data';
import { orderReference } from './model';
import { formatCents } from './pricing';

/** The owner's email about a new order, in their language (platform.ts → scheduled). */
export function orderEmail(
  store: Store,
  order: Order,
  baseUrl: string,
  locale: PluginLocale,
): PluginEmail {
  const t = translator(locale, 'email');
  const tMethods = translator(locale, 'methods');
  const money = (cents: number) => formatCents(cents, order.currency, LOCALE_TAGS[locale]);
  const ref = orderReference(order.id);
  const total = money(order.totalCents);
  const country = new Intl.DisplayNames([LOCALE_TAGS[locale]], { type: 'region' });
  const how =
    order.method === 'cod'
      ? t('cod', { total })
      : order.method === 'bank'
        ? t('bank')
        : t('paid', { method: tMethods(order.method) });
  return {
    subject: t('subject', { ref, store: store.name, total }),
    preheader: `${order.buyer.name} · ${total}`,
    heading: t('heading', { store: store.name }),
    paragraphs: [how],
    rows: [
      [t('buyer'), order.buyer.name],
      [
        t('items'),
        order.items
          .map((i) => `${i.quantity} × ${i.name}${i.optionName ? ` (${i.optionName})` : ''}`)
          .join(', ')
          .slice(0, 300),
      ],
      [t('total'), total],
      [t('country'), country.of(order.buyer.country) ?? order.buyer.country],
    ],
    button: { label: t('button'), url: `${baseUrl}${localizePath(`/orders/${order.id}`, locale)}` },
    footer: t('footer'),
  };
}

/** The owner's email about a buyer's new message (platform.ts → scheduled). */
export function messageEmail(
  store: Store,
  thread: { id: number; subject: string },
  baseUrl: string,
  locale: PluginLocale,
): PluginEmail {
  const t = translator(locale, 'email.message');
  return {
    subject: t('subject', { store: store.name, subject: thread.subject }),
    preheader: thread.subject,
    heading: t('heading', { store: store.name }),
    paragraphs: [t('body', { subject: thread.subject })],
    button: {
      label: t('button'),
      url: `${baseUrl}${localizePath(`/messages/${thread.id}`, locale)}`,
    },
    footer: t('footer'),
  };
}
