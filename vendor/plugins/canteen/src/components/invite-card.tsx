'use client';

import { useState, type FormEvent } from 'react';
import {
  Button,
  LOCALES,
  LOCALE_NAMES,
  formatDateTime,
  useLocale,
  useT,
  type Locale,
} from '@devquake/ui';
import type { Invite } from '../lib/data';
import { MAX_EMAILS_PER_INVITE } from '../lib/invite-email';
import { callApi } from './call-api';
import { ErrorText, Input, Select } from './ui';
import { useAction } from './use-action';

export interface InviteWithQr extends Invite {
  url: string;
  /** The invitation link's branded QR code (SVG drawn by the server). */
  qr: string;
}

/** The QR code as a PNG file, drawn from its SVG in the browser. */
async function downloadQr(svg: string, name: string) {
  const img = new Image();
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  await img.decode();
  const canvas = document.createElement('canvas');
  canvas.width = 720;
  canvas.height = 720;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 720, 720);
  ctx.drawImage(img, 0, 0, 720, 720);
  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = name;
  link.click();
}

/**
 * One open invitation: its role, until when it works, its QR code (scan to join), the link to
 * copy, the QR as a picture, sending it by email (ADR 0073) and revoking it.
 */
export function InviteCard({
  orgId,
  invite,
  timeZone,
  canEmail,
}: {
  orgId: number;
  invite: InviteWithQr;
  timeZone: string;
  canEmail: boolean;
}) {
  const t = useT();
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [lang, setLang] = useState<Locale>(locale);
  const { busy, error, act } = useAction();
  const role = t(`roles.${invite.role}`);
  const left = MAX_EMAILS_PER_INVITE - invite.emailCount;

  async function send(e: FormEvent) {
    e.preventDefault();
    await act(
      async () => {
        const res = await callApi<{ sent: boolean }>(
          `/orgs/${orgId}/invites/${invite.id}/email`,
          'POST',
          { email, locale: lang },
        );
        if (res && !res.sent) throw new Error(t('staff.emailAlready'));
      },
      { success: t('staff.emailSent'), after: () => setOpen(false) },
    );
  }

  return (
    <li className="rounded-lg border border-ink/10 p-3 dark:border-paper/10">
      <div className="flex flex-wrap items-start gap-3">
        <figure className="shrink-0 text-center">
          <span
            className="block size-28 rounded-md bg-white p-1"
            // Our own QR generator's SVG (no outside input but the link).
            dangerouslySetInnerHTML={{ __html: invite.qr }}
          />
          <figcaption className="mt-1 text-xs font-medium">{role}</figcaption>
        </figure>
        <div className="min-w-0 flex-1 space-y-1 text-sm">
          <p className="font-medium">{role}</p>
          <p className="text-xs text-ink/60 dark:text-paper/60">
            {t('staff.until', { date: formatDateTime(invite.expiresAt, timeZone, 'date', locale) })}
          </p>
          {invite.emailHint ? (
            <p className="text-xs text-emerald-800 dark:text-emerald-300">
              {t('staff.emailedTo', { hint: invite.emailHint })}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-1 pt-1">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigator.clipboard.writeText(invite.url).catch(() => undefined)}
            >
              {t('staff.copy')}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => downloadQr(invite.qr, `invitation-${invite.role}.png`)}
            >
              {t('staff.downloadQr')}
            </Button>
            {canEmail && left > 0 ? (
              <Button type="button" variant="ghost" onClick={() => setOpen((o) => !o)}>
                {t('staff.sendEmail')}
              </Button>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              onClick={() =>
                act(() => callApi(`/orgs/${orgId}/invites/${invite.id}`, 'DELETE'), {
                  success: t('staff.revoked'),
                })
              }
            >
              {t('staff.revoke')}
            </Button>
          </div>
        </div>
      </div>
      {open ? (
        <form onSubmit={send} className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
          <Input
            type="email"
            required
            maxLength={254}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('staff.emailAddress')}
            aria-label={t('staff.emailAddress')}
            autoComplete="off"
          />
          <Select
            value={lang}
            onChange={(e) => setLang(e.target.value as Locale)}
            aria-label={t('staff.emailLanguage')}
          >
            {LOCALES.map((l) => (
              <option key={l} value={l}>
                {LOCALE_NAMES[l]}
              </option>
            ))}
          </Select>
          <Button type="submit" disabled={busy}>
            {t('staff.send')}
          </Button>
          <p className="text-xs text-ink/60 sm:col-span-3 dark:text-paper/60">
            {invite.role === 'driver' ? t('staff.emailHintDriver') : t('staff.emailHint')}
          </p>
        </form>
      ) : null}
      <ErrorText>{error}</ErrorText>
    </li>
  );
}
