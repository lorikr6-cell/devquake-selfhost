import { randomInt } from 'node:crypto';
import type { PluginDatabase, PluginUser } from '@devquake/plugin-sdk';
import { canEncrypt, openBytes, openText, sealBytes, sealText } from './crypto';
import { HttpError } from './http';
import {
  DOCUMENT_KINDS,
  INVITE_DAYS,
  LIMITS,
  newInviteCode,
  REQUIRED_DOCUMENTS,
  type Diet,
  type DocumentKind,
  type PersonKind,
  type PersonStatus,
} from './model';
import type { Picture } from './picture';
import { can, isRole, type Action, type Role } from './roles';
import type { IdentityInput, PersonInput } from './validate';

/**
 * Data access for Social canteen, on its OWN database (ctx.db, ADR 0007). Everything belongs to
 * an organisation; a person sees an organisation only as its staff, and every function checks
 * the role first (lib/roles.ts). Personal numbers and documents are encrypted (lib/crypto.ts)
 * and every time someone opens them is written to canteen_access_log.
 */

export { HttpError };

type Db = Omit<PluginDatabase, 'transaction'>;

const num = (v: unknown) => Number(v);
const iso = (v: Date | string) => new Date(v).toISOString();
const day = (col: string, as: string) => `DATE_FORMAT(${col}, '%Y-%m-%d') AS ${as}`;

// ---------------------------------------------------------------------------------------------
// Access

export interface Staff {
  id: number;
  orgId: number;
  userId: number;
  role: Role;
}

/** The visitor's place in an organisation, or null when they are not its staff. */
export async function staffOf(db: Db, orgId: number, userId: number): Promise<Staff | null> {
  const [row] = await db.query<{ id: number; role: Role }>(
    'SELECT id, role FROM canteen_staff WHERE org_id = ? AND user_id = ?',
    [orgId, userId],
  );
  return row ? { id: num(row.id), orgId, userId, role: row.role } : null;
}

/** Staff allowed to do `action`; 404 for outsiders (no hint the organisation exists), else 403. */
export async function requireCan(
  db: Db,
  orgId: number,
  userId: number,
  action: Action,
): Promise<Staff> {
  const staff = await staffOf(db, orgId, userId);
  if (!staff) throw new HttpError(404, 'orgNotFound');
  if (!can(staff.role, action)) throw new HttpError(403, 'notAllowed');
  return staff;
}

/** Records that someone opened or changed personal data (shown to the organisers). */
export async function log(db: Db, orgId: number, personId: number, userId: number, action: string) {
  await db.execute(
    'INSERT INTO canteen_access_log (org_id, person_id, user_id, action) VALUES (?, ?, ?, ?)',
    [orgId, personId, userId, action],
  );
}

export function requireKey() {
  if (!canEncrypt()) throw new HttpError(503, 'noMasterKey');
}

// ---------------------------------------------------------------------------------------------
// Organisations

export interface Org {
  id: number;
  name: string;
  role: Role;
  people: number;
}

export async function orgsOf(db: Db, userId: number): Promise<Org[]> {
  const rows = await db.query<{ id: number; name: string; role: Role; people: number }>(
    `SELECT o.id, o.name, s.role,
            (SELECT COUNT(*) FROM canteen_people p WHERE p.org_id = o.id AND p.status <> 'ended') AS people
       FROM canteen_staff s JOIN canteen_orgs o ON o.id = s.org_id
      WHERE s.user_id = ?
      ORDER BY o.name`,
    [userId],
  );
  return rows.map((r) => ({ id: num(r.id), name: r.name, role: r.role, people: num(r.people) }));
}

export async function orgById(
  db: Db,
  orgId: number,
): Promise<{ id: number; name: string; demo: boolean } | null> {
  const [row] = await db.query<{ id: number; name: string; is_demo: number }>(
    'SELECT id, name, is_demo FROM canteen_orgs WHERE id = ?',
    [orgId],
  );
  return row ? { id: num(row.id), name: row.name, demo: num(row.is_demo) === 1 } : null;
}

/** A new organisation with the visitor as its organiser. */
export async function createOrg(
  db: PluginDatabase,
  user: PluginUser,
  input: { name: string },
): Promise<number> {
  const [count] = await db.query<{ n: number }>(
    "SELECT COUNT(*) AS n FROM canteen_staff WHERE user_id = ? AND role = 'organiser'",
    [user.id],
  );
  if (num(count?.n ?? 0) >= 5) throw new HttpError(400, 'tooManyOrgs', { max: 5 });
  return db.transaction(async (tx) => {
    const res = await tx.execute('INSERT INTO canteen_orgs (name, created_by) VALUES (?, ?)', [
      input.name,
      user.id,
    ]);
    await tx.execute(
      `INSERT INTO canteen_staff (org_id, user_id, display_name, role) VALUES (?, ?, ?, 'organiser')`,
      [res.insertId, user.id, user.displayName.slice(0, LIMITS.displayName)],
    );
    return res.insertId;
  });
}

export async function updateOrg(db: Db, orgId: number, userId: number, input: { name: string }) {
  await requireCan(db, orgId, userId, 'org.manage');
  await db.execute('UPDATE canteen_orgs SET name = ? WHERE id = ?', [input.name, orgId]);
}

/**
 * Deletes the organisation with everything in it (people, documents, medical files, menus,
 * routes, staff): every table cascades from canteen_orgs. Organisers only, and only when
 * `confirmName` is the organisation's name exactly, so it cannot happen by accident.
 */
export async function deleteOrg(db: Db, orgId: number, userId: number, confirmName: string) {
  await requireCan(db, orgId, userId, 'org.manage');
  const org = await orgById(db, orgId);
  if (!org) throw new HttpError(404, 'orgNotFound');
  if (confirmName.trim() !== org.name.trim()) throw new HttpError(400, 'deleteOrgName');
  await db.execute('DELETE FROM canteen_orgs WHERE id = ?', [orgId]);
}

// ---------------------------------------------------------------------------------------------
// People

export interface Person {
  id: number;
  firstName: string;
  lastName: string;
  birthDate: string | null;
  kind: PersonKind;
  status: PersonStatus;
  address: string | null;
  phone: string | null;
  contactName: string | null;
  contactPhone: string | null;
  diet: Diet;
  allergies: string | null;
  observation: string | null;
  idSeries: string | null;
  /** Weekdays (1 = Monday … 7) a person at home gets a meal delivered. */
  deliveryDays: number[];
  /** When they can receive it, minutes after midnight; null = any time of the shift. */
  windowFromMin: number | null;
  windowToMin: number | null;
  /** Which pictures exist; the timestamps version their URLs. */
  documents: Partial<Record<DocumentKind, string>>;
  /** The photo or the ID card is missing. */
  incomplete: boolean;
  /** In hospital now (no reason: that is in the medical file). Gets no meals meanwhile. */
  inHospital: boolean;
  updatedAt: string;
}

interface PersonRow {
  id: number;
  first_name: string;
  last_name: string;
  birth_date: string | null;
  kind: PersonKind;
  status: PersonStatus;
  address: string | null;
  phone: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  diet: Diet;
  allergies: string | null;
  observation: string | null;
  id_series: string | null;
  docs: string | null;
  days: string | null;
  window_from_min: number | null;
  window_to_min: number | null;
  updated_at: Date | string;
  in_hospital: number;
}

const PERSON_SQL = `SELECT p.id, p.first_name, p.last_name, ${day('p.birth_date', 'birth_date')}, p.kind,
       p.status, p.address, p.phone, p.contact_name, p.contact_phone, p.diet, p.allergies,
       p.observation, p.id_series, p.updated_at, p.window_from_min, p.window_to_min,
       (SELECT GROUP_CONCAT(CONCAT(d.kind, '@', DATE_FORMAT(d.uploaded_at, '%Y%m%d%H%i%s')))
          FROM canteen_documents d WHERE d.person_id = p.id) AS docs,
       (SELECT GROUP_CONCAT(dd.weekday ORDER BY dd.weekday)
          FROM canteen_delivery_days dd WHERE dd.person_id = p.id) AS days,
       EXISTS (SELECT 1 FROM canteen_hospital_stays h
                WHERE h.person_id = p.id AND h.returned_on IS NULL) AS in_hospital
  FROM canteen_people p`;

function toPerson(r: PersonRow): Person {
  const documents: Partial<Record<DocumentKind, string>> = {};
  for (const part of (r.docs ?? '').split(',').filter(Boolean)) {
    const [kind, version] = part.split('@');
    if (DOCUMENT_KINDS.includes(kind as DocumentKind)) {
      documents[kind as DocumentKind] = version ?? '';
    }
  }
  return {
    id: num(r.id),
    firstName: r.first_name,
    lastName: r.last_name,
    birthDate: r.birth_date,
    kind: r.kind,
    status: r.status,
    address: r.address,
    phone: r.phone,
    contactName: r.contact_name,
    contactPhone: r.contact_phone,
    diet: r.diet,
    allergies: r.allergies,
    observation: r.observation,
    idSeries: r.id_series,
    deliveryDays: (r.days ?? '').split(',').filter(Boolean).map(Number),
    windowFromMin: r.window_from_min === null ? null : num(r.window_from_min),
    windowToMin: r.window_to_min === null ? null : num(r.window_to_min),
    documents,
    incomplete: REQUIRED_DOCUMENTS.some((k) => !documents[k]),
    inHospital: num(r.in_hospital) === 1,
    updatedAt: iso(r.updated_at),
  };
}

export async function listPeople(db: Db, orgId: number, userId: number): Promise<Person[]> {
  await requireCan(db, orgId, userId, 'people.view');
  const rows = await db.query<PersonRow>(
    `${PERSON_SQL} WHERE p.org_id = ? ORDER BY p.status = 'ended', p.last_name, p.first_name`,
    [orgId],
  );
  return rows.map(toPerson);
}

export async function getPerson(
  db: Db,
  orgId: number,
  personId: number,
  userId: number,
): Promise<Person> {
  await requireCan(db, orgId, userId, 'people.view');
  return personOf(db, orgId, personId);
}

async function personOf(db: Db, orgId: number, personId: number): Promise<Person> {
  const [row] = await db.query<PersonRow>(`${PERSON_SQL} WHERE p.id = ? AND p.org_id = ?`, [
    personId,
    orgId,
  ]);
  if (!row) throw new HttpError(404, 'personNotFound');
  return toPerson(row);
}

const personValues = (p: PersonInput) => [
  p.firstName,
  p.lastName,
  p.birthDate,
  p.kind,
  p.status,
  p.address,
  p.phone,
  p.contactName,
  p.contactPhone,
  p.diet,
  p.allergies,
  p.observation,
  p.windowFromMin,
  p.windowToMin,
];

export async function createPerson(
  db: Db,
  orgId: number,
  userId: number,
  input: PersonInput,
): Promise<number> {
  await requireCan(db, orgId, userId, 'people.edit');
  const res = await db.execute(
    `INSERT INTO canteen_people (first_name, last_name, birth_date, kind, status, address, phone,
       contact_name, contact_phone, diet, allergies, observation, window_from_min, window_to_min,
       org_id, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [...personValues(input), orgId, userId],
  );
  await saveDeliveryDays(db, res.insertId, input.deliveryDays);
  return res.insertId;
}

/** Replaces the weekdays a person gets a delivery (only people living at home have them). */
async function saveDeliveryDays(db: Db, personId: number, days: readonly number[]) {
  await db.execute('DELETE FROM canteen_delivery_days WHERE person_id = ?', [personId]);
  for (const day of days) {
    await db.execute('INSERT INTO canteen_delivery_days (person_id, weekday) VALUES (?, ?)', [
      personId,
      day,
    ]);
  }
}

export async function updatePerson(
  db: Db,
  orgId: number,
  personId: number,
  userId: number,
  input: PersonInput,
) {
  await requireCan(db, orgId, userId, 'people.edit');
  await personOf(db, orgId, personId);
  await db.execute(
    `UPDATE canteen_people SET first_name = ?, last_name = ?, birth_date = ?, kind = ?, status = ?,
       address = ?, phone = ?, contact_name = ?, contact_phone = ?, diet = ?, allergies = ?,
       observation = ?, window_from_min = ?, window_to_min = ?
     WHERE id = ? AND org_id = ?`,
    [...personValues(input), personId, orgId],
  );
  await saveDeliveryDays(db, personId, input.deliveryDays);
}

/** Deletes the person with their documents, incidents and access log (organisers only). */
export async function deletePerson(db: Db, orgId: number, personId: number, userId: number) {
  await requireCan(db, orgId, userId, 'identity.edit');
  await personOf(db, orgId, personId);
  await db.execute('DELETE FROM canteen_access_log WHERE person_id = ? AND org_id = ?', [
    personId,
    orgId,
  ]);
  await db.execute('DELETE FROM canteen_people WHERE id = ? AND org_id = ?', [personId, orgId]);
}

// ---------------------------------------------------------------------------------------------
// Personal numbers (organisers only, every view logged)

export interface Identity {
  idSeries: string | null;
  idNumber: string | null;
  cnp: string | null;
  idExpiresOn: string | null;
}

export async function readIdentity(
  db: Db,
  orgId: number,
  personId: number,
  userId: number,
): Promise<Identity> {
  await requireCan(db, orgId, userId, 'identity.view');
  const [row] = await db.query<{
    id_series: string | null;
    id_number_sealed: string | null;
    cnp_sealed: string | null;
    id_expires_on: string | null;
  }>(
    `SELECT id_series, id_number_sealed, cnp_sealed,
            DATE_FORMAT(id_expires_on, '%Y-%m-%d') AS id_expires_on
       FROM canteen_people WHERE id = ? AND org_id = ?`,
    [personId, orgId],
  );
  if (!row) throw new HttpError(404, 'personNotFound');
  await log(db, orgId, personId, userId, 'identity.view');
  return {
    idSeries: row.id_series,
    idNumber: openText(row.id_number_sealed),
    cnp: openText(row.cnp_sealed),
    idExpiresOn: row.id_expires_on,
  };
}

export async function saveIdentity(
  db: Db,
  orgId: number,
  personId: number,
  userId: number,
  input: IdentityInput,
) {
  await requireCan(db, orgId, userId, 'identity.edit');
  await personOf(db, orgId, personId);
  if (input.idNumber || input.cnp) requireKey();
  await db.execute(
    `UPDATE canteen_people SET id_series = ?, id_number_sealed = ?, cnp_sealed = ?, id_expires_on = ?
      WHERE id = ? AND org_id = ?`,
    [
      input.idSeries,
      input.idNumber ? sealText(input.idNumber) : null,
      input.cnp ? sealText(input.cnp) : null,
      input.idExpiresOn,
      personId,
      orgId,
    ],
  );
  await log(db, orgId, personId, userId, 'identity.edit');
}

// ---------------------------------------------------------------------------------------------
// Documents (pictures): the photo for everyone who sees profiles, the rest for organisers

const documentAction = (kind: DocumentKind, write: boolean): Action =>
  kind === 'photo'
    ? write
      ? 'people.edit'
      : 'people.view'
    : write
      ? 'identity.edit'
      : 'identity.view';

export async function readDocument(
  db: Db,
  orgId: number,
  personId: number,
  kind: DocumentKind,
  userId: number,
  thumb: boolean,
): Promise<{ mime: string; data: Buffer }> {
  await requireCan(db, orgId, userId, documentAction(kind, false));
  const [row] = await db.query<{
    mime: string;
    data: Buffer;
    thumb_mime: string | null;
    thumb: Buffer | null;
  }>(
    `SELECT d.mime, d.data, d.thumb_mime, d.thumb FROM canteen_documents d
       JOIN canteen_people p ON p.id = d.person_id
      WHERE d.person_id = ? AND d.kind = ? AND p.org_id = ?`,
    [personId, kind, orgId],
  );
  if (!row) throw new HttpError(404, 'documentNotFound');
  const small = thumb && row.thumb && row.thumb_mime;
  const data = openBytes(small ? row.thumb! : row.data);
  if (!data) throw new HttpError(503, 'noMasterKey');
  // The photo is shown in every list; the ID card and other papers are logged when opened in
  // full (their small versions on the profile are not).
  if (kind !== 'photo' && !thumb) await log(db, orgId, personId, userId, `document.${kind}`);
  return { mime: small ? row.thumb_mime! : row.mime, data };
}

export async function saveDocument(
  db: Db,
  orgId: number,
  personId: number,
  kind: DocumentKind,
  userId: number,
  picture: Picture,
) {
  await requireCan(db, orgId, userId, documentAction(kind, true));
  await personOf(db, orgId, personId);
  requireKey();
  await db.execute(
    `INSERT INTO canteen_documents (person_id, kind, mime, data, thumb_mime, thumb, uploaded_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE mime = VALUES(mime), data = VALUES(data), thumb_mime = VALUES(thumb_mime),
       thumb = VALUES(thumb), uploaded_by = VALUES(uploaded_by), uploaded_at = CURRENT_TIMESTAMP`,
    [
      personId,
      kind,
      picture.mime,
      sealBytes(picture.data),
      picture.thumb?.mime ?? null,
      picture.thumb ? sealBytes(picture.thumb.data) : null,
      userId,
    ],
  );
  if (kind !== 'photo') await log(db, orgId, personId, userId, `document.${kind}.saved`);
}

export async function deleteDocument(
  db: Db,
  orgId: number,
  personId: number,
  kind: DocumentKind,
  userId: number,
) {
  await requireCan(db, orgId, userId, documentAction(kind, true));
  await personOf(db, orgId, personId);
  await db.execute('DELETE FROM canteen_documents WHERE person_id = ? AND kind = ?', [
    personId,
    kind,
  ]);
  if (kind !== 'photo') await log(db, orgId, personId, userId, `document.${kind}.deleted`);
}

// ---------------------------------------------------------------------------------------------
// Incidents

export interface Incident {
  id: number;
  occurredAt: string;
  note: string;
  author: string | null;
}

export async function listIncidents(
  db: Db,
  orgId: number,
  personId: number,
  userId: number,
): Promise<Incident[]> {
  await requireCan(db, orgId, userId, 'incidents.view');
  await personOf(db, orgId, personId);
  const rows = await db.query<{
    id: number;
    occurred_at: Date | string;
    note: string;
    author: string | null;
  }>(
    `SELECT i.id, i.occurred_at, i.note, s.display_name AS author
       FROM canteen_incidents i
       LEFT JOIN canteen_staff s ON s.user_id = i.created_by AND s.org_id = ?
      WHERE i.person_id = ?
      ORDER BY i.occurred_at DESC, i.id DESC`,
    [orgId, personId],
  );
  return rows.map((r) => ({
    id: num(r.id),
    occurredAt: iso(r.occurred_at),
    note: r.note,
    author: r.author,
  }));
}

export async function addIncident(
  db: Db,
  orgId: number,
  personId: number,
  userId: number,
  input: { occurredAt: Date; note: string },
): Promise<number> {
  await requireCan(db, orgId, userId, 'incidents.write');
  await personOf(db, orgId, personId);
  const res = await db.execute(
    'INSERT INTO canteen_incidents (person_id, occurred_at, note, created_by) VALUES (?, ?, ?, ?)',
    [personId, input.occurredAt, input.note, userId],
  );
  return res.insertId;
}

/** The author or an organiser removes an incident note. */
export async function deleteIncident(
  db: Db,
  orgId: number,
  personId: number,
  incidentId: number,
  userId: number,
) {
  const staff = await requireCan(db, orgId, userId, 'incidents.write');
  const [row] = await db.query<{ created_by: number }>(
    `SELECT i.created_by FROM canteen_incidents i JOIN canteen_people p ON p.id = i.person_id
      WHERE i.id = ? AND i.person_id = ? AND p.org_id = ?`,
    [incidentId, personId, orgId],
  );
  if (!row) throw new HttpError(404, 'notFound');
  if (num(row.created_by) !== userId && staff.role !== 'organiser') {
    throw new HttpError(403, 'notAllowed');
  }
  await db.execute('DELETE FROM canteen_incidents WHERE id = ?', [incidentId]);
}

// ---------------------------------------------------------------------------------------------
// Access log

export interface AccessEntry {
  at: string;
  action: string;
  who: string | null;
}

export async function accessLog(
  db: Db,
  orgId: number,
  personId: number,
  userId: number,
): Promise<AccessEntry[]> {
  await requireCan(db, orgId, userId, 'access.view');
  const rows = await db.query<{ at: Date | string; action: string; who: string | null }>(
    `SELECT a.at, a.action, s.display_name AS who
       FROM canteen_access_log a
       LEFT JOIN canteen_staff s ON s.user_id = a.user_id AND s.org_id = a.org_id
      WHERE a.org_id = ? AND a.person_id = ?
      ORDER BY a.at DESC, a.id DESC LIMIT 50`,
    [orgId, personId],
  );
  return rows.map((r) => ({ at: iso(r.at), action: r.action, who: r.who }));
}

// ---------------------------------------------------------------------------------------------
// Staff and invitations (organisers)

export interface StaffMember {
  id: number;
  userId: number;
  name: string;
  role: Role;
  since: string;
}

export async function listStaff(db: Db, orgId: number, userId: number): Promise<StaffMember[]> {
  await requireCan(db, orgId, userId, 'org.manage');
  const rows = await db.query<{
    id: number;
    user_id: number;
    display_name: string;
    role: Role;
    created_at: Date | string;
  }>(
    `SELECT id, user_id, display_name, role, created_at FROM canteen_staff WHERE org_id = ?
      ORDER BY FIELD(role, 'organiser', 'coordinator', 'medical', 'kitchen', 'driver'), display_name`,
    [orgId],
  );
  return rows.map((r) => ({
    id: num(r.id),
    userId: num(r.user_id),
    name: r.display_name,
    role: r.role,
    since: iso(r.created_at),
  }));
}

async function organisers(db: Db, orgId: number): Promise<number> {
  const [row] = await db.query<{ n: number }>(
    "SELECT COUNT(*) AS n FROM canteen_staff WHERE org_id = ? AND role = 'organiser'",
    [orgId],
  );
  return num(row?.n ?? 0);
}

async function staffRow(db: Db, orgId: number, staffId: number) {
  const [row] = await db.query<{ role: Role; user_id: number }>(
    'SELECT role, user_id FROM canteen_staff WHERE id = ? AND org_id = ?',
    [staffId, orgId],
  );
  if (!row) throw new HttpError(404, 'notFound');
  return row;
}

/** Changes someone's role; an organisation always keeps at least one organiser. */
export async function changeRole(
  db: Db,
  orgId: number,
  staffId: number,
  userId: number,
  role: Role,
) {
  await requireCan(db, orgId, userId, 'org.manage');
  const row = await staffRow(db, orgId, staffId);
  if (row.role === 'organiser' && role !== 'organiser' && (await organisers(db, orgId)) <= 1) {
    throw new HttpError(400, 'lastOrganiser');
  }
  await db.execute('UPDATE canteen_staff SET role = ? WHERE id = ? AND org_id = ?', [
    role,
    staffId,
    orgId,
  ]);
}

export async function removeStaff(db: Db, orgId: number, staffId: number, userId: number) {
  await requireCan(db, orgId, userId, 'org.manage');
  const row = await staffRow(db, orgId, staffId);
  if (row.role === 'organiser' && (await organisers(db, orgId)) <= 1) {
    throw new HttpError(400, 'lastOrganiser');
  }
  await db.execute('DELETE FROM canteen_staff WHERE id = ? AND org_id = ?', [staffId, orgId]);
}

export interface Invite {
  id: number;
  code: string;
  role: Role;
  expiresAt: string;
  /** Sent by email to (masked, e.g. a***@gmail.com), and how many times (migration 0015). */
  emailHint: string | null;
  emailCount: number;
}

export async function listInvites(db: Db, orgId: number, userId: number): Promise<Invite[]> {
  await requireCan(db, orgId, userId, 'org.manage');
  const rows = await db.query<{
    id: number;
    code: string;
    role: Role;
    expires_at: Date | string;
    email_hint: string | null;
    email_count: number;
  }>(
    `SELECT id, code, role, expires_at, email_hint, email_count FROM canteen_invites
      WHERE org_id = ? AND status = 'open' AND expires_at > UTC_TIMESTAMP()
      ORDER BY created_at DESC`,
    [orgId],
  );
  return rows.map((r) => ({
    id: num(r.id),
    code: r.code,
    role: r.role,
    expiresAt: iso(r.expires_at),
    emailHint: r.email_hint,
    emailCount: num(r.email_count),
  }));
}

/** A one-time invitation for one person with `role`, valid for INVITE_DAYS days. */
export async function createInvite(
  db: Db,
  orgId: number,
  userId: number,
  role: Role,
): Promise<string> {
  await requireCan(db, orgId, userId, 'org.manage');
  // The history is kept for INVITE_HISTORY_DAYS (migration 0017); older rows go now.
  await db.execute(
    'DELETE FROM canteen_invites WHERE org_id = ? AND created_at < UTC_TIMESTAMP() - INTERVAL ? DAY',
    [orgId, INVITE_HISTORY_DAYS],
  );
  const [count] = await db.query<{ n: number }>(
    `SELECT COUNT(*) AS n FROM canteen_invites
      WHERE org_id = ? AND status = 'open' AND expires_at > UTC_TIMESTAMP()`,
    [orgId],
  );
  if (num(count?.n ?? 0) >= 20) throw new HttpError(400, 'tooManyInvites', { max: 20 });
  const code = newInviteCode(randomInt);
  await db.execute(
    `INSERT INTO canteen_invites (org_id, code, role, created_by, expires_at)
     VALUES (?, ?, ?, ?, UTC_TIMESTAMP() + INTERVAL ? DAY)`,
    [orgId, code, role, userId, INVITE_DAYS],
  );
  return code;
}

export async function revokeInvite(db: Db, orgId: number, inviteId: number, userId: number) {
  await requireCan(db, orgId, userId, 'org.manage');
  await db.execute(
    `UPDATE canteen_invites SET status = 'revoked', closed_at = UTC_TIMESTAMP()
      WHERE id = ? AND org_id = ? AND status = 'open'`,
    [inviteId, orgId],
  );
}

/** How long sent invitations stay listed on the staff page. */
export const INVITE_HISTORY_DAYS = 180;

export type InviteStatus = 'open' | 'expired' | 'accepted' | 'revoked';

export interface SentInvite {
  id: number;
  role: Role;
  status: InviteStatus;
  createdAt: string;
  /** Who made it (their name in the organisation), if they are still staff. */
  createdBy: string | null;
  /** Until when it works (open), when it ran out (expired), or was accepted / revoked. */
  when: string;
  acceptedName: string | null;
  emailHint: string | null;
}

/** Every invitation of the last INVITE_HISTORY_DAYS days with its status (organisers). */
export async function listSentInvites(
  db: Db,
  orgId: number,
  userId: number,
): Promise<SentInvite[]> {
  await requireCan(db, orgId, userId, 'org.manage');
  const rows = await db.query<{
    id: number;
    role: Role;
    status: 'open' | 'accepted' | 'revoked';
    created_at: Date | string;
    expires_at: Date | string;
    closed_at: Date | string | null;
    accepted_name: string | null;
    email_hint: string | null;
    by_name: string | null;
    expired: number;
  }>(
    `SELECT i.id, i.role, i.status, i.created_at, i.expires_at, i.closed_at, i.accepted_name,
            i.email_hint, s.display_name AS by_name, i.expires_at <= UTC_TIMESTAMP() AS expired
       FROM canteen_invites i
       LEFT JOIN canteen_staff s ON s.org_id = i.org_id AND s.user_id = i.created_by
      WHERE i.org_id = ? AND i.created_at >= UTC_TIMESTAMP() - INTERVAL ? DAY
      ORDER BY i.created_at DESC, i.id DESC`,
    [orgId, INVITE_HISTORY_DAYS],
  );
  return rows.map((r) => {
    const status: InviteStatus = r.status === 'open' && num(r.expired) === 1 ? 'expired' : r.status;
    return {
      id: num(r.id),
      role: r.role,
      status,
      createdAt: iso(r.created_at),
      createdBy: r.by_name,
      when: iso(
        status === 'open' || status === 'expired' ? r.expires_at : (r.closed_at ?? r.expires_at),
      ),
      acceptedName: r.accepted_name,
      emailHint: r.email_hint,
    };
  });
}

/** What an invitation offers, for its join page; null when it is unknown or expired. */
export async function inviteInfo(
  db: Db,
  code: string,
): Promise<{ orgName: string; role: Role } | null> {
  const [row] = await db.query<{ name: string; role: Role }>(
    `SELECT o.name, i.role FROM canteen_invites i JOIN canteen_orgs o ON o.id = i.org_id
      WHERE i.code = ? AND i.status = 'open' AND i.expires_at > UTC_TIMESTAMP()`,
    [code],
  );
  return row && isRole(row.role) ? { orgName: row.name, role: row.role } : null;
}

/** Joins the organisation behind a code with its role; the code is then used up. */
export async function joinByInvite(
  db: PluginDatabase,
  code: string,
  user: PluginUser,
): Promise<{ orgId: number; inviter: number | null }> {
  return db.transaction(async (tx) => {
    const [invite] = await tx.query<{
      id: number;
      org_id: number;
      role: Role;
      created_by: number;
    }>(
      `SELECT id, org_id, role, created_by FROM canteen_invites
        WHERE code = ? AND status = 'open' AND expires_at > UTC_TIMESTAMP() FOR UPDATE`,
      [code],
    );
    if (!invite) throw new HttpError(404, 'inviteInvalid');
    const orgId = num(invite.org_id);
    const inviter = num(invite.created_by) !== user.id ? num(invite.created_by) : null;
    const [already] = await tx.query<{ id: number }>(
      'SELECT id FROM canteen_staff WHERE org_id = ? AND user_id = ?',
      [orgId, user.id],
    );
    if (!already) {
      await tx.execute(
        `INSERT INTO canteen_staff (org_id, user_id, display_name, role, invited_by)
         VALUES (?, ?, ?, ?, ?)`,
        [orgId, user.id, user.displayName.slice(0, LIMITS.displayName), invite.role, inviter],
      );
    }
    // Used up, and kept in the history: who accepted it and when.
    await tx.execute(
      `UPDATE canteen_invites SET status = 'accepted', accepted_by = ?, accepted_name = ?,
         closed_at = UTC_TIMESTAMP() WHERE id = ?`,
      [user.id, user.displayName.slice(0, 80), invite.id],
    );
    return { orgId, inviter: already ? null : inviter };
  });
}

/** Who brought this user into an organisation (the platform's invitedBy hook, ADR 0043). */
export async function inviterOf(db: Db, userId: number): Promise<number | null> {
  const [row] = await db
    .query<{ invited_by: number }>(
      `SELECT invited_by FROM canteen_staff
        WHERE user_id = ? AND invited_by IS NOT NULL ORDER BY id LIMIT 1`,
      [userId],
    )
    .catch(() => []);
  return row ? num(row.invited_by) : null;
}

// ---------------------------------------------------------------------------------------------
// Removing a staff member's account (platform hooks)

/**
 * A user's account is deleted (or they unsubscribe): their staff rows go. An organisation whose
 * last organiser leaves passes to its longest-serving coordinator or medical staff; with none,
 * it is deleted with everything in it, so personal data is never left without someone in charge.
 * Incident notes and the access log keep the user id as a plain number (shown without a name).
 */
export async function forgetUser(db: PluginDatabase, userId: number) {
  // Their demo organisations go with them, whatever role they last viewed them in.
  await db.execute('DELETE FROM canteen_orgs WHERE is_demo = 1 AND created_by = ?', [userId]);
  // Invitations they accepted stay in the history without their name.
  await db.execute(
    'UPDATE canteen_invites SET accepted_by = NULL, accepted_name = NULL WHERE accepted_by = ?',
    [userId],
  );
  // Dishes and exports stay with the organisation; who made them is forgotten. A purchasing
  // list they chose lives in their Shopping, so the organisation forgets it.
  await db.execute('UPDATE canteen_dishes SET imported_by = NULL WHERE imported_by = ?', [userId]);
  await db.execute('UPDATE canteen_shopping_exports SET exported_by = NULL WHERE exported_by = ?', [
    userId,
  ]);
  await db.execute('DELETE FROM canteen_org_links WHERE set_by = ?', [userId]);
  const orgs = await db.query<{ org_id: number; role: Role }>(
    'SELECT org_id, role FROM canteen_staff WHERE user_id = ?',
    [userId],
  );
  for (const { org_id: orgId, role } of orgs) {
    await db.transaction(async (tx) => {
      await tx.execute('DELETE FROM canteen_staff WHERE org_id = ? AND user_id = ?', [
        orgId,
        userId,
      ]);
      if (role !== 'organiser') return;
      const [left] = await tx.query<{ n: number }>(
        "SELECT COUNT(*) AS n FROM canteen_staff WHERE org_id = ? AND role = 'organiser'",
        [orgId],
      );
      if (num(left?.n ?? 0) > 0) return;
      const [next] = await tx.query<{ id: number }>(
        `SELECT id FROM canteen_staff WHERE org_id = ? AND role IN ('coordinator','medical')
          ORDER BY created_at, id LIMIT 1`,
        [orgId],
      );
      if (next) {
        await tx.execute("UPDATE canteen_staff SET role = 'organiser' WHERE id = ?", [next.id]);
      } else {
        await tx.execute('DELETE FROM canteen_orgs WHERE id = ?', [orgId]);
      }
    });
  }
}
