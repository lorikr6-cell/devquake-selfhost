import 'server-only';
import nodemailer, { type Transporter } from 'nodemailer';
import type { PluginEmail, PluginLocale, PluginMailer } from '@devquake/plugin-sdk';
import { APP } from '@/generated/app';
import { queryOne } from './db';
import { env, flag } from './env';

// Email through the owner's SMTP server (SMTP_* variables). Without SMTP_HOST nothing is sent
// and the apps carry on (their reminders simply stay in the app).

const g = globalThis as unknown as { dqMail?: Transporter | null };

function transport(): Transporter | null {
  if (g.dqMail !== undefined) return g.dqMail;
  const host = env('SMTP_HOST');
  g.dqMail = host
    ? nodemailer.createTransport({
        host,
        port: Number(env('SMTP_PORT') ?? 587),
        secure: flag('SMTP_SECURE', Number(env('SMTP_PORT') ?? 587) === 465),
        auth: env('SMTP_USER') ? { user: env('SMTP_USER'), pass: env('SMTP_PASSWORD') } : undefined,
      })
    : null;
  return g.dqMail;
}

export const mailConfigured = () => Boolean(env('SMTP_HOST'));

const escape = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );

/** The app's plain-text email in a simple, safe layout (everything escaped). */
export function renderEmail(mail: PluginEmail): { html: string; text: string } {
  const rows = (mail.rows ?? [])
    .map(
      ([k, v]) =>
        `<tr><td style="padding:4px 12px 4px 0;color:#555">${escape(k)}</td><td style="padding:4px 0"><b>${escape(v)}</b></td></tr>`,
    )
    .join('');
  const button = mail.button
    ? `<p><a href="${escape(mail.button.url)}" style="display:inline-block;background:#e4572e;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">${escape(mail.button.label)}</a></p>`
    : '';
  const html = `<!doctype html><html><body style="font-family:system-ui,sans-serif;background:#f4f1ea;padding:24px;color:#16181d">
<div style="display:none">${escape(mail.preheader ?? '')}</div>
<div style="max-width:560px;margin:auto;background:#fff;border-radius:12px;padding:24px">
<h1 style="font-size:20px;margin-top:0">${escape(mail.heading)}</h1>
${mail.paragraphs.map((p) => `<p>${escape(p)}</p>`).join('\n')}
${rows ? `<table>${rows}</table>` : ''}
${button}
${mail.footer ? `<p style="font-size:12px;color:#777">${escape(mail.footer)}</p>` : ''}
</div>
<p style="text-align:center;font-size:12px;color:#777">${escape(APP.name)} · self-hosted · powered by DevQuake</p>
</body></html>`;
  const text = [
    mail.heading,
    '',
    ...mail.paragraphs,
    ...(mail.rows ?? []).map(([k, v]) => `${k}: ${v}`),
    ...(mail.button ? ['', `${mail.button.label}: ${mail.button.url}`] : []),
    ...(mail.footer ? ['', mail.footer] : []),
  ].join('\n');
  return { html, text };
}

export async function sendMail(to: string, mail: PluginEmail): Promise<boolean> {
  const t = transport();
  if (!t) return false;
  const { html, text } = renderEmail(mail);
  try {
    await t.sendMail({
      from: env('SMTP_FROM') ?? env('SMTP_USER') ?? `no-reply@localhost`,
      to,
      subject: mail.subject,
      html,
      text,
    });
    return true;
  } catch (err) {
    console.error('[instance] Email failed:', err instanceof Error ? err.message : err);
    return false;
  }
}

/** `mail` for the app's scheduled work: emails members of this instance by id. */
export const pluginMailer: PluginMailer = {
  async sendToUser(userId, compose, options) {
    if (options?.email === false) return false;
    const user = await queryOne<{ email: string }>(
      'SELECT email FROM dq_users WHERE id = ? AND active = 1',
      [userId],
    );
    if (!user) return false;
    const locale = (env('DEFAULT_LOCALE') ?? 'en') as PluginLocale;
    return sendMail(user.email, await compose(locale));
  },
};
