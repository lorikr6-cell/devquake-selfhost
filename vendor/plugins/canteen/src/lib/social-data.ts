import type { PluginDatabase } from '@devquake/plugin-sdk';
import { openText, sealText } from './crypto';
import { createPerson, requireCan, requireKey, requirePlace } from './data';
import { HttpError } from './http';
import type { PersonKind } from './model';
import {
  QUESTIONS,
  isVisitKind,
  placesLeft,
  type Answers,
  type VisitKind,
  type VisitStatus,
} from './social';
import type { PersonInput } from './validate';

// Social work (migration 0019): places per kind, the waiting list, visits and the social
// assessment questionnaire. Organisers and staff ticked as social workers (social.view/edit);
// visit notes and questionnaire answers are encrypted.

type Db = Omit<PluginDatabase, 'transaction'>;
const num = (v: unknown) => Number(v);
const iso = (v: Date | string) => new Date(v).toISOString();

export interface Places {
  kind: PersonKind;
  limit: number | null;
  used: number;
  left: number | null;
  waiting: number;
}

export interface WaitingPerson {
  id: number;
  name: string;
  kind: PersonKind;
  address: string | null;
  phone: string | null;
  waitingSince: string | null;
  /** From the newest questionnaire, when there is one. */
  priority: string | null;
  /** The social worker responsible for them (account), if any. */
  socialWorker: number | null;
}

export interface Visit {
  id: number;
  personId: number;
  personName: string;
  plannedAt: string;
  kind: VisitKind;
  status: VisitStatus;
  assignedTo: number | null;
  assignedName: string | null;
  notes: string | null;
}

export interface SocialOverview {
  places: Places[];
  waiting: WaitingPerson[];
  visits: Visit[];
  /** Who can be sent on a visit: organisers and social workers. */
  workers: { userId: number; name: string }[];
}

async function latestAnswers(db: Db, personIds: number[]): Promise<Map<number, Answers>> {
  if (personIds.length === 0) return new Map();
  const rows = await db.query<{ person_id: number; answers_sealed: string }>(
    `SELECT a.person_id, a.answers_sealed FROM canteen_assessments a
      WHERE a.person_id IN (${personIds.map(() => '?').join(', ')})
        AND a.id = (SELECT MAX(b.id) FROM canteen_assessments b WHERE b.person_id = a.person_id)`,
    personIds,
  );
  const out = new Map<number, Answers>();
  for (const r of rows) {
    try {
      out.set(num(r.person_id), JSON.parse(openText(r.answers_sealed) ?? '{}') as Answers);
    } catch {
      // unreadable without the key: no priority shown
    }
  }
  return out;
}

async function visitsOf(db: Db, orgId: number, personId: number | null): Promise<Visit[]> {
  const rows = await db.query<{
    id: number;
    person_id: number;
    first_name: string;
    last_name: string;
    planned_at: Date | string;
    kind: VisitKind;
    status: VisitStatus;
    assigned_to: number | null;
    assigned_name: string | null;
    notes_sealed: string | null;
  }>(
    `SELECT v.id, v.person_id, p.first_name, p.last_name, v.planned_at, v.kind, v.status,
            v.assigned_to, s.display_name AS assigned_name, v.notes_sealed
       FROM canteen_visits v
       JOIN canteen_people p ON p.id = v.person_id
       LEFT JOIN canteen_staff s ON s.org_id = v.org_id AND s.user_id = v.assigned_to
      WHERE v.org_id = ? ${personId === null ? "AND (v.status = 'planned' OR v.planned_at > UTC_TIMESTAMP() - INTERVAL 60 DAY)" : 'AND v.person_id = ?'}
      ORDER BY v.status = 'planned' DESC, v.planned_at`,
    personId === null ? [orgId] : [orgId, personId],
  );
  return rows.map((r) => ({
    id: num(r.id),
    personId: num(r.person_id),
    personName: `${r.last_name} ${r.first_name}`,
    plannedAt: iso(r.planned_at),
    kind: r.kind,
    status: r.status,
    assignedTo: r.assigned_to === null ? null : num(r.assigned_to),
    assignedName: r.assigned_name,
    notes: openText(r.notes_sealed),
  }));
}

async function workersOf(db: Db, orgId: number) {
  const rows = await db.query<{ user_id: number; display_name: string }>(
    `SELECT user_id, display_name FROM canteen_staff
      WHERE org_id = ? AND (FIND_IN_SET('organiser', roles) OR social_worker = 1)
      ORDER BY display_name`,
    [orgId],
  );
  return rows.map((r) => ({ userId: num(r.user_id), name: r.display_name }));
}

export async function socialOverview(
  db: Db,
  orgId: number,
  userId: number,
): Promise<SocialOverview> {
  await requireCan(db, orgId, userId, 'social.view');
  const [org] = await db.query<{ max_residents: number | null; max_delivery: number | null }>(
    'SELECT max_residents, max_delivery FROM canteen_orgs WHERE id = ?',
    [orgId],
  );
  const counts = await db.query<{ kind: PersonKind; used: number; waiting: number }>(
    `SELECT kind, SUM(status IN ('active','paused')) AS used, SUM(status = 'waiting') AS waiting
       FROM canteen_people WHERE org_id = ? GROUP BY kind`,
    [orgId],
  );
  const places = (['resident', 'delivery'] as const).map((kind): Places => {
    const c = counts.find((r) => r.kind === kind);
    const raw = kind === 'resident' ? org?.max_residents : org?.max_delivery;
    const limit = raw === null || raw === undefined ? null : num(raw);
    const used = num(c?.used ?? 0);
    return { kind, limit, used, left: placesLeft(limit, used), waiting: num(c?.waiting ?? 0) };
  });
  const rows = await db.query<{
    id: number;
    first_name: string;
    last_name: string;
    kind: PersonKind;
    address: string | null;
    phone: string | null;
    waiting_since: string | null;
    social_worker_user: number | null;
  }>(
    `SELECT id, first_name, last_name, kind, address, phone, social_worker_user,
            DATE_FORMAT(waiting_since, '%Y-%m-%d') AS waiting_since
       FROM canteen_people WHERE org_id = ? AND status = 'waiting'
      ORDER BY waiting_since, id`,
    [orgId],
  );
  const answers = await latestAnswers(
    db,
    rows.map((r) => num(r.id)),
  );
  const [visits, workers] = await Promise.all([visitsOf(db, orgId, null), workersOf(db, orgId)]);
  return {
    places,
    waiting: rows.map((r) => ({
      id: num(r.id),
      name: `${r.last_name} ${r.first_name}`,
      kind: r.kind,
      address: r.address,
      phone: r.phone,
      waitingSince: r.waiting_since,
      priority: answers.get(num(r.id))?.priority ?? null,
      socialWorker: r.social_worker_user === null ? null : num(r.social_worker_user),
    })),
    visits,
    workers,
  };
}

/** The organisation's limits (organisers): null = no limit. */
export async function saveLimits(
  db: Db,
  orgId: number,
  userId: number,
  limits: { maxResidents: number | null; maxDelivery: number | null },
) {
  await requireCan(db, orgId, userId, 'org.manage');
  await db.execute('UPDATE canteen_orgs SET max_residents = ?, max_delivery = ? WHERE id = ?', [
    limits.maxResidents,
    limits.maxDelivery,
    orgId,
  ]);
}

async function personKind(db: Db, orgId: number, personId: number) {
  const [row] = await db.query<{
    kind: PersonKind;
    status: string;
    social_worker_user: number | null;
  }>('SELECT kind, status, social_worker_user FROM canteen_people WHERE id = ? AND org_id = ?', [
    personId,
    orgId,
  ]);
  if (!row) throw new HttpError(404, 'personNotFound');
  return {
    ...row,
    socialWorker: row.social_worker_user === null ? null : num(row.social_worker_user),
  };
}

/**
 * Moves a person in or out of the service: "admit" (from the waiting list, when a place of
 * their kind is free), "wait" (back to the waiting list, freeing their place) or "end".
 */
export async function moveInService(
  db: Db,
  orgId: number,
  userId: number,
  personId: number,
  to: 'admit' | 'wait' | 'end',
) {
  await requireCan(db, orgId, userId, 'social.edit');
  const person = await personKind(db, orgId, personId);
  if (to === 'admit') {
    if (person.status === 'active' || person.status === 'paused') return;
    await requirePlace(db, orgId, person.kind, personId);
  }
  const status = to === 'admit' ? 'active' : to === 'wait' ? 'waiting' : 'ended';
  await db.execute(
    // sql-safe: one of two fixed fragments; the values are ? params.
    `UPDATE canteen_people SET status = ?, waiting_since = ${status === 'waiting' ? 'UTC_DATE()' : 'NULL'}
      WHERE id = ? AND org_id = ?`,
    [status, personId, orgId],
  );
}

/**
 * The social worker responsible for a person (null: nobody), so several social workers split
 * the work. Only an organiser or a social worker of this organisation.
 */
export async function assignSocialWorker(
  db: Db,
  orgId: number,
  userId: number,
  personId: number,
  worker: number | null,
) {
  await requireCan(db, orgId, userId, 'social.edit');
  await personKind(db, orgId, personId);
  if (worker !== null && !(await workersOf(db, orgId)).some((w) => w.userId === worker)) {
    throw new HttpError(400, 'invalidRequest');
  }
  await db.execute('UPDATE canteen_people SET social_worker_user = ? WHERE id = ? AND org_id = ?', [
    worker,
    personId,
    orgId,
  ]);
}

/** A new applicant, straight onto the waiting list (social workers need no people.edit). */
export async function addApplicant(
  db: PluginDatabase,
  orgId: number,
  userId: number,
  input: PersonInput,
): Promise<number> {
  return createPerson(db, orgId, userId, { ...input, status: 'waiting' }, 'social.edit');
}

export async function planVisit(
  db: Db,
  orgId: number,
  userId: number,
  v: { personId: number; plannedAt: Date; kind: unknown; assignedTo: number | null },
): Promise<number> {
  await requireCan(db, orgId, userId, 'social.edit');
  await personKind(db, orgId, v.personId);
  if (!isVisitKind(v.kind) || Number.isNaN(v.plannedAt.getTime())) {
    throw new HttpError(400, 'invalidRequest');
  }
  if (
    v.assignedTo !== null &&
    !(await workersOf(db, orgId)).some((w) => w.userId === v.assignedTo)
  ) {
    throw new HttpError(400, 'invalidRequest');
  }
  const res = await db.execute(
    `INSERT INTO canteen_visits (org_id, person_id, planned_at, kind, assigned_to, created_by)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [orgId, v.personId, v.plannedAt, v.kind, v.assignedTo, userId],
  );
  return res.insertId;
}

/** Marks a visit done (with its notes) or cancelled; notes alone can be changed too. */
export async function updateVisit(
  db: Db,
  orgId: number,
  userId: number,
  visitId: number,
  change: { status?: VisitStatus; notes?: string | null },
) {
  await requireCan(db, orgId, userId, 'social.edit');
  if (change.notes !== undefined) {
    requireKey();
    const notes = change.notes?.trim().slice(0, 4000) || null;
    await db.execute('UPDATE canteen_visits SET notes_sealed = ? WHERE id = ? AND org_id = ?', [
      notes ? sealText(notes) : null,
      visitId,
      orgId,
    ]);
  }
  if (change.status) {
    await db.execute(
      // sql-safe: one of two fixed fragments; the values are ? params.
      `UPDATE canteen_visits SET status = ?, closed_at = ${change.status === 'planned' ? 'NULL' : 'UTC_TIMESTAMP()'}
        WHERE id = ? AND org_id = ?`,
      [change.status, visitId, orgId],
    );
  }
}

export async function deleteVisit(db: Db, orgId: number, userId: number, visitId: number) {
  await requireCan(db, orgId, userId, 'social.edit');
  await db.execute('DELETE FROM canteen_visits WHERE id = ? AND org_id = ?', [visitId, orgId]);
}

export interface Assessment {
  id: number;
  createdAt: string;
  author: string | null;
  answers: Answers;
}

/** A person's questionnaires, newest first, and their visits (social workers). */
export async function personSocial(
  db: Db,
  orgId: number,
  userId: number,
  personId: number,
): Promise<{
  assessments: Assessment[];
  visits: Visit[];
  workers: { userId: number; name: string }[];
  socialWorker: number | null;
}> {
  await requireCan(db, orgId, userId, 'social.view');
  const person = await personKind(db, orgId, personId);
  const rows = await db.query<{
    id: number;
    created_at: Date | string;
    display_name: string | null;
    answers_sealed: string;
  }>(
    `SELECT a.id, a.created_at, s.display_name, a.answers_sealed FROM canteen_assessments a
       LEFT JOIN canteen_staff s ON s.org_id = a.org_id AND s.user_id = a.created_by
      WHERE a.org_id = ? AND a.person_id = ? ORDER BY a.id DESC LIMIT 20`,
    [orgId, personId],
  );
  const assessments = rows.flatMap((r): Assessment[] => {
    try {
      const answers = JSON.parse(openText(r.answers_sealed) ?? 'null') as Answers | null;
      return answers
        ? [{ id: num(r.id), createdAt: iso(r.created_at), author: r.display_name, answers }]
        : [];
    } catch {
      return [];
    }
  });
  const [visits, workers] = await Promise.all([
    visitsOf(db, orgId, personId),
    workersOf(db, orgId),
  ]);
  return { assessments, visits, workers, socialWorker: person.socialWorker };
}

export async function saveAssessment(
  db: Db,
  orgId: number,
  userId: number,
  personId: number,
  answers: Answers,
  visitId: number | null,
): Promise<number> {
  await requireCan(db, orgId, userId, 'social.edit');
  await personKind(db, orgId, personId);
  requireKey();
  const known = new Set<string>(QUESTIONS.map((q) => q.id));
  const clean = Object.fromEntries(Object.entries(answers).filter(([k]) => known.has(k)));
  const res = await db.execute(
    `INSERT INTO canteen_assessments (org_id, person_id, visit_id, answers_sealed, created_by)
     VALUES (?, ?, ?, ?, ?)`,
    [orgId, personId, visitId, sealText(JSON.stringify(clean)), userId],
  );
  return res.insertId;
}

/** Ticks or unticks a staff member as the organisation's social worker (organisers). */
export async function setSocialWorker(
  db: Db,
  orgId: number,
  userId: number,
  staffId: number,
  on: boolean,
) {
  await requireCan(db, orgId, userId, 'org.manage');
  const res = await db.execute(
    'UPDATE canteen_staff SET social_worker = ? WHERE id = ? AND org_id = ?',
    [on ? 1 : 0, staffId, orgId],
  );
  if (res.affectedRows === 0) throw new HttpError(404, 'notFound');
}
