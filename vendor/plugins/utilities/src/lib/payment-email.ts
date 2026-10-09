import type { PluginEmail, PluginLocale } from '@devquake/plugin-sdk';
import { LOCALE_TAGS, localizePath } from '@devquake/ui';
import { translator } from '../i18n';
import type { PaymentEmail } from './data';
import { formatters } from './format';

/**
 * The email to someone whose payment the manager confirmed: the whole bill, their consumption,
 * share, carry-over and what they paid, with a button to the bill (where the provider's PDF can
 * be opened). Plain text: the host escapes it and puts it into the DevQuake layout (ADR 0014).
 */
export function paymentEmail(e: PaymentEmail, locale: PluginLocale, baseUrl: string): PluginEmail {
  const t = translator(locale, 'paymentEmail');
  const tRoot = translator(locale);
  const f = formatters(LOCALE_TAGS[locale]);
  const money = (n: number) => f.money(n, e.currency);
  const month = f.month(e.period);
  const name = e.utilityName;

  const rows: [string, string][] = [
    [t('bill'), `${name} · ${tRoot(`categories.${e.category}`)} · ${month}`],
    [t('total'), money(e.total)],
  ];
  if (e.billConsumption !== null)
    rows.push([t('billConsumption'), f.amount(e.billConsumption, e.unit)]);
  if (e.unitPrice !== null)
    rows.push([t('unitPrice'), f.unitPrice(e.unitPrice, e.currency, e.unit)]);
  if (e.consumption !== null) rows.push([t('yourConsumption'), f.amount(e.consumption, e.unit)]);
  if (e.share !== null) rows.push([t('yourShare'), money(e.share)]);
  if (Math.abs(e.carry) >= 0.005) {
    rows.push([
      t('carry'),
      e.carry > 0
        ? t('credit', { amount: money(e.carry) })
        : t('debt', { amount: money(-e.carry) }),
    ]);
  }
  if (e.due !== null) rows.push([t('due'), money(Math.max(0, e.due))]);
  rows.push([t('paid'), `${money(e.paid)} (${tRoot(`payment.methods.${e.method}`)})`]);

  const paragraphs = [t('intro', { name, month })];
  if (e.difference !== null && e.difference > 0.005) {
    paragraphs.push(t('extra', { amount: money(e.difference) }));
  } else if (e.difference !== null && e.difference < -0.005) {
    paragraphs.push(t('missing', { amount: money(-e.difference) }));
  } else {
    paragraphs.push(t('settled'));
  }
  if (e.hasPdf) paragraphs.push(t('pdf'));

  return {
    subject: t('subject', { name, month }),
    preheader: t('preheader', { amount: money(e.paid) }),
    heading: t('heading'),
    paragraphs,
    rows,
    button: { label: t('button'), url: `${baseUrl}${localizePath(`/bills/${e.billId}`, locale)}` },
    footer: t('footer'),
  };
}
