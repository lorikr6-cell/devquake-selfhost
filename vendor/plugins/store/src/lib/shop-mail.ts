import type { PluginDatabase } from '@devquake/plugin-sdk';
import { BRAND_COLORS, LOCALE_TAGS, localizePath, type Locale } from '@devquake/ui';
import { translator } from '../i18n';
import { listProducts, type Order, type Store } from './data';
import { newsletterEmail, simpleEmail, type EmailProduct, type MailShop } from './emails';
import { sendShopMail } from './mailer';
import { voucherById } from './marketing-data';
import { orderReference } from './model';
import {
  finishNewsletters,
  markDelivery,
  newsletterById,
  nextRecipients,
  type Newsletter,
} from './newsletter-data';
import { formatCents } from './pricing';
import { LINK_MINUTES } from './buyers-data';

// Composes the shop's emails in the recipient's language and sends them (ADR 0058).

type Db = Omit<PluginDatabase, 'transaction'>;

export function mailShop(store: Store, baseUrl: string, locale: Locale): MailShop {
  const s = store.seller;
  return {
    name: store.name,
    url: `${baseUrl}${localizePath(`/s/${store.slug}`, locale)}`,
    logoUrl: store.logoVersion
      ? `${baseUrl}/api/s/${store.slug}/assets/logo?v=${store.logoVersion}`
      : null,
    accent: store.theme?.accent ?? BRAND_COLORS.quake,
    sellerLine: [s.companyName, s.address].filter(Boolean).join(' · ') || null,
  };
}

const link = (baseUrl: string, path: string, locale: Locale) =>
  `${baseUrl}${localizePath(path, locale)}`;

export async function sendSignInLink(
  store: Store,
  baseUrl: string,
  to: string,
  token: string,
  locale: Locale,
): Promise<boolean> {
  const t = translator(locale, 'mail.signIn');
  return sendShopMail(
    store,
    simpleEmail(mailShop(store, baseUrl, locale), locale, {
      to,
      subject: t('subject', { store: store.name }),
      heading: t('heading', { store: store.name }),
      lines: [t('body', { minutes: LINK_MINUTES })],
      button: {
        label: t('button'),
        url: `${baseUrl}/api/s/${store.slug}/account/signin?token=${token}&lang=${locale}`,
      },
      note: t('ignore'),
    }),
  );
}

export async function sendSubscribeConfirmation(
  store: Store,
  baseUrl: string,
  to: string,
  token: string,
  locale: Locale,
): Promise<boolean> {
  const t = translator(locale, 'mail.confirm');
  return sendShopMail(
    store,
    simpleEmail(mailShop(store, baseUrl, locale), locale, {
      to,
      subject: t('subject', { store: store.name }),
      heading: t('heading', { store: store.name }),
      lines: [t('body', { store: store.name })],
      button: {
        label: t('button'),
        url: link(baseUrl, `/s/${store.slug}/newsletter?confirm=${token}`, locale),
      },
      note: t('ignore'),
    }),
  );
}

export async function sendReplyNotice(
  store: Store,
  baseUrl: string,
  to: string,
  subject: string,
  threadId: number,
  locale: Locale,
): Promise<boolean> {
  const t = translator(locale, 'mail.reply');
  return sendShopMail(
    store,
    simpleEmail(mailShop(store, baseUrl, locale), locale, {
      to,
      subject: t('subject', { store: store.name, subject }),
      heading: t('heading', { store: store.name }),
      lines: [t('body')],
      button: {
        label: t('button'),
        url: link(baseUrl, `/s/${store.slug}/account/messages/${threadId}`, locale),
      },
    }),
  );
}

/** The buyer's confirmation with their order page's link (their way back to it). */
export async function sendOrderConfirmation(
  store: Store,
  baseUrl: string,
  order: Order,
  locale: Locale,
): Promise<boolean> {
  const t = translator(locale, 'mail.order');
  const money = (c: number) => formatCents(c, order.currency, LOCALE_TAGS[locale]);
  const ref = orderReference(order.id);
  return sendShopMail(
    store,
    simpleEmail(mailShop(store, baseUrl, locale), locale, {
      to: order.buyer.email,
      subject: t('subject', { ref, store: store.name }),
      heading: t('heading', { name: order.buyer.name.split(' ')[0] ?? '' }),
      lines: [
        t('body', { ref }),
        ...order.items.map(
          (i) => `${i.quantity} × ${i.name}${i.optionName ? ` (${i.optionName})` : ''}`,
        ),
        t('total', { amount: money(order.totalCents) }),
      ],
      button: {
        label: t('button'),
        url: link(baseUrl, `/s/${store.slug}/orders/${order.code}`, locale),
      },
      note: t('note'),
    }),
  );
}

/** A newsletter's products as cards, with their prices now in `locale`. */
export async function newsletterProducts(
  db: Db,
  store: Store,
  newsletter: Pick<Newsletter, 'products'>,
  baseUrl: string,
  locale: Locale,
): Promise<{ promo: EmailProduct[]; fresh: EmailProduct[] }> {
  const ids = newsletter.products.map((p) => p.productId);
  const list = await listProducts(db, store.id, { publishedOnly: true, ids });
  const money = (c: number) => formatCents(c, store.currency, LOCALE_TAGS[locale]);
  const tShop = translator(locale, 'shop');
  const card = (id: number): EmailProduct[] => {
    const p = list.find((x) => x.id === id);
    if (!p) return [];
    return [
      {
        name: p.name,
        url: `${link(baseUrl, `/s/${store.slug}/p/${p.slug}`, locale)}?utm_source=newsletter&utm_medium=email`,
        imageUrl: p.photoId
          ? `${baseUrl}/api/s/${store.slug}/photos/${p.photoId}?size=thumb`
          : null,
        price: p.priceVaries ? tShop('from', { price: money(p.fromCents) }) : money(p.fromCents),
        was: p.onSale ? money(p.regularCents) : null,
        badge: p.campaign
          ? `−${p.campaign.percentOff}%`
          : p.onSale
            ? `−${Math.round(100 - (p.fromCents / Math.max(1, p.regularCents)) * 100)}%`
            : null,
      },
    ];
  };
  const of = (section: 'promo' | 'new') =>
    newsletter.products.filter((p) => p.section === section).flatMap((p) => card(p.productId));
  return { promo: of('promo'), fresh: of('new') };
}

/** The newsletter as one subscriber gets it (also the owner's preview and test email). */
export async function composeNewsletter(
  db: Db,
  store: Store,
  newsletter: Newsletter,
  baseUrl: string,
  locale: Locale,
  to: string,
  unsubscribeToken: string | null,
) {
  const products = await newsletterProducts(db, store, newsletter, baseUrl, locale);
  const voucher = newsletter.voucherId
    ? await voucherById(db, store.id, newsletter.voucherId)
    : null;
  const unsubscribe = unsubscribeToken
    ? {
        page: link(baseUrl, `/s/${store.slug}/newsletter?unsubscribe=${unsubscribeToken}`, locale),
        oneClick: `${baseUrl}/api/s/${store.slug}/newsletter/unsubscribe?token=${unsubscribeToken}`,
      }
    : { page: link(baseUrl, `/s/${store.slug}/newsletter`, locale), oneClick: null };
  return newsletterEmail(
    mailShop(store, baseUrl, locale),
    locale,
    translator(locale, 'mail.newsletter'),
    {
      subject: newsletter.subject,
      preheader: newsletter.preheader,
      heading: newsletter.heading,
      intro: newsletter.intro,
      promo: products.promo,
      fresh: products.fresh,
      voucher: voucher?.active ? { code: voucher.code, description: voucher.description } : null,
    },
    to,
    unsubscribe,
  );
}

/**
 * Sends the next batch of a newsletter being sent; answers how many went out (0: done). One
 * email at a time, so a slow SMTP server never holds many connections.
 */
export async function sendNewsletterBatch(
  db: Db,
  store: Store,
  newsletterId: number,
  baseUrl: string,
  size?: number,
): Promise<number> {
  const newsletter = await newsletterById(db, store.id, newsletterId);
  if (!newsletter || newsletter.status !== 'sending') return 0;
  const recipients = await nextRecipients(db, newsletterId, size);
  for (const r of recipients) {
    const mail = await composeNewsletter(
      db,
      store,
      newsletter,
      baseUrl,
      r.locale,
      r.email,
      r.token,
    );
    const ok = await sendShopMail(store, mail);
    await markDelivery(db, newsletterId, r.id, ok);
  }
  await finishNewsletters(db);
  return recipients.length;
}
