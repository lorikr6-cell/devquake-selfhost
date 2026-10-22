import type { PluginDatabase } from '@devquake/plugin-sdk';
import { openBytes, sealBytes, sealText } from './crypto';
import { requireCan, requireKey } from './data';
import { isIsoDate, type IsoDate } from './dates';
import { HttpError } from './http';
import type { Picture } from './picture';
import { can } from './roles';

// Drivers' licences on the app's own database (migration 0011). Planners (routes.edit) handle
// every driver's licence; a driver handles their own (the driver record linked to their account).

type Db = Omit<PluginDatabase, 'transaction'>;

const num = (v: unknown) => Number(v);

export interface LicenceInfo {
  expiresOn: IsoDate;
  nameChecked: boolean;
  uploadedAt: string;
}

/** The person may handle this driver's licence: a planner, or the driver themselves. */
async function requireLicenceAccess(db: Db, orgId: number, driverId: number, userId: number) {
  const staff = await requireCan(db, orgId, userId, 'org.view');
  const [driver] = await db.query<{ user_id: number | null }>(
    'SELECT user_id FROM canteen_drivers WHERE id = ? AND org_id = ?',
    [driverId, orgId],
  );
  if (!driver) throw new HttpError(404, 'notFound');
  const own = driver.user_id !== null && num(driver.user_id) === userId;
  if (!own && !can(staff.role, 'routes.edit')) throw new HttpError(403, 'notAllowed');
}

/** Every driver's licence state for the drivers list (planners). */
export async function licencesOf(
  db: Db,
  orgId: number,
  userId: number,
): Promise<Map<number, LicenceInfo>> {
  await requireCan(db, orgId, userId, 'routes.edit');
  const rows = await db.query<{
    driver_id: number;
    expires_on: string;
    name_checked: number;
    uploaded_at: Date | string;
  }>(
    `SELECT l.driver_id, DATE_FORMAT(l.expires_on, '%Y-%m-%d') AS expires_on, l.name_checked, l.uploaded_at
       FROM canteen_driver_licences l JOIN canteen_drivers d ON d.id = l.driver_id
      WHERE d.org_id = ?`,
    [orgId],
  );
  return new Map(
    rows.map((r) => [
      num(r.driver_id),
      {
        expiresOn: r.expires_on,
        nameChecked: num(r.name_checked) === 1,
        uploadedAt: new Date(r.uploaded_at).toISOString(),
      },
    ]),
  );
}

/**
 * The signed-in driver's own licence in an organisation (for the notice on their route): the
 * driver record linked to their account and its licence, or null when they drive for nobody.
 */
export async function myLicence(
  db: Db,
  orgId: number,
  userId: number,
): Promise<{ driverId: number; name: string; licence: LicenceInfo | null } | null> {
  await requireCan(db, orgId, userId, 'org.view');
  const [row] = await db.query<{
    id: number;
    name: string;
    expires_on: string | null;
    name_checked: number | null;
    uploaded_at: Date | string | null;
  }>(
    `SELECT d.id, d.name, DATE_FORMAT(l.expires_on, '%Y-%m-%d') AS expires_on, l.name_checked, l.uploaded_at
       FROM canteen_drivers d LEFT JOIN canteen_driver_licences l ON l.driver_id = d.id
      WHERE d.org_id = ? AND d.user_id = ? AND d.active = 1
      ORDER BY d.id LIMIT 1`,
    [orgId, userId],
  );
  if (!row) return null;
  return {
    driverId: num(row.id),
    name: row.name,
    licence: row.expires_on
      ? {
          expiresOn: row.expires_on,
          nameChecked: num(row.name_checked) === 1,
          uploadedAt: new Date(row.uploaded_at!).toISOString(),
        }
      : null,
  };
}

export interface LicenceInput {
  expiresOn: IsoDate;
  number: string | null;
  nameChecked: boolean;
}

/** Saves a licence (replacing the old one). An expired licence is refused. */
export async function saveLicence(
  db: Db,
  orgId: number,
  driverId: number,
  userId: number,
  today: IsoDate,
  picture: Picture,
  input: LicenceInput,
) {
  await requireLicenceAccess(db, orgId, driverId, userId);
  if (!isIsoDate(input.expiresOn)) throw new HttpError(400, 'date', { field: 'licenceExpiry' });
  if (input.expiresOn < today) throw new HttpError(400, 'licenceExpired');
  requireKey();
  await db.execute(
    `INSERT INTO canteen_driver_licences (driver_id, mime, data, thumb_mime, thumb, number_sealed,
       expires_on, name_checked, uploaded_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE mime = VALUES(mime), data = VALUES(data), thumb_mime = VALUES(thumb_mime),
       thumb = VALUES(thumb), number_sealed = VALUES(number_sealed), expires_on = VALUES(expires_on),
       name_checked = VALUES(name_checked), uploaded_by = VALUES(uploaded_by),
       uploaded_at = CURRENT_TIMESTAMP`,
    [
      driverId,
      picture.mime,
      sealBytes(picture.data),
      picture.thumb?.mime ?? null,
      picture.thumb ? sealBytes(picture.thumb.data) : null,
      input.number ? sealText(input.number) : null,
      input.expiresOn,
      input.nameChecked ? 1 : 0,
      userId,
    ],
  );
}

export async function readLicencePicture(
  db: Db,
  orgId: number,
  driverId: number,
  userId: number,
  thumb: boolean,
): Promise<{ mime: string; data: Buffer }> {
  await requireLicenceAccess(db, orgId, driverId, userId);
  const [row] = await db.query<{
    mime: string;
    data: Buffer;
    thumb_mime: string | null;
    thumb: Buffer | null;
  }>('SELECT mime, data, thumb_mime, thumb FROM canteen_driver_licences WHERE driver_id = ?', [
    driverId,
  ]);
  if (!row) throw new HttpError(404, 'documentNotFound');
  const small = thumb && row.thumb && row.thumb_mime;
  const data = openBytes(small ? row.thumb! : row.data);
  if (!data) throw new HttpError(503, 'noMasterKey');
  return { mime: small ? row.thumb_mime! : row.mime, data };
}

export async function deleteLicence(db: Db, orgId: number, driverId: number, userId: number) {
  await requireLicenceAccess(db, orgId, driverId, userId);
  await db.execute('DELETE FROM canteen_driver_licences WHERE driver_id = ?', [driverId]);
}
