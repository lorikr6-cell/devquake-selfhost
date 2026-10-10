import type { Translate } from '@devquake/ui';
import type { ShopMail } from './mailer';

// The shop's emails as HTML and plain text (ADR 0058). Everything from the owner or a buyer is
// escaped; colours come from the shop's checked theme. Tables and inline styles, because email
// programs ignore most CSS; the product grid shows two columns and one on phones.

const ESC: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};
export const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ESC[c]!);

/** Text with empty lines as paragraphs and single line breaks kept. */
const paragraphs = (text: string, style: string) =>
  text
    .split(/\n\s*\n/)
    .map((p) => `<p style="${style}">${escapeHtml(p.trim()).replace(/\n/g, '<br>')}</p>`)
    .join('');

export interface MailShop {
  name: string;
  /** Absolute address of the shop's front page. */
  url: string;
  /** Absolute address of the logo, or null. */
  logoUrl: string | null;
  accent: string;
  /** Seller details for the footer (company, address). */
  sellerLine: string | null;
}

const ACCENT_TEXT = (accent: string) => {
  const n = parseInt(accent.slice(1), 16);
  const l = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return l > 0.6 ? '#111111' : '#ffffff';
};

export function button(shop: MailShop, label: string, href: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0"><tr><td style="background:${shop.accent};border-radius:8px">
<a href="${escapeHtml(href)}" style="display:inline-block;padding:12px 22px;color:${ACCENT_TEXT(shop.accent)};font-weight:600;text-decoration:none;font-size:15px">${escapeHtml(label)}</a>
</td></tr></table>`;
}

/** The frame of every email: the shop's logo or name, the content, and a footer. */
export function layout(
  shop: MailShop,
  options: { preheader: string; body: string; footer?: string; lang: string },
): string {
  const header = shop.logoUrl
    ? `<img src="${escapeHtml(shop.logoUrl)}" alt="${escapeHtml(shop.name)}" style="max-height:56px;max-width:220px;border:0">`
    : `<span style="font-size:22px;font-weight:700;color:${shop.accent}">${escapeHtml(shop.name)}</span>`;
  return `<!doctype html>
<html lang="${escapeHtml(options.lang)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(shop.name)}</title>
<style>
@media (max-width:620px){.wrap{width:100%!important}.col{display:block!important;width:100%!important;max-width:100%!important}.pad{padding:20px!important}}
</style></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1f2937">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(options.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" class="wrap" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden">
<tr><td class="pad" style="padding:24px 32px;border-bottom:3px solid ${shop.accent}"><a href="${escapeHtml(shop.url)}" style="text-decoration:none">${header}</a></td></tr>
<tr><td class="pad" style="padding:28px 32px">${options.body}</td></tr>
<tr><td class="pad" style="padding:20px 32px;background:#f9fafb;font-size:12px;line-height:18px;color:#6b7280">
${shop.sellerLine ? `${escapeHtml(shop.sellerLine)}<br>` : ''}<a href="${escapeHtml(shop.url)}" style="color:#6b7280">${escapeHtml(shop.url)}</a>${options.footer ? `<br>${options.footer}` : ''}
</td></tr></table></td></tr></table></body></html>`;
}

export interface EmailProduct {
  name: string;
  url: string;
  imageUrl: string | null;
  price: string;
  /** The regular price, struck through, when it is on sale. */
  was: string | null;
  /** e.g. "−20%". */
  badge: string | null;
}

/** Products as cards, two per row (one on phones). */
export function productGrid(shop: MailShop, products: EmailProduct[], viewLabel: string): string {
  const card = (
    p: EmailProduct,
  ) => `<td class="col" width="50%" valign="top" style="width:50%;padding:8px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
<tr><td style="position:relative">${
    p.imageUrl
      ? `<a href="${escapeHtml(p.url)}"><img src="${escapeHtml(p.imageUrl)}" alt="${escapeHtml(p.name)}" width="260" style="display:block;width:100%;height:auto;border:0"></a>`
      : `<a href="${escapeHtml(p.url)}" style="display:block;height:120px;background:#f3f4f6"></a>`
  }</td></tr>
<tr><td style="padding:12px 14px 14px">
${p.badge ? `<span style="display:inline-block;background:${shop.accent};color:${ACCENT_TEXT(shop.accent)};font-size:12px;font-weight:700;border-radius:999px;padding:2px 8px;margin-bottom:6px">${escapeHtml(p.badge)}</span><br>` : ''}
<a href="${escapeHtml(p.url)}" style="color:#111827;font-weight:600;font-size:15px;text-decoration:none">${escapeHtml(p.name)}</a>
<p style="margin:6px 0 10px;font-size:15px"><b style="color:${p.was ? shop.accent : '#111827'}">${escapeHtml(p.price)}</b>${
    p.was ? ` <s style="color:#9ca3af;font-size:13px">${escapeHtml(p.was)}</s>` : ''
  }</p>
<a href="${escapeHtml(p.url)}" style="color:${shop.accent};font-weight:600;font-size:14px;text-decoration:none">${escapeHtml(viewLabel)} →</a>
</td></tr></table></td>`;
  const rows: string[] = [];
  for (let i = 0; i < products.length; i += 2) {
    const pair = products.slice(i, i + 2);
    rows.push(
      `<tr>${pair.map(card).join('')}${pair.length === 1 ? '<td class="col" width="50%" style="width:50%"></td>' : ''}</tr>`,
    );
  }
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 -8px">${rows.join('')}</table>`;
}

const H1 = 'margin:0 0 12px;font-size:24px;line-height:30px;color:#111827';
const H2 = 'margin:28px 0 8px;font-size:18px;color:#111827';
const P = 'margin:0 0 12px;font-size:15px;line-height:23px';

/** A short email with one button (sign-in links, confirmations, answers). */
export function simpleEmail(
  shop: MailShop,
  lang: string,
  input: {
    to: string;
    subject: string;
    heading: string;
    lines: string[];
    button: { label: string; url: string };
    note?: string;
  },
): ShopMail {
  const body = `<h1 style="${H1}">${escapeHtml(input.heading)}</h1>
${input.lines.map((l) => `<p style="${P}">${escapeHtml(l)}</p>`).join('')}
${button(shop, input.button.label, input.button.url)}
${input.note ? `<p style="${P};font-size:13px;color:#6b7280">${escapeHtml(input.note)}</p>` : ''}`;
  return {
    to: input.to,
    subject: input.subject,
    html: layout(shop, { preheader: input.lines[0] ?? input.heading, body, lang }),
    text: [
      input.heading,
      '',
      ...input.lines,
      '',
      `${input.button.label}: ${input.button.url}`,
      ...(input.note ? ['', input.note] : []),
      '',
      shop.url,
    ].join('\n'),
  };
}

export interface NewsletterContent {
  subject: string;
  preheader: string | null;
  heading: string | null;
  intro: string | null;
  promo: EmailProduct[];
  fresh: EmailProduct[];
  voucher: { code: string; description: string | null } | null;
}

/**
 * A newsletter: its heading and text, the voucher, then the chosen products in two sections
 * (on offer, new). `unsubscribe.page` is the subscriber's own link in the footer; `oneClick`
 * (List-Unsubscribe) takes a POST and unsubscribes at once.
 */
export function newsletterEmail(
  shop: MailShop,
  lang: string,
  t: Translate,
  content: NewsletterContent,
  to: string,
  unsubscribe: { page: string; oneClick: string | null },
): ShopMail {
  const unsubscribeUrl = unsubscribe.page;
  const voucher = content.voucher
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0"><tr><td style="border:2px dashed ${shop.accent};border-radius:12px;padding:16px;text-align:center">
${content.voucher.description ? `<p style="${P}">${escapeHtml(content.voucher.description)}</p>` : ''}
<span style="font-size:13px;color:#6b7280">${escapeHtml(t('voucherLabel'))}</span><br>
<span style="font-family:ui-monospace,Menlo,Consolas,monospace;font-size:24px;font-weight:700;letter-spacing:2px;color:${shop.accent}">${escapeHtml(content.voucher.code)}</span>
</td></tr></table>`
    : '';
  const section = (title: string, list: EmailProduct[]) =>
    list.length
      ? `<h2 style="${H2}">${escapeHtml(title)}</h2>${productGrid(shop, list, t('view'))}`
      : '';
  const body = `${content.heading ? `<h1 style="${H1}">${escapeHtml(content.heading)}</h1>` : ''}
${content.intro ? paragraphs(content.intro, P) : ''}
${voucher}
${section(t('promo'), content.promo)}
${section(t('fresh'), content.fresh)}
${button(shop, t('visit'), shop.url)}`;
  const footer = `${escapeHtml(t('why', { store: shop.name }))} <a href="${escapeHtml(unsubscribeUrl)}" style="color:#6b7280">${escapeHtml(t('unsubscribe'))}</a>`;
  const lines = (title: string, list: EmailProduct[]) =>
    list.length
      ? [
          '',
          title,
          ...list.map((p) => `- ${p.name}: ${p.price}${p.was ? ` (${p.was})` : ''} ${p.url}`),
        ]
      : [];
  return {
    to,
    subject: content.subject,
    html: layout(shop, {
      preheader: content.preheader ?? content.heading ?? content.subject,
      body,
      footer,
      lang,
    }),
    text: [
      content.heading ?? content.subject,
      ...(content.intro ? ['', content.intro] : []),
      ...(content.voucher ? ['', `${t('voucherLabel')} ${content.voucher.code}`] : []),
      ...lines(t('promo'), content.promo),
      ...lines(t('fresh'), content.fresh),
      '',
      `${t('visit')}: ${shop.url}`,
      '',
      `${t('why', { store: shop.name })} ${t('unsubscribe')}: ${unsubscribeUrl}`,
    ].join('\n'),
    headers: unsubscribe.oneClick
      ? {
          'List-Unsubscribe': `<${unsubscribe.oneClick}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        }
      : undefined,
  };
}
