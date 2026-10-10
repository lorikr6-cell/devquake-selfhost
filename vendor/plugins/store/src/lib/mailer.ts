import nodemailer, { type Transporter } from 'nodemailer';
import type { Store } from './data';

// The shop's own emails to buyers and subscribers (ADR 0058): sign-in links, newsletter
// confirmations, newsletters, answers to messages and order confirmations. The platform's
// mailer only writes to members, so these go through the instance's SMTP server (the same
// SMTP_* variables the self-host shell uses), from the shop's name, with replies to the
// seller's contact address. Without SMTP_HOST nothing is sent and the pages say so.
// On devquake.com (ADR 0059) the platform's names work too: SMTP_USER with SMTP_PWD and no
// SMTP_HOST means Hostinger's server, as for the platform's own mailer; MAIL_FROM is the sender.

const env = (name: string) => process.env[name]?.trim() || undefined;

/** The mail server: SMTP_HOST, else Hostinger's when the platform's mailbox is set. */
const smtpHost = () =>
  env('SMTP_HOST') ?? (env('SMTP_USER') && env('SMTP_PWD') ? 'smtp.hostinger.com' : undefined);
const smtpPassword = () => env('SMTP_PASSWORD') ?? env('SMTP_PWD');

const g = globalThis as unknown as { dqStoreMail?: Transporter | null };

function transport(): Transporter | null {
  if (g.dqStoreMail !== undefined) return g.dqStoreMail;
  const host = smtpHost();
  // The platform's mailbox defaults to 465 (TLS), the self-host shell's to 587.
  const port = Number(env('SMTP_PORT') ?? (env('SMTP_HOST') ? 587 : 465));
  const secure = env('SMTP_SECURE');
  g.dqStoreMail = host
    ? nodemailer.createTransport({
        host,
        port,
        secure: secure === undefined ? port === 465 : secure === 'true' || secure === '1',
        auth: env('SMTP_USER') ? { user: env('SMTP_USER')!, pass: smtpPassword() } : undefined,
      })
    : null;
  return g.dqStoreMail;
}

/** Whether the shop can send emails at all. */
export const shopMailConfigured = () => Boolean(smtpHost());

/** "Shop <no-reply@x>" or "no-reply@x" → the address alone. */
export function senderAddress(value: string | undefined): string {
  const angled = value?.match(/<([^>]+)>/)?.[1];
  return (angled ?? value ?? 'no-reply@localhost').trim();
}

export interface ShopMail {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** e.g. List-Unsubscribe for newsletters. */
  headers?: Record<string, string>;
}

/** Sends one email in the shop's name; false when it could not be sent. */
export async function sendShopMail(store: Store, mail: ShopMail): Promise<boolean> {
  const t = transport();
  if (!t) return false;
  try {
    await t.sendMail({
      from: {
        name: store.name,
        address: senderAddress(env('SMTP_FROM') ?? env('MAIL_FROM') ?? env('SMTP_USER')),
      },
      replyTo: store.seller.email ?? undefined,
      to: mail.to,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      headers: mail.headers,
    });
    return true;
  } catch (err) {
    console.warn(`[store] email for store ${store.id} failed: ${(err as Error).message}`);
    return false;
  }
}
