import type { PluginDatabase } from '@devquake/plugin-sdk';
import { requireCan } from './data';
import { DEFAULT_CONTACT_EMAIL } from './contact-email';
import {
  DEFAULT_LOOK,
  hexColor,
  isHeaderAlign,
  isHeaderFont,
  isHeaderText,
  type HeaderLook,
} from './header-style';
import { HttpError } from './http';
import type { Picture } from './picture';

// The organisation's own page (logo, description) that visitors may see when the organisers
// make it public. It never shows anything about the people the organisation serves.

type Db = Omit<PluginDatabase, 'transaction'>;

export const DESCRIPTION_MAX = 2000;

export interface OrgPage {
  id: number;
  name: string;
  description: string | null;
  publicPage: boolean;
  /** Versions the logo's URL; null without a logo. */
  logoVersion: string | null;
  /** Where people write to: the organisers' address, or DevQuake's by default. */
  contactEmail: string;
  /** The organisers set their own address. */
  ownContact: boolean;
  /** How the header looks (font, colours, picture), on screen and in print. */
  look: HeaderLook;
}

async function pageOf(db: Db, orgId: number): Promise<OrgPage | null> {
  const [row] = await db.query<{
    id: number;
    name: string;
    description: string | null;
    public_page: number;
    logo_version: string | null;
    contact_email: string | null;
    header_font: string | null;
    header_bg: string | null;
    header_text: string;
    header_align: string;
    header_image_version: string | null;
  }>(
    `SELECT id, name, description, public_page, contact_email,
            DATE_FORMAT(logo_updated_at, '%Y%m%d%H%i%s') AS logo_version,
            header_font, header_bg, header_text, header_align,
            DATE_FORMAT(header_image_updated_at, '%Y%m%d%H%i%s') AS header_image_version
       FROM canteen_orgs WHERE id = ?`,
    [orgId],
  );
  return row
    ? {
        id: Number(row.id),
        name: row.name,
        description: row.description,
        publicPage: Number(row.public_page) === 1,
        logoVersion: row.logo_version,
        contactEmail: row.contact_email ?? DEFAULT_CONTACT_EMAIL,
        ownContact: row.contact_email !== null,
        look: {
          font: isHeaderFont(row.header_font) ? row.header_font : DEFAULT_LOOK.font,
          bg: hexColor(row.header_bg),
          text: isHeaderText(row.header_text) ? row.header_text : DEFAULT_LOOK.text,
          align: isHeaderAlign(row.header_align) ? row.header_align : DEFAULT_LOOK.align,
          imageVersion: row.header_image_version,
        },
      }
    : null;
}

/** For the organisation's staff (any role). */
export async function orgPage(db: Db, orgId: number, userId: number): Promise<OrgPage> {
  await requireCan(db, orgId, userId, 'org.view');
  const page = await pageOf(db, orgId);
  if (!page) throw new HttpError(404, 'orgNotFound');
  return page;
}

/** For anyone: only when the organisers made the page public (404 otherwise, no hint). */
export async function publicOrgPage(db: Db, orgId: number): Promise<OrgPage | null> {
  const page = await pageOf(db, orgId);
  return page?.publicPage ? page : null;
}

export async function saveDescription(
  db: Db,
  orgId: number,
  userId: number,
  description: string | null,
) {
  await requireCan(db, orgId, userId, 'org.manage');
  await db.execute('UPDATE canteen_orgs SET description = ? WHERE id = ?', [description, orgId]);
}

/** The organisation's contact email; null = DevQuake's address again. */
export async function saveContactEmail(
  db: Db,
  orgId: number,
  userId: number,
  email: string | null,
) {
  await requireCan(db, orgId, userId, 'org.manage');
  await db.execute('UPDATE canteen_orgs SET contact_email = ? WHERE id = ?', [email, orgId]);
}

export async function setPublicPage(db: Db, orgId: number, userId: number, on: boolean) {
  await requireCan(db, orgId, userId, 'org.manage');
  await db.execute('UPDATE canteen_orgs SET public_page = ? WHERE id = ?', [on ? 1 : 0, orgId]);
}

export async function saveLogo(db: Db, orgId: number, userId: number, picture: Picture) {
  await requireCan(db, orgId, userId, 'org.manage');
  await db.execute(
    'UPDATE canteen_orgs SET logo_mime = ?, logo = ?, logo_updated_at = UTC_TIMESTAMP() WHERE id = ?',
    [picture.mime, Buffer.from(picture.data), orgId],
  );
}

export async function deleteLogo(db: Db, orgId: number, userId: number) {
  await requireCan(db, orgId, userId, 'org.manage');
  await db.execute(
    'UPDATE canteen_orgs SET logo_mime = NULL, logo = NULL, logo_updated_at = NULL WHERE id = ?',
    [orgId],
  );
}

/** The logo for staff, or for anyone once the page is public. */
export async function readLogo(
  db: Db,
  orgId: number,
  userId: number | null,
): Promise<{ mime: string; data: Buffer }> {
  const [row] = await db.query<{ mime: string | null; data: Buffer | null; public_page: number }>(
    'SELECT logo_mime AS mime, logo AS data, public_page FROM canteen_orgs WHERE id = ?',
    [orgId],
  );
  if (!row?.mime || !row.data) throw new HttpError(404, 'notFound');
  if (Number(row.public_page) !== 1) {
    if (userId === null) throw new HttpError(404, 'notFound');
    await requireCan(db, orgId, userId, 'org.view');
  }
  return { mime: row.mime, data: row.data };
}

/** The header's font, colours and alignment (organisers); unknown values fall back to the default. */
export async function saveHeaderLook(
  db: Db,
  orgId: number,
  userId: number,
  look: { font: unknown; bg: unknown; text: unknown; align: unknown },
) {
  await requireCan(db, orgId, userId, 'org.manage');
  if (look.bg !== null && look.bg !== '' && hexColor(look.bg) === null) {
    throw new HttpError(400, 'invalidRequest');
  }
  await db.execute(
    'UPDATE canteen_orgs SET header_font = ?, header_bg = ?, header_text = ?, header_align = ? WHERE id = ?',
    [
      isHeaderFont(look.font) ? look.font : null,
      hexColor(look.bg),
      isHeaderText(look.text) ? look.text : DEFAULT_LOOK.text,
      isHeaderAlign(look.align) ? look.align : DEFAULT_LOOK.align,
      orgId,
    ],
  );
}

export async function saveHeaderImage(db: Db, orgId: number, userId: number, picture: Picture) {
  await requireCan(db, orgId, userId, 'org.manage');
  await db.execute(
    `UPDATE canteen_orgs SET header_image_mime = ?, header_image = ?,
            header_image_updated_at = UTC_TIMESTAMP() WHERE id = ?`,
    [picture.mime, Buffer.from(picture.data), orgId],
  );
}

export async function deleteHeaderImage(db: Db, orgId: number, userId: number) {
  await requireCan(db, orgId, userId, 'org.manage');
  await db.execute(
    `UPDATE canteen_orgs SET header_image_mime = NULL, header_image = NULL,
            header_image_updated_at = NULL WHERE id = ?`,
    [orgId],
  );
}

/** The header picture for staff, or for anyone once the page is public (like the logo). */
export async function readHeaderImage(
  db: Db,
  orgId: number,
  userId: number | null,
): Promise<{ mime: string; data: Buffer }> {
  const [row] = await db.query<{ mime: string | null; data: Buffer | null; public_page: number }>(
    'SELECT header_image_mime AS mime, header_image AS data, public_page FROM canteen_orgs WHERE id = ?',
    [orgId],
  );
  if (!row?.mime || !row.data) throw new HttpError(404, 'notFound');
  if (Number(row.public_page) !== 1) {
    if (userId === null) throw new HttpError(404, 'notFound');
    await requireCan(db, orgId, userId, 'org.view');
  }
  return { mime: row.mime, data: row.data };
}
