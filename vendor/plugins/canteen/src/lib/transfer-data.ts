import type { PluginDatabase } from '@devquake/plugin-sdk';
import type { Locale } from '@devquake/ui';
import { translator } from '../i18n';
import { openText, sealText } from './crypto';
import { listPeople, listStaff, log, requireCan, requireKey } from './data';
import { isIsoDate, type IsoDate } from './dates';
import { HttpError } from './http';
import { parseTime, type MealTime } from './meals';
import { allMenus, checkDishes, listMealTimes } from './meals-data';
import { DIETS, LIMITS, type Diet } from './model';
import { orgPage } from './org-page';
import { listDrivers } from './routes-data';
import {
  buildSheets,
  cellDate,
  cellDays,
  cellTime,
  dietCode,
  isYes,
  kindCode,
  mealOf,
  mealTimeClash,
  parseSheets,
  statusCode,
  type ParsedSheet,
  type TransferIdentity,
} from './transfer';
import {
  identityInput,
  type IdentityInput,
  longOptionalText,
  optionalText,
  personInput,
  requiredText,
  weekdays,
  type PersonInput,
} from './validate';
import { readXlsx, writeXlsx } from './xlsx';

/**
 * Export and re-upload of an organisation (organisers only). The upload is checked in full
 * first: one wrong row and nothing changes, the message says which sheet and row. Then every
 * change is applied in one transaction. Rows are matched by their id; rows without one are
 * added; nothing is deleted. Pictures and the medical file are never part of the file. The
 * personal numbers are: each person's are logged as exported (`identity.export`), and changed
 * ones as edited. Drivers' licence data is changed only where a licence picture was uploaded.
 */

type Db = Omit<PluginDatabase, 'transaction'>;

const num = (v: unknown) => Number(v);
const pad = (n: number) => String(n).padStart(2, '0');

/** "Casa Speranța" + the viewer's local date and time → "Casa-Speranta_2026-10-22_14-05.xlsx". */
export function exportFileName(name: string, now: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
  const slug =
    name
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^A-Za-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40) || 'organisation';
  return `${slug}_${get('year')}-${get('month')}-${get('day')}_${get('hour')}-${get('minute')}.xlsx`;
}

export async function exportOrg(
  db: Db,
  orgId: number,
  userId: number,
  locale: Locale,
  today: IsoDate,
  timeZone: string,
): Promise<{ fileName: string; bytes: Uint8Array }> {
  await requireCan(db, orgId, userId, 'org.manage');
  requireKey();
  const [page, people, mealTimes, menus, drivers, staff, identities, licences] = await Promise.all([
    orgPage(db, orgId, userId),
    listPeople(db, orgId, userId),
    listMealTimes(db, orgId, userId),
    allMenus(db, orgId, userId),
    listDrivers(db, orgId, userId),
    listStaff(db, orgId, userId),
    identitiesOf(db, orgId),
    licencesOf(db, orgId),
  ]);
  const routes = await db.query<{
    day: string;
    driver: string;
    position: number;
    first_name: string;
    last_name: string;
    delivered: number;
  }>(
    `SELECT DATE_FORMAT(s.day, '%Y-%m-%d') AS day, d.name AS driver, s.position,
            p.first_name, p.last_name, s.delivered_at IS NOT NULL AS delivered
       FROM canteen_route_stops s
       JOIN canteen_drivers d ON d.id = s.driver_id
       JOIN canteen_people p ON p.id = s.person_id
      WHERE s.org_id = ? ORDER BY s.day, d.name, s.position`,
    [orgId],
  );
  const sheets = buildSheets(
    {
      name: page.name,
      description: page.description,
      people,
      mealTimes,
      menus,
      drivers,
      staff: staff.map((s) => ({ name: s.name, role: s.roles.join(',') })),
      routes: routes.map((r) => ({
        day: r.day,
        driver: r.driver,
        position: num(r.position) + 1,
        person: `${r.last_name} ${r.first_name}`,
        delivered: num(r.delivered) === 1,
      })),
      identities: Object.fromEntries(identities),
      licences: Object.fromEntries(licences),
    },
    locale,
    today,
  );
  // Whose personal numbers left in the file, in the access log like any other showing.
  for (const [personId, id] of identities) {
    if (id.cnp || id.idSeries || id.idNumber || id.idExpiresOn) {
      await log(db, orgId, personId, userId, 'identity.export');
    }
  }
  return { fileName: exportFileName(page.name, new Date(), timeZone), bytes: writeXlsx(sheets) };
}

/** Every person's personal numbers, opened from their encryption. */
async function identitiesOf(db: Db, orgId: number): Promise<Map<number, TransferIdentity>> {
  const rows = await db.query<{
    id: number;
    id_series: string | null;
    id_number_sealed: string | null;
    cnp_sealed: string | null;
    id_expires_on: string | null;
  }>(
    `SELECT id, id_series, id_number_sealed, cnp_sealed,
            DATE_FORMAT(id_expires_on, '%Y-%m-%d') AS id_expires_on
       FROM canteen_people WHERE org_id = ?`,
    [orgId],
  );
  return new Map(
    rows.map((r) => [
      num(r.id),
      {
        cnp: openText(r.cnp_sealed),
        idSeries: r.id_series,
        idNumber: openText(r.id_number_sealed),
        idExpiresOn: r.id_expires_on,
      },
    ]),
  );
}

/** Every driver's licence expiry and number (the picture stays out of the file). */
async function licencesOf(
  db: Db,
  orgId: number,
): Promise<Map<number, { expiresOn: string; number: string | null }>> {
  const rows = await db.query<{
    driver_id: number;
    expires_on: string;
    number_sealed: string | null;
  }>(
    `SELECT l.driver_id, DATE_FORMAT(l.expires_on, '%Y-%m-%d') AS expires_on, l.number_sealed
       FROM canteen_driver_licences l JOIN canteen_drivers d ON d.id = l.driver_id
      WHERE d.org_id = ?`,
    [orgId],
  );
  return new Map(
    rows.map((r) => [
      num(r.driver_id),
      { expiresOn: r.expires_on, number: openText(r.number_sealed) },
    ]),
  );
}

const sameIdentity = (a: TransferIdentity | undefined, b: IdentityInput) =>
  (a?.cnp ?? null) === b.cnp &&
  (a?.idSeries ?? null) === b.idSeries &&
  (a?.idNumber ?? null) === b.idNumber &&
  (a?.idExpiresOn ?? null) === b.idExpiresOn;

// ---------------------------------------------------------------------------------------------
// Re-upload

export interface ImportResult {
  updated: number;
  added: number;
}

type Change =
  | { kind: 'org'; name: string; description: string | null }
  | {
      kind: 'person';
      id: number | null;
      input: PersonInput;
      /** The personal numbers when they changed (files from before 0.16.0 have no columns). */
      identity: IdentityInput | null;
    }
  | { kind: 'mealTime'; id: number | null; name: string; startsMin: number; endsMin: number }
  | {
      kind: 'menu';
      day: IsoDate;
      meal: string;
      dishes: string;
      variants: Partial<Record<Diet, string>>;
    }
  | {
      kind: 'driver';
      id: number | null;
      name: string;
      phone: string | null;
      weekdays: number[];
      shiftFromMin: number;
      shiftToMin: number;
      active: boolean;
      /** The licence's new expiry and number, when the expiry cell is filled and changed. */
      licence: { expiresOn: IsoDate; number: string | null } | null;
    };

interface Known {
  people: Set<number>;
  mealTimes: Set<number>;
  drivers: Set<number>;
  identities: Map<number, TransferIdentity>;
  licences: Map<number, { expiresOn: string; number: string | null }>;
}

const rowId = (value: string, known: Set<number>): number | null => {
  if (!value) return null;
  const id = Number(value);
  if (!Number.isSafeInteger(id) || !known.has(id)) throw new HttpError(400, 'importUnknownId');
  return id;
};

function time(value: string): number {
  const t = parseTime(cellTime(value));
  if (t === null) throw new HttpError(400, 'importTime');
  return t;
}

/**
 * A driver row's licence cells: ignored while the expiry cell is empty; refused for a driver
 * without an uploaded licence (the picture is what was checked); an expiry that changed must
 * not be in the past.
 */
function licenceOf(
  v: Record<string, string>,
  before: { expiresOn: string; number: string | null } | undefined,
  today: IsoDate,
): { expiresOn: IsoDate; number: string | null } | null {
  if (!v.licenceExpiresOn) return null;
  const expiresOn = cellDate(v.licenceExpiresOn);
  if (!isIsoDate(expiresOn)) throw new HttpError(400, 'date', { field: 'licenceExpiry' });
  const number =
    optionalText(v.licenceNumber, 'licenceNumber', 20)?.replace(/\s/g, '').toUpperCase() ?? null;
  if (!before) throw new HttpError(400, 'importNoLicence');
  if (before.expiresOn === expiresOn && before.number === number) return null;
  if (before.expiresOn !== expiresOn && expiresOn < today) {
    throw new HttpError(400, 'licenceExpired');
  }
  return { expiresOn, number };
}

/** Turns the sheets into changes, refusing the first wrong row (with its sheet and row). */
function changesOf(sheets: ParsedSheet[], known: Known, today: IsoDate, locale: Locale): Change[] {
  const t = translator(locale);
  const changes: Change[] = [];
  for (const sheet of sheets) {
    for (const { row, values: v } of sheet.rows) {
      try {
        switch (sheet.id) {
          case 'org':
            changes.push({
              kind: 'org',
              name: requiredText(v.name, 'orgName', LIMITS.orgName),
              description: longOptionalText(v.description, 'description', 2000),
            });
            break;
          case 'people': {
            const id = rowId(v.id ?? '', known.people);
            let identity: IdentityInput | null = null;
            if (v.cnp !== undefined) {
              const input = identityInput({
                cnp: v.cnp,
                idSeries: v.idSeries,
                idNumber: v.idNumber,
                idExpiresOn: v.idExpiresOn ? cellDate(v.idExpiresOn) : null,
              });
              const before = id === null ? undefined : known.identities.get(id);
              if (!sameIdentity(before, input)) identity = input;
            }
            changes.push({
              kind: 'person',
              id,
              identity,
              input: personInput(
                {
                  ...v,
                  birthDate: v.birthDate ? cellDate(v.birthDate) : null,
                  kind: kindCode(v.kind ?? ''),
                  status: statusCode(v.status ?? ''),
                  diet: dietCode(v.diet ?? ''),
                  deliveryDays: cellDays(v.deliveryDays ?? ''),
                  windowFrom: cellTime(v.windowFrom ?? ''),
                  windowTo: cellTime(v.windowTo ?? ''),
                },
                today,
              ),
            });
            break;
          }
          case 'mealTimes': {
            const startsMin = time(v.starts ?? '');
            const endsMin = time(v.ends ?? '');
            if (endsMin <= startsMin) throw new HttpError(400, 'mealTimeRange');
            changes.push({
              kind: 'mealTime',
              id: rowId(v.id ?? '', known.mealTimes),
              name: requiredText(v.name, 'mealName', 40),
              startsMin,
              endsMin,
            });
            break;
          }
          case 'menus': {
            const day = cellDate(v.day ?? '');
            if (!isIsoDate(day)) throw new HttpError(400, 'date', { field: 'day' });
            const variants: Partial<Record<Diet, string>> = {};
            for (const diet of DIETS) {
              const text = checkDishes(v[`variant_${diet}`] ?? '');
              if (text && diet !== 'normal') variants[diet] = text;
            }
            changes.push({
              kind: 'menu',
              day,
              meal: requiredText(v.meal, 'mealName', 80),
              dishes: checkDishes(v.dishes ?? ''),
              variants,
            });
            break;
          }
          case 'drivers': {
            const shiftFromMin = time(v.shiftFrom ?? '');
            const shiftToMin = time(v.shiftTo ?? '');
            if (shiftToMin <= shiftFromMin) throw new HttpError(400, 'shiftRange');
            const id = rowId(v.id ?? '', known.drivers);
            changes.push({
              kind: 'driver',
              id,
              licence: licenceOf(v, id === null ? undefined : known.licences.get(id), today),
              name: requiredText(v.name, 'driverName', LIMITS.displayName),
              phone: optionalText(v.phone, 'phone', LIMITS.phone),
              weekdays: weekdays(cellDays(v.weekdays ?? '')),
              shiftFromMin,
              shiftToMin,
              active: v.active === undefined || v.active === '' ? true : isYes(v.active),
            });
            break;
          }
        }
      } catch (err) {
        if (!(err instanceof HttpError)) throw err;
        const { field, ...rest } = err.params;
        const values = field === undefined ? rest : { ...rest, field: t(`fields.${field}`) };
        throw new HttpError(400, 'importRow', {
          sheet: sheet.label,
          row,
          problem: t(`errors.${err.key}`, values),
        });
      }
    }
  }
  return changes;
}

/** Applies an uploaded workbook to the organisation; nothing changes when a row is wrong. */
export async function importOrg(
  db: PluginDatabase,
  orgId: number,
  userId: number,
  bytes: Uint8Array,
  today: IsoDate,
  locale: Locale,
): Promise<ImportResult> {
  await requireCan(db, orgId, userId, 'org.manage');
  let sheets: ParsedSheet[];
  try {
    sheets = parseSheets(readXlsx(bytes));
  } catch {
    throw new HttpError(400, 'importFile');
  }
  if (sheets.length === 0) throw new HttpError(400, 'importFile');

  const ids = async (table: 'canteen_people' | 'canteen_meal_times' | 'canteen_drivers') =>
    new Set(
      // sql-safe: table — one of the three fixed table names of the type; the id is a ? param.
      (await db.query<{ id: number }>(`SELECT id FROM ${table} WHERE org_id = ?`, [orgId])).map(
        (r) => num(r.id),
      ),
    );
  requireKey();
  const known: Known = {
    people: await ids('canteen_people'),
    mealTimes: await ids('canteen_meal_times'),
    drivers: await ids('canteen_drivers'),
    identities: await identitiesOf(db, orgId),
    licences: await licencesOf(db, orgId),
  };
  const changes = changesOf(sheets, known, today, locale);
  const t = translator(locale);

  // Meal times after the upload, to resolve menus by name and check that none overlap.
  const current = await listMealTimes(db, orgId, userId);
  const finalTimes: MealTime[] = current.map((m) => ({ ...m }));
  let next = -1;
  for (const c of changes) {
    if (c.kind !== 'mealTime') continue;
    const target = c.id === null ? undefined : finalTimes.find((m) => m.id === c.id);
    if (target) Object.assign(target, { name: c.name, startsMin: c.startsMin, endsMin: c.endsMin });
    else finalTimes.push({ id: next--, name: c.name, startsMin: c.startsMin, endsMin: c.endsMin });
  }
  const clash = mealTimeClash(finalTimes);
  if (clash)
    throw new HttpError(400, 'mealTimeOverlap', { name: `${clash[0].name} / ${clash[1].name}` });
  for (const c of changes) {
    if (c.kind === 'menu' && mealOf(c.meal, finalTimes) === null) {
      throw new HttpError(400, 'importMeal', { meal: c.meal, delivered: t('meals.delivered') });
    }
  }

  return db.transaction(async (tx) => {
    const result: ImportResult = { updated: 0, added: 0 };
    const count = (id: number | null) => (id === null ? result.added++ : result.updated++);
    const newTimeIds = new Map<number, number>();
    let placeholder = -1;
    for (const c of changes) {
      if (c.kind === 'org') {
        await tx.execute('UPDATE canteen_orgs SET name = ?, description = ? WHERE id = ?', [
          c.name,
          c.description,
          orgId,
        ]);
        result.updated++;
      } else if (c.kind === 'mealTime') {
        if (c.id !== null) {
          await tx.execute(
            'UPDATE canteen_meal_times SET name = ?, starts_min = ?, ends_min = ? WHERE id = ? AND org_id = ?',
            [c.name, c.startsMin, c.endsMin, c.id, orgId],
          );
        } else {
          const res = await tx.execute(
            'INSERT INTO canteen_meal_times (org_id, name, starts_min, ends_min) VALUES (?, ?, ?, ?)',
            [orgId, c.name, c.startsMin, c.endsMin],
          );
          newTimeIds.set(placeholder--, res.insertId);
        }
        count(c.id);
      }
    }
    for (const c of changes) {
      if (c.kind === 'person') {
        const p = c.input;
        const values = [
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
        let personId = c.id;
        if (personId !== null) {
          await tx.execute(
            `UPDATE canteen_people SET first_name = ?, last_name = ?, birth_date = ?, kind = ?,
               status = ?, address = ?, phone = ?, contact_name = ?, contact_phone = ?, diet = ?,
               allergies = ?, observation = ?, window_from_min = ?, window_to_min = ?
             WHERE id = ? AND org_id = ?`,
            [...values, personId, orgId],
          );
        } else {
          const res = await tx.execute(
            `INSERT INTO canteen_people (first_name, last_name, birth_date, kind, status, address,
               phone, contact_name, contact_phone, diet, allergies, observation, window_from_min,
               window_to_min, org_id, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [...values, orgId, userId],
          );
          personId = res.insertId;
        }
        if (c.identity) {
          const id = c.identity;
          await tx.execute(
            `UPDATE canteen_people SET id_series = ?, id_number_sealed = ?, cnp_sealed = ?,
               id_expires_on = ? WHERE id = ? AND org_id = ?`,
            [
              id.idSeries,
              id.idNumber ? sealText(id.idNumber) : null,
              id.cnp ? sealText(id.cnp) : null,
              id.idExpiresOn,
              personId,
              orgId,
            ],
          );
          await log(tx, orgId, personId, userId, 'identity.edit');
        }
        await tx.execute('DELETE FROM canteen_delivery_days WHERE person_id = ?', [personId]);
        for (const day of p.deliveryDays) {
          await tx.execute('INSERT INTO canteen_delivery_days (person_id, weekday) VALUES (?, ?)', [
            personId,
            day,
          ]);
        }
        count(c.id);
      } else if (c.kind === 'driver') {
        const values = [
          c.name,
          c.phone,
          c.weekdays.join(','),
          c.shiftFromMin,
          c.shiftToMin,
          c.active ? 1 : 0,
        ];
        if (c.id !== null) {
          await tx.execute(
            `UPDATE canteen_drivers SET name = ?, phone = ?, weekdays = ?, shift_from_min = ?,
               shift_to_min = ?, active = ? WHERE id = ? AND org_id = ?`,
            [...values, c.id, orgId],
          );
          if (c.licence) {
            await tx.execute(
              'UPDATE canteen_driver_licences SET expires_on = ?, number_sealed = ? WHERE driver_id = ?',
              [c.licence.expiresOn, c.licence.number ? sealText(c.licence.number) : null, c.id],
            );
          }
        } else {
          await tx.execute(
            `INSERT INTO canteen_drivers (name, phone, weekdays, shift_from_min, shift_to_min,
               active, org_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [...values, orgId],
          );
        }
        count(c.id);
      } else if (c.kind === 'menu') {
        const resolved = mealOf(c.meal, finalTimes)!;
        const meal = resolved < 0 ? newTimeIds.get(resolved)! : resolved;
        if (!c.dishes) {
          await tx.execute(
            'DELETE FROM canteen_menus WHERE org_id = ? AND day = ? AND meal_time_id = ?',
            [orgId, c.day, meal],
          );
          result.updated++;
          continue;
        }
        await tx.execute(
          `INSERT INTO canteen_menus (org_id, day, meal_time_id, dishes, updated_by) VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE dishes = VALUES(dishes), updated_by = VALUES(updated_by)`,
          [orgId, c.day, meal, c.dishes, userId],
        );
        const [menu] = await tx.query<{ id: number }>(
          'SELECT id FROM canteen_menus WHERE org_id = ? AND day = ? AND meal_time_id = ?',
          [orgId, c.day, meal],
        );
        await tx.execute('DELETE FROM canteen_menu_variants WHERE menu_id = ?', [menu!.id]);
        for (const [diet, dishes] of Object.entries(c.variants)) {
          await tx.execute(
            'INSERT INTO canteen_menu_variants (menu_id, diet, dishes) VALUES (?, ?, ?)',
            [menu!.id, diet, dishes],
          );
        }
        result.updated++;
      }
    }
    return result;
  });
}
