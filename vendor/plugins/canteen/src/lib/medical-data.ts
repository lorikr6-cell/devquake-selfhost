import type { PluginDatabase } from '@devquake/plugin-sdk';
import { openText, sealText } from './crypto';
import { log, requireCan, requireKey } from './data';
import type { IsoDate } from './dates';
import { HttpError } from './http';
import { dosesDue, type DoseStatus } from './medical';

/**
 * The medical file on the app's own database (docs/plugins/ideas/canteen.md, step 4). Health
 * data: medical staff only (`medical.view` / `medical.edit`), every text stored encrypted, and
 * every opening of a file written to the access log the organisers see.
 */

type Db = Omit<PluginDatabase, 'transaction'>;

const num = (v: unknown) => Number(v);
const iso = (v: Date | string) => new Date(v).toISOString();
const seal = (v: string | null) => (v ? sealText(v) : null);
const day = (col: string, as: string) => `DATE_FORMAT(${col}, '%Y-%m-%d') AS ${as}`;

/** The person must be in the organisation (404 otherwise). */
async function personIn(db: Db, orgId: number, personId: number): Promise<string> {
  const [row] = await db.query<{ first_name: string; last_name: string }>(
    'SELECT first_name, last_name FROM canteen_people WHERE id = ? AND org_id = ?',
    [personId, orgId],
  );
  if (!row) throw new HttpError(404, 'personNotFound');
  return `${row.last_name} ${row.first_name}`;
}

// ---------------------------------------------------------------------------------------------
// The file

export interface MedicalProfile {
  conditions: string | null;
  allergies: string | null;
  familyDoctor: string | null;
  bloodType: string | null;
  notes: string | null;
}

export interface Medication {
  id: number;
  name: string;
  dose: string;
  notes: string | null;
  times: number[];
  startsOn: IsoDate;
  endsOn: IsoDate | null;
}

export interface MedNote {
  id: number;
  occurredAt: string;
  note: string;
  author: string | null;
}

export interface HospitalStay {
  id: number;
  leftOn: IsoDate;
  returnedOn: IsoDate | null;
  hospital: string | null;
  cause: string;
  verdict: string | null;
  recommendations: string | null;
  recommendationsActive: boolean;
}

export interface MedicalFile {
  name: string;
  profile: MedicalProfile;
  medications: Medication[];
  notes: MedNote[];
  stays: HospitalStay[];
}

async function medicationsOf(
  db: Db,
  personIds: number[],
): Promise<(Medication & { personId: number })[]> {
  if (personIds.length === 0) return [];
  const rows = await db.query<{
    id: number;
    person_id: number;
    name_sealed: string;
    dose_sealed: string;
    notes_sealed: string | null;
    times: string;
    starts_on: string;
    ends_on: string | null;
  }>(
    `SELECT id, person_id, name_sealed, dose_sealed, notes_sealed, times,
            ${day('starts_on', 'starts_on')}, ${day('ends_on', 'ends_on')}
       FROM canteen_medications WHERE person_id IN (${personIds.map(() => '?').join(', ')})
      ORDER BY starts_on DESC, id DESC`,
    personIds,
  );
  return rows.map((r) => ({
    id: num(r.id),
    personId: num(r.person_id),
    name: openText(r.name_sealed) ?? '?',
    dose: openText(r.dose_sealed) ?? '?',
    notes: openText(r.notes_sealed),
    times: r.times.split(',').filter(Boolean).map(Number),
    startsOn: r.starts_on,
    endsOn: r.ends_on,
  }));
}

/** A person's whole medical file; opening it is logged. */
export async function medicalFile(
  db: Db,
  orgId: number,
  personId: number,
  userId: number,
): Promise<MedicalFile> {
  await requireCan(db, orgId, userId, 'medical.view');
  const name = await personIn(db, orgId, personId);
  const [[profile], medications, notes, stays] = await Promise.all([
    db.query<{
      conditions_sealed: string | null;
      allergies_sealed: string | null;
      family_doctor_sealed: string | null;
      blood_type_sealed: string | null;
      notes_sealed: string | null;
    }>(
      `SELECT conditions_sealed, allergies_sealed, family_doctor_sealed, blood_type_sealed, notes_sealed
         FROM canteen_medical_profiles WHERE person_id = ?`,
      [personId],
    ),
    medicationsOf(db, [personId]),
    db.query<{
      id: number;
      occurred_at: Date | string;
      note_sealed: string;
      author: string | null;
    }>(
      `SELECT n.id, n.occurred_at, n.note_sealed, s.display_name AS author
         FROM canteen_med_notes n
         LEFT JOIN canteen_staff s ON s.user_id = n.created_by AND s.org_id = ?
        WHERE n.person_id = ? ORDER BY n.occurred_at DESC, n.id DESC LIMIT 100`,
      [orgId, personId],
    ),
    db.query<{
      id: number;
      left_on: string;
      returned_on: string | null;
      hospital_sealed: string | null;
      cause_sealed: string;
      verdict_sealed: string | null;
      recommendations_sealed: string | null;
      recommendations_active: number;
    }>(
      `SELECT id, ${day('left_on', 'left_on')}, ${day('returned_on', 'returned_on')},
              hospital_sealed, cause_sealed, verdict_sealed, recommendations_sealed,
              recommendations_active
         FROM canteen_hospital_stays WHERE person_id = ? ORDER BY left_on DESC, id DESC`,
      [personId],
    ),
  ]);
  await log(db, orgId, personId, userId, 'medical.view');
  return {
    name,
    profile: {
      conditions: openText(profile?.conditions_sealed ?? null),
      allergies: openText(profile?.allergies_sealed ?? null),
      familyDoctor: openText(profile?.family_doctor_sealed ?? null),
      bloodType: openText(profile?.blood_type_sealed ?? null),
      notes: openText(profile?.notes_sealed ?? null),
    },
    medications: medications.map(({ personId: _p, ...m }) => m),
    notes: notes.map((n) => ({
      id: num(n.id),
      occurredAt: iso(n.occurred_at),
      note: openText(n.note_sealed) ?? '?',
      author: n.author,
    })),
    stays: stays.map((s) => ({
      id: num(s.id),
      leftOn: s.left_on,
      returnedOn: s.returned_on,
      hospital: openText(s.hospital_sealed),
      cause: openText(s.cause_sealed) ?? '?',
      verdict: openText(s.verdict_sealed),
      recommendations: openText(s.recommendations_sealed),
      recommendationsActive: num(s.recommendations_active) === 1,
    })),
  };
}

export async function saveProfile(
  db: Db,
  orgId: number,
  personId: number,
  userId: number,
  p: MedicalProfile,
) {
  await requireCan(db, orgId, userId, 'medical.edit');
  await personIn(db, orgId, personId);
  requireKey();
  await db.execute(
    `INSERT INTO canteen_medical_profiles (person_id, conditions_sealed, allergies_sealed,
       family_doctor_sealed, blood_type_sealed, notes_sealed, updated_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE conditions_sealed = VALUES(conditions_sealed),
       allergies_sealed = VALUES(allergies_sealed), family_doctor_sealed = VALUES(family_doctor_sealed),
       blood_type_sealed = VALUES(blood_type_sealed), notes_sealed = VALUES(notes_sealed),
       updated_by = VALUES(updated_by)`,
    [
      personId,
      seal(p.conditions),
      seal(p.allergies),
      seal(p.familyDoctor),
      seal(p.bloodType),
      seal(p.notes),
      userId,
    ],
  );
}

// ---------------------------------------------------------------------------------------------
// Medications

export interface MedicationInput {
  name: string;
  dose: string;
  notes: string | null;
  times: number[];
  startsOn: IsoDate;
  endsOn: IsoDate | null;
}

export async function saveMedication(
  db: Db,
  orgId: number,
  personId: number,
  userId: number,
  m: MedicationInput,
  id?: number,
): Promise<number> {
  await requireCan(db, orgId, userId, 'medical.edit');
  await personIn(db, orgId, personId);
  requireKey();
  const values = [
    sealText(m.name),
    sealText(m.dose),
    seal(m.notes),
    m.times.join(','),
    m.startsOn,
    m.endsOn,
  ];
  if (id !== undefined) {
    const res = await db.execute(
      `UPDATE canteen_medications SET name_sealed = ?, dose_sealed = ?, notes_sealed = ?, times = ?,
         starts_on = ?, ends_on = ? WHERE id = ? AND person_id = ?`,
      [...values, id, personId],
    );
    if (res.affectedRows === 0) throw new HttpError(404, 'notFound');
    return id;
  }
  const res = await db.execute(
    `INSERT INTO canteen_medications (name_sealed, dose_sealed, notes_sealed, times, starts_on,
       ends_on, person_id, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [...values, personId, userId],
  );
  return res.insertId;
}

/** Removes a medicine entered by mistake, with its administration record. */
export async function deleteMedication(
  db: Db,
  orgId: number,
  personId: number,
  id: number,
  userId: number,
) {
  await requireCan(db, orgId, userId, 'medical.edit');
  await personIn(db, orgId, personId);
  await db.execute('DELETE FROM canteen_medications WHERE id = ? AND person_id = ?', [
    id,
    personId,
  ]);
}

// ---------------------------------------------------------------------------------------------
// Notes and hospital stays

export async function addMedNote(
  db: Db,
  orgId: number,
  personId: number,
  userId: number,
  input: { occurredAt: Date; note: string },
) {
  await requireCan(db, orgId, userId, 'medical.edit');
  await personIn(db, orgId, personId);
  requireKey();
  await db.execute(
    'INSERT INTO canteen_med_notes (person_id, occurred_at, note_sealed, created_by) VALUES (?, ?, ?, ?)',
    [personId, input.occurredAt, sealText(input.note), userId],
  );
}

export async function deleteMedNote(
  db: Db,
  orgId: number,
  personId: number,
  id: number,
  userId: number,
) {
  await requireCan(db, orgId, userId, 'medical.edit');
  await personIn(db, orgId, personId);
  await db.execute('DELETE FROM canteen_med_notes WHERE id = ? AND person_id = ?', [id, personId]);
}

export interface StayInput {
  leftOn: IsoDate;
  returnedOn: IsoDate | null;
  hospital: string | null;
  cause: string;
  verdict: string | null;
  recommendations: string | null;
  recommendationsActive: boolean;
}

export async function saveStay(
  db: Db,
  orgId: number,
  personId: number,
  userId: number,
  s: StayInput,
  id?: number,
): Promise<number> {
  await requireCan(db, orgId, userId, 'medical.edit');
  await personIn(db, orgId, personId);
  requireKey();
  const values = [
    s.leftOn,
    s.returnedOn,
    seal(s.hospital),
    sealText(s.cause),
    seal(s.verdict),
    seal(s.recommendations),
    s.recommendationsActive ? 1 : 0,
  ];
  if (id !== undefined) {
    const res = await db.execute(
      `UPDATE canteen_hospital_stays SET left_on = ?, returned_on = ?, hospital_sealed = ?,
         cause_sealed = ?, verdict_sealed = ?, recommendations_sealed = ?, recommendations_active = ?
       WHERE id = ? AND person_id = ?`,
      [...values, id, personId],
    );
    if (res.affectedRows === 0) throw new HttpError(404, 'notFound');
    return id;
  }
  const res = await db.execute(
    `INSERT INTO canteen_hospital_stays (left_on, returned_on, hospital_sealed, cause_sealed,
       verdict_sealed, recommendations_sealed, recommendations_active, person_id, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [...values, personId, userId],
  );
  return res.insertId;
}

/** Who in the organisation is in hospital now (no reason): for badges and to pause meals. */
export async function inHospital(db: Db, orgId: number): Promise<Set<number>> {
  const rows = await db.query<{ person_id: number }>(
    `SELECT DISTINCT h.person_id FROM canteen_hospital_stays h
       JOIN canteen_people p ON p.id = h.person_id
      WHERE p.org_id = ? AND h.returned_on IS NULL`,
    [orgId],
  );
  return new Set(rows.map((r) => num(r.person_id)));
}

// ---------------------------------------------------------------------------------------------
// The day's medication round

export interface RoundDose {
  medicationId: number;
  timeMin: number;
  name: string;
  dose: string;
  status: DoseStatus | null;
  by: string | null;
}

export interface RoundPerson {
  personId: number;
  name: string;
  inHospital: boolean;
  doses: RoundDose[];
}

/** Everyone with doses due on `day`, with what was recorded so far. */
export async function medicationRound(
  db: Db,
  orgId: number,
  userId: number,
  dayIso: IsoDate,
): Promise<RoundPerson[]> {
  await requireCan(db, orgId, userId, 'medical.view');
  const people = await db.query<{ id: number; first_name: string; last_name: string }>(
    `SELECT id, first_name, last_name FROM canteen_people
      WHERE org_id = ? AND status = 'active' ORDER BY last_name, first_name`,
    [orgId],
  );
  const meds = await medicationsOf(
    db,
    people.map((p) => num(p.id)),
  );
  if (meds.length === 0) return [];
  const recorded = await db.query<{
    medication_id: number;
    time_min: number;
    status: DoseStatus;
    by: string | null;
  }>(
    `SELECT d.medication_id, d.time_min, d.status, s.display_name AS \`by\`
       FROM canteen_med_doses d
       LEFT JOIN canteen_staff s ON s.user_id = d.recorded_by AND s.org_id = ?
      WHERE d.day = ? AND d.medication_id IN (${meds.map(() => '?').join(', ')})`,
    [orgId, dayIso, ...meds.map((m) => m.id)],
  );
  const away = await inHospital(db, orgId);
  return people
    .map((p) => {
      const own = meds.filter((m) => m.personId === num(p.id));
      const doses = dosesDue(own, dayIso).map((d) => {
        const med = own.find((m) => m.id === d.medicationId)!;
        const rec = recorded.find(
          (r) => num(r.medication_id) === d.medicationId && num(r.time_min) === d.timeMin,
        );
        return {
          ...d,
          name: med.name,
          dose: med.dose,
          status: rec?.status ?? null,
          by: rec?.by ?? null,
        };
      });
      return {
        personId: num(p.id),
        name: `${p.last_name} ${p.first_name}`,
        inHospital: away.has(num(p.id)),
        doses,
      };
    })
    .filter((p) => p.doses.length > 0);
}

/** Records a dose as given, refused or missed (changing it replaces the record). */
export async function recordDose(
  db: Db,
  orgId: number,
  userId: number,
  medicationId: number,
  dayIso: IsoDate,
  timeMin: number,
  status: DoseStatus,
) {
  await requireCan(db, orgId, userId, 'medical.edit');
  const [med] = await db.query<{ times: string }>(
    `SELECT m.times FROM canteen_medications m JOIN canteen_people p ON p.id = m.person_id
      WHERE m.id = ? AND p.org_id = ?`,
    [medicationId, orgId],
  );
  if (!med || !med.times.split(',').map(Number).includes(timeMin)) {
    throw new HttpError(404, 'notFound');
  }
  await db.execute(
    `INSERT INTO canteen_med_doses (medication_id, day, time_min, status, recorded_by)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE status = VALUES(status), recorded_by = VALUES(recorded_by),
       recorded_at = CURRENT_TIMESTAMP`,
    [medicationId, dayIso, timeMin, status, userId],
  );
}
