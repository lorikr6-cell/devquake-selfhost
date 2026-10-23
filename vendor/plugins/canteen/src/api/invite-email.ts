import { formatDateTime, isLocale, localizePath } from '@devquake/ui';
import { translator } from '../i18n';
import { api } from '../lib/api';
import { requireCan } from '../lib/data';
import { HttpError } from '../lib/http';
import { MAX_EMAILS_PER_INVITE, maskAddress } from '../lib/invite-email';
import { orgPage } from '../lib/org-page';
import type { Role } from '../lib/roles';
import { id, readBody } from '../lib/validate';

const ERRORS = {
  invalid: 'inviteEmailInvalid',
  'rate-limited': 'inviteEmailLimit',
  declined: 'inviteEmailDeclined',
  unavailable: 'inviteEmailUnavailable',
} as const;

// POST /api/orgs/:id/invites/:inviteId/email { email, locale }: organisers send an open
// invitation by email (ADR 0073) in the language they chose, with its QR code and, for drivers,
// the drivers' app. The canteen keeps only a masked hint of the address.
export const POST = api(async ({ request, params, db, user, invitations, baseUrl, timeZone }) => {
  const orgId = id(params.id);
  await requireCan(db, orgId, user.id, 'org.manage');
  const body = await readBody(request);
  const email = typeof body.email === 'string' ? body.email.trim().slice(0, 254) : '';
  const locale = isLocale(body.locale) ? body.locale : 'en';
  const [invite] = await db.query<{
    id: number;
    code: string;
    role: Role;
    expires_at: Date | string;
    email_count: number;
  }>(
    `SELECT id, code, role, expires_at, email_count FROM canteen_invites
      WHERE id = ? AND org_id = ? AND status = 'open' AND expires_at > UTC_TIMESTAMP()`,
    [id(params.inviteId), orgId],
  );
  if (!invite) throw new HttpError(404, 'inviteNotFound');
  if (Number(invite.email_count) >= MAX_EMAILS_PER_INVITE) {
    throw new HttpError(429, 'inviteEmailMax', { max: MAX_EMAILS_PER_INVITE });
  }
  if (!invitations) throw new HttpError(503, 'inviteEmailUnavailable');
  const org = await orgPage(db, orgId, user.id);
  const t = translator(locale);
  const role = t(`roles.${invite.role}`);
  const until = formatDateTime(invite.expires_at, timeZone, 'date', locale);
  const name = org?.name ?? '';
  const result = await invitations.send({
    to: email,
    url: `${baseUrl}${localizePath(`/join/${invite.code}`, locale)}`,
    locale,
    key: `invite:${invite.id}`,
    nativeApps: invite.role === 'driver',
    // Replies go to the organisation's own address when its organisers set one.
    replyTo: org.ownContact ? org.contactEmail : undefined,
    content: {
      subject: t('inviteEmail.subject', { org: name, role }).slice(0, 120),
      heading: t('inviteEmail.heading', { org: name }).slice(0, 120),
      paragraphs: [
        t('inviteEmail.body', { org: name, role }),
        ...(invite.role === 'driver' ? [t('inviteEmail.driver')] : []),
        t('inviteEmail.howTo', { date: until }),
        t('inviteEmail.contact', { email: org.contactEmail }),
      ].map((p) => p.slice(0, 600)),
      buttonLabel: t('inviteEmail.button').slice(0, 40),
    },
  });
  if (!result.ok) {
    throw new HttpError(result.error === 'rate-limited' ? 429 : 400, ERRORS[result.error]);
  }
  if (result.sent) {
    await db.execute(
      `UPDATE canteen_invites SET emailed_at = UTC_TIMESTAMP(), email_hint = ?,
         email_count = email_count + 1 WHERE id = ?`,
      [maskAddress(email), invite.id],
    );
  }
  return { sent: result.sent, hint: maskAddress(email) };
});
