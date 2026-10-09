import { randomInt } from 'node:crypto';
import type { PluginDatabase, PluginPeople, PluginUser } from '@devquake/plugin-sdk';
import { countryName, formatAddress, type AddressParts } from './address';
import { HttpError } from './http';
import { newInviteCode, type PaymentMethod } from './model';
import type { OverviewBill } from './overview';
import { splitUtility, type BillSplit, type SplitBill } from './split';
import type { BillInput, PaymentInput, ProfileInput, ReadingInput, UtilityInput } from './validate';

/**
 * Data access for the utilities plugin, on its OWN database (ctx.db, ADR 0007). Visibility rule:
 * a person sees only utilities they are a member of (utility_members), and everything below
 * them (bills, files, readings, photos, payments, comments). Every function checks that first.
 */

export { HttpError };

type Db = Omit<PluginDatabase, 'transaction'>;

const MONTH = (col: string, as: string) => `DATE_FORMAT(${col}, '%Y-%m') AS ${as}`;
const DAY = (col: string, as: string) => `DATE_FORMAT(${col}, '%Y-%m-%d') AS ${as}`;
const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));

// ---------------------------------------------------------------------------------------------
// Profiles

export interface Profile {
  fullName: string;
  /** The whole address on one line (as saved, country in English). */
  address: string;
  /** The address in parts; null for profiles saved before migration 0002 (to be completed). */
  parts: AddressParts | null;
}

interface AddressRow {
  address: string | null;
  country_code: string | null;
  state: string | null;
  city: string | null;
  street: string | null;
  house_number: string | null;
  apartment: string | null;
}

const ADDRESS_COLUMNS =
  'p.address, p.country_code, p.state, p.city, p.street, p.house_number, p.apartment';

function addressParts(r: AddressRow): AddressParts | null {
  if (!r.country_code || !r.state || !r.city || !r.street || !r.house_number) return null;
  return {
    countryCode: r.country_code,
    state: r.state,
    city: r.city,
    street: r.street,
    houseNumber: r.house_number,
    apartment: r.apartment,
  };
}

export async function getProfile(db: Db, userId: number): Promise<Profile | null> {
  const [row] = await db.query<AddressRow & { full_name: string }>(
    `SELECT p.full_name, ${ADDRESS_COLUMNS} FROM profiles p WHERE p.user_id = ?`,
    [userId],
  );
  return row
    ? { fullName: row.full_name, address: row.address ?? '', parts: addressParts(row) }
    : null;
}

/** A profile is complete once the address is saved in parts (required to use the app). */
export async function hasCompleteProfile(db: Db, userId: number): Promise<boolean> {
  return (await getProfile(db, userId))?.parts != null;
}

export async function saveProfile(db: Db, userId: number, input: ProfileInput) {
  const a = input.address;
  const line = formatAddress(a, countryName(a.countryCode, 'en-GB'));
  await db.execute(
    `INSERT INTO profiles (user_id, full_name, address, country_code, state, city, street, house_number, apartment)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), address = VALUES(address),
         country_code = VALUES(country_code), state = VALUES(state), city = VALUES(city),
         street = VALUES(street), house_number = VALUES(house_number),
         apartment = VALUES(apartment)`,
    [
      userId,
      input.fullName,
      line,
      a.countryCode,
      a.state,
      a.city,
      a.street,
      a.houseNumber,
      a.apartment,
    ],
  );
}

// ---------------------------------------------------------------------------------------------
// Utilities and membership

export interface UtilityRow {
  id: number;
  name: string;
  category: string;
  provider: string | null;
  unit: string | null;
  currency: string;
  meterRequired: boolean;
  ownerId: number;
  role: 'owner' | 'member';
}

export async function membership(
  db: Db,
  utilityId: number,
  userId: number,
): Promise<UtilityRow | null> {
  const [row] = await db.query<{
    id: number;
    name: string;
    category: string;
    provider: string | null;
    unit: string | null;
    currency: string;
    meter_required: number;
    owner_user_id: number;
    role: 'owner' | 'member';
  }>(
    `SELECT u.id, u.name, u.category, u.provider, u.unit, u.currency, u.meter_required,
            u.owner_user_id, m.role
       FROM utilities u JOIN utility_members m ON m.utility_id = u.id
      WHERE u.id = ? AND m.user_id = ?`,
    [utilityId, userId],
  );
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    provider: row.provider,
    unit: row.unit,
    currency: row.currency,
    meterRequired: Number(row.meter_required) === 1,
    ownerId: Number(row.owner_user_id),
    role: row.role,
  };
}

export async function requireMember(db: Db, utilityId: number, userId: number) {
  const row = await membership(db, utilityId, userId);
  if (!row) throw new HttpError(404, 'utilityNotFound');
  return row;
}

export async function requireOwner(db: Db, utilityId: number, userId: number) {
  const row = await requireMember(db, utilityId, userId);
  if (row.role !== 'owner') throw new HttpError(403, 'ownerOnly');
  return row;
}

/** Keeps the member's display name in sync with their DevQuake profile. */
export async function refreshMemberName(db: Db, user: PluginUser) {
  await db.execute(
    'UPDATE utility_members SET display_name = ? WHERE user_id = ? AND display_name <> ?',
    [user.displayName, user.id, user.displayName],
  );
}

export async function createUtility(db: PluginDatabase, user: PluginUser, input: UtilityInput) {
  return db.transaction(async (tx) => {
    const { insertId } = await tx.execute(
      `INSERT INTO utilities (owner_user_id, name, category, provider, unit, currency, meter_required)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        user.id,
        input.name,
        input.category,
        input.provider,
        input.unit,
        input.currency,
        input.meterRequired ? 1 : 0,
      ],
    );
    await tx.execute(
      "INSERT INTO utility_members (utility_id, user_id, role, display_name) VALUES (?, ?, 'owner', ?)",
      [insertId, user.id, user.displayName],
    );
    return insertId;
  });
}

export async function updateUtility(
  db: Db,
  utilityId: number,
  userId: number,
  input: UtilityInput,
) {
  await requireOwner(db, utilityId, userId);
  await db.execute(
    `UPDATE utilities SET name = ?, category = ?, provider = ?, unit = ?, currency = ?,
            meter_required = ? WHERE id = ?`,
    [
      input.name,
      input.category,
      input.provider,
      input.unit,
      input.currency,
      input.meterRequired ? 1 : 0,
      utilityId,
    ],
  );
}

/** Deletes the utility for everyone, with its bills, PDFs, readings, photos and comments. */
export async function deleteUtility(db: Db, utilityId: number, userId: number) {
  await requireOwner(db, utilityId, userId);
  await db.execute('DELETE FROM utilities WHERE id = ?', [utilityId]);
}

export interface Member {
  userId: number;
  displayName: string;
  role: 'owner' | 'member';
  /** Sees the utility and its bills but does not share them (a family member). */
  viewOnly: boolean;
  /** From the member's profile in this app (shown to the people they share with). */
  fullName: string | null;
  /** The whole address as saved (older profiles have only this). */
  address: string | null;
  /** The address in parts, to write it in the reader's language. */
  parts: AddressParts | null;
}

export async function membersOf(db: Db, utilityId: number): Promise<Member[]> {
  const rows = await db.query<
    AddressRow & {
      user_id: number;
      display_name: string;
      role: 'owner' | 'member';
      view_only: number;
      full_name: string | null;
    }
  >(
    `SELECT m.user_id, m.display_name, m.role, m.view_only, p.full_name, ${ADDRESS_COLUMNS}
       FROM utility_members m LEFT JOIN profiles p ON p.user_id = m.user_id
      WHERE m.utility_id = ? ORDER BY m.role = 'owner' DESC, m.joined_at, m.user_id`,
    [utilityId],
  );
  return rows.map((r) => ({
    userId: Number(r.user_id),
    displayName: r.display_name,
    role: r.role,
    viewOnly: Number(r.view_only) === 1,
    fullName: r.full_name,
    address: r.address,
    parts: addressParts(r),
  }));
}

// ---------------------------------------------------------------------------------------------
// Bills of a utility, and their splits

export interface BillRecord {
  id: number;
  utilityId: number;
  period: string;
  dueOn: string | null;
  total: number;
  consumption: number | null;
  unitPrice: number | null;
  providerPaid: boolean;
  note: string | null;
  fileName: string | null;
  participants: { userId: number; displayName: string }[];
  readings: Map<number, ReadingRecord>;
  payments: Map<number, PaymentRecord>;
}

export interface ReadingRecord {
  previousIndex: number | null;
  currentIndex: number | null;
  consumption: number;
  /** Photo version (upload time), null without a photo. */
  photoVersion: number | null;
}

export interface PaymentRecord {
  amount: number;
  method: PaymentMethod;
  receivedOn: string | null;
}

/** Every bill of the given utilities (oldest first) with participants, readings and payments. */
async function loadBills(db: Db, utilityIds: number[]): Promise<BillRecord[]> {
  if (utilityIds.length === 0) return [];
  const marks = utilityIds.map(() => '?').join(', ');
  const bills = await db.query<{
    id: number;
    utility_id: number;
    period: string;
    due_on: string | null;
    total: string | number;
    consumption: string | number | null;
    unit_price: string | number | null;
    provider_paid: number;
    note: string | null;
    file_name: string | null;
  }>(
    `SELECT b.id, b.utility_id, ${MONTH('b.period', 'period')}, ${DAY('b.due_on', 'due_on')},
            b.total, b.consumption, b.unit_price, b.provider_paid, b.note, f.file_name
       FROM bills b LEFT JOIN bill_files f ON f.bill_id = b.id
      WHERE b.utility_id IN (${marks})
      ORDER BY b.period, b.id`,
    utilityIds,
  );
  if (bills.length === 0) return [];
  const billIds = bills.map((b) => b.id);
  const billMarks = billIds.map(() => '?').join(', ');
  const [participants, readings, payments] = await Promise.all([
    db.query<{ bill_id: number; user_id: number; display_name: string }>(
      `SELECT bill_id, user_id, display_name FROM bill_participants
        WHERE bill_id IN (${billMarks}) ORDER BY bill_id, user_id`,
      billIds,
    ),
    db.query<{
      bill_id: number;
      user_id: number;
      previous_index: string | number | null;
      current_index: string | number | null;
      consumption: string | number;
      photo_v: string | number | null;
    }>(
      `SELECT r.bill_id, r.user_id, r.previous_index, r.current_index, r.consumption,
              UNIX_TIMESTAMP(p.updated_at) AS photo_v
         FROM readings r
         LEFT JOIN reading_photos p ON p.bill_id = r.bill_id AND p.user_id = r.user_id
        WHERE r.bill_id IN (${billMarks})`,
      billIds,
    ),
    db.query<{
      bill_id: number;
      user_id: number;
      amount: string | number;
      method: PaymentMethod;
      received_on: string | null;
    }>(
      `SELECT bill_id, user_id, amount, method, ${DAY('received_on', 'received_on')}
         FROM payments WHERE bill_id IN (${billMarks})`,
      billIds,
    ),
  ]);
  const byId = new Map<number, BillRecord>();
  const records = bills.map((b): BillRecord => {
    const record: BillRecord = {
      id: b.id,
      utilityId: b.utility_id,
      period: b.period,
      dueOn: b.due_on,
      total: Number(b.total),
      consumption: num(b.consumption),
      unitPrice: num(b.unit_price),
      providerPaid: Number(b.provider_paid) === 1,
      note: b.note,
      fileName: b.file_name,
      participants: [],
      readings: new Map(),
      payments: new Map(),
    };
    byId.set(b.id, record);
    return record;
  });
  for (const p of participants) {
    byId
      .get(p.bill_id)
      ?.participants.push({ userId: Number(p.user_id), displayName: p.display_name });
  }
  for (const r of readings) {
    byId.get(r.bill_id)?.readings.set(Number(r.user_id), {
      previousIndex: num(r.previous_index),
      currentIndex: num(r.current_index),
      consumption: Number(r.consumption),
      photoVersion: num(r.photo_v),
    });
  }
  for (const p of payments) {
    byId.get(p.bill_id)?.payments.set(Number(p.user_id), {
      amount: Number(p.amount),
      method: p.method,
      receivedOn: p.received_on,
    });
  }
  return records;
}

/** Owner first, then the others by name, so tables always look the same. */
function orderParticipants(bill: BillRecord, ownerId: number) {
  return [...bill.participants].sort(
    (a, b) =>
      Number(b.userId === ownerId) - Number(a.userId === ownerId) ||
      a.displayName.localeCompare(b.displayName),
  );
}

function toSplitBill(bill: BillRecord, ownerId: number): SplitBill {
  return {
    id: bill.id,
    total: bill.total,
    consumption: bill.consumption,
    unitPrice: bill.unitPrice,
    providerPaid: bill.providerPaid,
    participants: orderParticipants(bill, ownerId).map((p) => ({
      ...p,
      consumption: bill.readings.get(p.userId)?.consumption ?? null,
    })),
    payments: new Map([...bill.payments].map(([userId, p]) => [userId, p.amount])),
  };
}

export interface UtilityBills {
  utility: UtilityRow;
  bills: BillRecord[];
  splits: Map<number, BillSplit>;
}

/** A utility's bills with their splits (carry-over computed across all of them). */
export async function utilityBills(
  db: Db,
  utilityId: number,
  userId: number,
): Promise<UtilityBills> {
  const utility = await requireMember(db, utilityId, userId);
  const bills = await loadBills(db, [utilityId]);
  const splits = splitUtility(
    bills.map((b) => toSplitBill(b, utility.ownerId)),
    utility.ownerId,
    utility.meterRequired,
  );
  return { utility, bills, splits };
}

export interface UtilitySummary {
  id: number;
  name: string;
  category: string;
  provider: string | null;
  unit: string | null;
  currency: string;
  meterRequired: boolean;
  role: 'owner' | 'member';
  ownerName: string;
  members: number;
  bills: number;
  /** Bills not fully paid yet, or waiting for readings. */
  openBills: number;
  latest: { id: number; period: string; total: number; status: BillSplit['status'] } | null;
  /** Bills where the signed-in user still has to send a meter reading. */
  myMissingReadings: number;
  /** What the signed-in user still owes the owner (members), or is still owed (owner). */
  outstanding: number;
}

/**
 * Everything the signed-in user shares: their utilities with a summary each, and their own part
 * of every bill (calendar and statistics).
 */
export async function overviewForUser(
  db: Db,
  userId: number,
): Promise<{ utilities: UtilitySummary[]; bills: OverviewBill[] }> {
  const utilities = await db.query<{
    id: number;
    name: string;
    category: string;
    provider: string | null;
    unit: string | null;
    currency: string;
    meter_required: number;
    owner_user_id: number;
    role: 'owner' | 'member';
    owner_name: string | null;
    members: number | string;
  }>(
    `SELECT u.id, u.name, u.category, u.provider, u.unit, u.currency, u.meter_required,
            u.owner_user_id, m.role,
            (SELECT o.display_name FROM utility_members o
              WHERE o.utility_id = u.id AND o.role = 'owner' LIMIT 1) AS owner_name,
            (SELECT COUNT(*) FROM utility_members x WHERE x.utility_id = u.id) AS members
       FROM utilities u JOIN utility_members m ON m.utility_id = u.id AND m.user_id = ?
      ORDER BY u.name, u.id`,
    [userId],
  );
  const bills = await loadBills(
    db,
    utilities.map((u) => u.id),
  );
  const summaries: UtilitySummary[] = [];
  const overview: OverviewBill[] = [];
  for (const u of utilities) {
    const ownerId = Number(u.owner_user_id);
    const meterMode = Number(u.meter_required) === 1;
    const own = bills.filter((b) => b.utilityId === u.id);
    const splits = splitUtility(
      own.map((b) => toSplitBill(b, ownerId)),
      ownerId,
      meterMode,
    );
    let openBills = 0;
    let myMissingReadings = 0;
    let outstanding = 0;
    for (const bill of own) {
      const split = splits.get(bill.id)!;
      if (split.status !== 'paid') openBills++;
      const mine = split.lines.find((l) => l.userId === userId);
      if (!mine) continue; // joined after this bill
      if (meterMode && mine.consumption === null) myMissingReadings++;
      if (ownerId === userId) outstanding += split.outstanding;
      else if (mine.due !== null) outstanding += Math.max(0, mine.due - (mine.paid ?? 0));
      const alone = split.lines.length === 1;
      overview.push({
        billId: bill.id,
        utilityId: u.id,
        utilityName: u.name,
        category: u.category,
        currency: u.currency,
        unit: u.unit,
        period: bill.period,
        dueOn: bill.dueOn,
        total: bill.total,
        consumption: bill.consumption,
        unitPrice: split.unitPrice,
        status: split.status,
        isOwner: mine.isOwner,
        myConsumption: mine.consumption ?? (alone ? bill.consumption : null),
        myShare: mine.share,
        myPaid: mine.isOwner ? (bill.providerPaid ? (mine.share ?? 0) : 0) : (mine.paid ?? 0),
      });
    }
    const latest = own[own.length - 1];
    summaries.push({
      id: u.id,
      name: u.name,
      category: u.category,
      provider: u.provider,
      unit: u.unit,
      currency: u.currency,
      meterRequired: meterMode,
      role: u.role,
      ownerName: u.owner_name ?? '',
      members: Number(u.members),
      bills: own.length,
      openBills,
      latest: latest
        ? {
            id: latest.id,
            period: latest.period,
            total: latest.total,
            status: splits.get(latest.id)!.status,
          }
        : null,
      myMissingReadings,
      outstanding: Math.round(outstanding * 100) / 100,
    });
  }
  return { utilities: summaries, bills: overview };
}

// ---------------------------------------------------------------------------------------------
// One bill

export interface BillContext {
  utility: UtilityRow;
  bill: BillRecord;
  split: BillSplit;
  /** The bill before this one (for "previous index" defaults), if any. */
  previous: BillRecord | null;
}

/** The bill's utility id, only when the user is a member of it (404 otherwise). */
async function utilityOfBill(db: Db, billId: number, userId: number): Promise<number> {
  const [row] = await db.query<{ utility_id: number }>(
    `SELECT b.utility_id FROM bills b
       JOIN utility_members m ON m.utility_id = b.utility_id AND m.user_id = ?
      WHERE b.id = ?`,
    [userId, billId],
  );
  if (!row) throw new HttpError(404, 'billNotFound');
  return row.utility_id;
}

export async function billContext(db: Db, billId: number, userId: number): Promise<BillContext> {
  const utilityId = await utilityOfBill(db, billId, userId);
  const { utility, bills, splits } = await utilityBills(db, utilityId, userId);
  const index = bills.findIndex((b) => b.id === billId);
  if (index < 0) throw new HttpError(404, 'billNotFound');
  return {
    utility,
    bill: bills[index]!,
    split: splits.get(billId)!,
    previous: index > 0 ? bills[index - 1]! : null,
  };
}

/**
 * The index a participant's meter showed at the end of the previous bill they sent a reading
 * for (the default "previous index" of their next reading).
 */
export async function lastIndex(
  db: Db,
  utilityId: number,
  userId: number,
  beforeBillId: number,
): Promise<number | null> {
  const [row] = await db.query<{ current_index: string | number | null }>(
    `SELECT r.current_index FROM readings r JOIN bills b ON b.id = r.bill_id
      WHERE b.utility_id = ? AND r.user_id = ? AND r.current_index IS NOT NULL
        AND (b.period, b.id) < (SELECT period, id FROM bills WHERE id = ?)
      ORDER BY b.period DESC, b.id DESC LIMIT 1`,
    [utilityId, userId, beforeBillId],
  );
  return num(row?.current_index);
}

export async function createBill(
  db: PluginDatabase,
  utilityId: number,
  user: PluginUser,
  input: BillInput,
): Promise<number> {
  await requireOwner(db, utilityId, user.id);
  return db.transaction(async (tx) => {
    const { insertId } = await tx.execute(
      `INSERT INTO bills (utility_id, period, due_on, total, consumption, unit_price, provider_paid, note, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        utilityId,
        `${input.period}-01`,
        input.dueOn,
        input.total,
        input.consumption,
        input.unitPrice,
        input.providerPaid ? 1 : 0,
        input.note,
        user.id,
      ],
    );
    // Everyone on the utility now shares the bill.
    await tx.execute(
      `INSERT INTO bill_participants (bill_id, user_id, display_name)
       SELECT ?, user_id, display_name FROM utility_members
        WHERE utility_id = ? AND view_only = 0`,
      [insertId, utilityId],
    );
    return insertId;
  });
}

export async function updateBill(db: Db, billId: number, userId: number, input: BillInput) {
  const utilityId = await utilityOfBill(db, billId, userId);
  await requireOwner(db, utilityId, userId);
  await db.execute(
    `UPDATE bills SET period = ?, due_on = ?, total = ?, consumption = ?, unit_price = ?,
            provider_paid = ?, note = ? WHERE id = ?`,
    [
      `${input.period}-01`,
      input.dueOn,
      input.total,
      input.consumption,
      input.unitPrice,
      input.providerPaid ? 1 : 0,
      input.note,
      billId,
    ],
  );
}

/** The owner deletes a bill, with its PDF, readings, photos, payments and comments. */
export async function deleteBill(db: Db, billId: number, userId: number): Promise<number> {
  const utilityId = await utilityOfBill(db, billId, userId);
  await requireOwner(db, utilityId, userId);
  await db.execute('DELETE FROM bills WHERE id = ?', [billId]);
  return utilityId;
}

// Provider PDF

export async function saveBillFile(
  db: Db,
  billId: number,
  userId: number,
  fileName: string,
  data: Uint8Array,
) {
  const utilityId = await utilityOfBill(db, billId, userId);
  await requireOwner(db, utilityId, userId);
  await db.execute(
    `INSERT INTO bill_files (bill_id, file_name, data, bytes, uploaded_by) VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE file_name = VALUES(file_name), data = VALUES(data),
         bytes = VALUES(bytes), uploaded_by = VALUES(uploaded_by)`,
    [billId, fileName, Buffer.from(data), data.byteLength, userId],
  );
}

export async function readBillFile(db: Db, billId: number, userId: number) {
  await utilityOfBill(db, billId, userId);
  const [row] = await db.query<{ file_name: string; data: Buffer }>(
    'SELECT file_name, data FROM bill_files WHERE bill_id = ?',
    [billId],
  );
  if (!row) throw new HttpError(404, 'fileNotFound');
  return { fileName: row.file_name, data: row.data };
}

export async function deleteBillFile(db: Db, billId: number, userId: number) {
  const utilityId = await utilityOfBill(db, billId, userId);
  await requireOwner(db, utilityId, userId);
  await db.execute('DELETE FROM bill_files WHERE bill_id = ?', [billId]);
}

// Readings: each participant sends their own; the owner may enter anyone's.

async function requireReadingAccess(db: Db, billId: number, user: PluginUser, targetId: number) {
  const utilityId = await utilityOfBill(db, billId, user.id);
  const utility = await requireMember(db, utilityId, user.id);
  if (targetId !== user.id && utility.role !== 'owner') throw new HttpError(403, 'ownReadingOnly');
  const [participant] = await db.query<{ user_id: number }>(
    'SELECT user_id FROM bill_participants WHERE bill_id = ? AND user_id = ?',
    [billId, targetId],
  );
  if (!participant) throw new HttpError(404, 'notParticipant');
  return utility;
}

export async function saveReading(
  db: Db,
  billId: number,
  user: PluginUser,
  targetId: number,
  input: ReadingInput,
) {
  const utility = await requireReadingAccess(db, billId, user, targetId);
  if (utility.meterRequired) {
    const [photo] = await db.query<{ n: number }>(
      'SELECT 1 AS n FROM reading_photos WHERE bill_id = ? AND user_id = ?',
      [billId, targetId],
    );
    if (!photo) throw new HttpError(400, 'photoRequired');
  }
  await db.execute(
    `INSERT INTO readings (bill_id, user_id, previous_index, current_index, consumption, entered_by)
     VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE previous_index = VALUES(previous_index),
         current_index = VALUES(current_index), consumption = VALUES(consumption),
         entered_by = VALUES(entered_by)`,
    [billId, targetId, input.previousIndex, input.currentIndex, input.consumption, user.id],
  );
}

export async function deleteReading(db: Db, billId: number, user: PluginUser, targetId: number) {
  await requireReadingAccess(db, billId, user, targetId);
  await db.execute('DELETE FROM readings WHERE bill_id = ? AND user_id = ?', [billId, targetId]);
  await db.execute('DELETE FROM reading_photos WHERE bill_id = ? AND user_id = ?', [
    billId,
    targetId,
  ]);
}

export async function saveReadingPhoto(
  db: Db,
  billId: number,
  user: PluginUser,
  targetId: number,
  mime: string,
  data: Uint8Array,
  /** The small version (ADR 0040); none from older pages. */
  thumb: { mime: string | null; data: Uint8Array | null } = { mime: null, data: null },
) {
  await requireReadingAccess(db, billId, user, targetId);
  await db.execute(
    `INSERT INTO reading_photos (bill_id, user_id, mime, data, bytes, thumb_mime, thumb)
     VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE mime = VALUES(mime), data = VALUES(data), bytes = VALUES(bytes),
         thumb_mime = VALUES(thumb_mime), thumb = VALUES(thumb)`,
    [
      billId,
      targetId,
      mime,
      Buffer.from(data),
      data.byteLength,
      thumb.mime,
      thumb.data ? Buffer.from(thumb.data) : null,
    ],
  );
}

/** Everyone on the utility may look at the meter photos (to check the readings). */
export async function readReadingPhoto(
  db: Db,
  billId: number,
  userId: number,
  targetId: number,
  thumb = false,
) {
  await utilityOfBill(db, billId, userId);
  // The small version when asked for and stored (ADR 0040); the photo otherwise.
  const [row] = await db.query<{ mime: string; data: Buffer }>(
    `SELECT IF(? AND thumb IS NOT NULL, thumb_mime, mime) AS mime,
            IF(? AND thumb IS NOT NULL, thumb, data) AS data
       FROM reading_photos WHERE bill_id = ? AND user_id = ?`,
    [thumb ? 1 : 0, thumb ? 1 : 0, billId, targetId],
  );
  if (!row) throw new HttpError(404, 'photoNotFound');
  return row;
}

// Payments: recorded by the owner.

async function requirePaymentAccess(db: Db, billId: number, userId: number, targetId: number) {
  const utilityId = await utilityOfBill(db, billId, userId);
  const utility = await requireOwner(db, utilityId, userId);
  if (targetId === utility.ownerId) throw new HttpError(400, 'ownerPaysProvider');
  const [participant] = await db.query<{ user_id: number }>(
    'SELECT user_id FROM bill_participants WHERE bill_id = ? AND user_id = ?',
    [billId, targetId],
  );
  if (!participant) throw new HttpError(404, 'notParticipant');
}

/**
 * The manager confirms what a participant paid. A confirmed payment is locked: only a DevQuake
 * administrator (who manages the utility) can change or delete it. Confirming queues the
 * confirmation email to the person who paid (sent by the scheduled job, platform.ts).
 */
export async function savePayment(
  db: Db,
  billId: number,
  user: PluginUser,
  targetId: number,
  input: PaymentInput,
) {
  await requirePaymentAccess(db, billId, user.id, targetId);
  const [existing] = await db.query<{ n: number }>(
    'SELECT 1 AS n FROM payments WHERE bill_id = ? AND user_id = ?',
    [billId, targetId],
  );
  if (existing && !user.isAdmin) throw new HttpError(409, 'paymentLocked');
  await db.execute(
    `INSERT INTO payments (bill_id, user_id, amount, method, received_on, confirmed_by, email_sent_at)
     VALUES (?, ?, ?, ?, ?, ?, NULL)
       ON DUPLICATE KEY UPDATE amount = VALUES(amount), method = VALUES(method),
         received_on = VALUES(received_on), confirmed_by = VALUES(confirmed_by),
         email_sent_at = NULL`,
    [billId, targetId, input.amount, input.method, input.receivedOn, user.id],
  );
}

/** Only a DevQuake administrator (who manages the utility) can delete a confirmed payment. */
export async function deletePayment(db: Db, billId: number, user: PluginUser, targetId: number) {
  await requirePaymentAccess(db, billId, user.id, targetId);
  if (!user.isAdmin) throw new HttpError(403, 'paymentLocked');
  await db.execute('DELETE FROM payments WHERE bill_id = ? AND user_id = ?', [billId, targetId]);
}

export async function setProviderPaid(db: Db, billId: number, userId: number, paid: boolean) {
  const utilityId = await utilityOfBill(db, billId, userId);
  await requireOwner(db, utilityId, userId);
  await db.execute('UPDATE bills SET provider_paid = ? WHERE id = ?', [paid ? 1 : 0, billId]);
}

// Comments

export interface Comment {
  id: number;
  userId: number;
  userName: string;
  body: string;
  /** ISO time in UTC; shown in the viewer's time zone. */
  at: string;
}

export async function commentsOf(db: Db, billId: number, userId: number): Promise<Comment[]> {
  await utilityOfBill(db, billId, userId);
  const rows = await db.query<{
    id: number;
    user_id: number;
    user_name: string;
    body: string;
    at: string;
  }>(
    `SELECT id, user_id, user_name, body, DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%sZ') AS at
       FROM bill_comments WHERE bill_id = ? ORDER BY id`,
    [billId],
  );
  return rows.map((r) => ({
    id: r.id,
    userId: Number(r.user_id),
    userName: r.user_name,
    body: r.body,
    at: r.at,
  }));
}

export async function addComment(db: Db, billId: number, user: PluginUser, body: string) {
  await utilityOfBill(db, billId, user.id);
  const { insertId } = await db.execute(
    'INSERT INTO bill_comments (bill_id, user_id, user_name, body) VALUES (?, ?, ?, ?)',
    [billId, user.id, user.displayName, body],
  );
  return insertId;
}

/** Authors delete their own comments; the owner may delete any on their bills. */
export async function deleteComment(db: Db, billId: number, commentId: number, userId: number) {
  const utilityId = await utilityOfBill(db, billId, userId);
  const utility = await requireMember(db, utilityId, userId);
  const { affectedRows } = await db.execute(
    `DELETE FROM bill_comments WHERE id = ? AND bill_id = ? AND (user_id = ? OR ?)`,
    [commentId, billId, userId, utility.role === 'owner' ? 1 : 0],
  );
  if (affectedRows === 0) throw new HttpError(404, 'commentNotFound');
}

// ---------------------------------------------------------------------------------------------
// Sharing: invite codes and the referral network

export async function activeInvite(db: Db, utilityId: number, createdBy: number): Promise<string> {
  const [existing] = await db.query<{ code: string }>(
    'SELECT code FROM utility_invites WHERE utility_id = ? AND revoked_at IS NULL ORDER BY id DESC LIMIT 1',
    [utilityId],
  );
  if (existing) return existing.code;
  return rotateInvite(db, utilityId, createdBy);
}

/** Revokes every code of the utility and issues a new one (old links stop working). */
export async function rotateInvite(db: Db, utilityId: number, createdBy: number): Promise<string> {
  await db.execute(
    'UPDATE utility_invites SET revoked_at = UTC_TIMESTAMP() WHERE utility_id = ? AND revoked_at IS NULL',
    [utilityId],
  );
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = newInviteCode(randomInt);
    try {
      await db.execute(
        'INSERT INTO utility_invites (utility_id, code, created_by) VALUES (?, ?, ?)',
        [utilityId, code, createdBy],
      );
      return code;
    } catch (err) {
      if ((err as { code?: string }).code !== 'ER_DUP_ENTRY') throw err;
    }
  }
  throw new Error('Could not create an invite code');
}

export async function utilityByInvite(db: Db, code: string) {
  const [row] = await db.query<{
    id: number;
    name: string;
    category: string;
    owner: string | null;
    members: number | string;
  }>(
    `SELECT u.id, u.name, u.category,
            (SELECT display_name FROM utility_members WHERE utility_id = u.id AND role = 'owner' LIMIT 1) AS owner,
            (SELECT COUNT(*) FROM utility_members WHERE utility_id = u.id) AS members
       FROM utility_invites i JOIN utilities u ON u.id = i.utility_id
      WHERE i.code = ? AND i.revoked_at IS NULL`,
    [code],
  );
  return row ? { ...row, members: Number(row.members) } : null;
}

/**
 * Adds a member: they share every bill from `fromMonth` ("YYYY-MM", the month they join in)
 * onwards, not the older ones. Returns false when they were already a member.
 */
async function addMember(
  db: Db,
  utilityId: number,
  person: { id: number; displayName: string },
  fromMonth: string,
): Promise<boolean> {
  const { affectedRows } = await db.execute(
    "INSERT IGNORE INTO utility_members (utility_id, user_id, role, display_name) VALUES (?, ?, 'member', ?)",
    [utilityId, person.id, person.displayName],
  );
  if (affectedRows === 0) return false;
  await db.execute(
    `INSERT IGNORE INTO bill_participants (bill_id, user_id, display_name)
     SELECT id, ?, ? FROM bills WHERE utility_id = ? AND period >= ?`,
    [person.id, person.displayName, utilityId, `${fromMonth}-01`],
  );
  return true;
}

/** Joins the utility behind an invite code; returns its id. Joining twice is harmless. */
export async function joinByInvite(db: Db, code: string, user: PluginUser, fromMonth: string) {
  const utility = await utilityByInvite(db, code);
  if (!utility) throw new HttpError(404, 'inviteInvalid');
  await addMember(db, utility.id, user, fromMonth);
  return utility.id;
}

/** The owner adds someone from their DevQuake referral network directly. */
export async function addReferralMember(
  db: Db,
  utilityId: number,
  user: PluginUser,
  people: PluginPeople | undefined,
  personId: number,
  fromMonth: string,
) {
  await requireOwner(db, utilityId, user.id);
  const person = (await people?.referrals())?.find((p) => p.id === personId);
  if (!person) throw new HttpError(403, 'referralOnly');
  const added = await addMember(db, utilityId, person, fromMonth);
  return { added, hasAccess: person.hasAccess };
}

/**
 * The owner removes a member, or a member leaves. They stay on bills where they already sent a
 * reading or paid something (history stays correct), and are taken off the others.
 */
export async function removeMember(db: Db, utilityId: number, user: PluginUser, memberId: number) {
  const me = await requireMember(db, utilityId, user.id);
  if (memberId === user.id) {
    if (me.role === 'owner') throw new HttpError(400, 'ownerCannotLeave');
  } else if (me.role !== 'owner') {
    throw new HttpError(403, 'ownerRemoves');
  }
  const { affectedRows } = await db.execute(
    "DELETE FROM utility_members WHERE utility_id = ? AND user_id = ? AND role = 'member'",
    [utilityId, memberId],
  );
  if (affectedRows === 0) throw new HttpError(404, 'memberNotFound');
  await db.execute(
    `DELETE bp FROM bill_participants bp JOIN bills b ON b.id = bp.bill_id
      WHERE b.utility_id = ? AND bp.user_id = ?
        AND NOT EXISTS (SELECT 1 FROM readings r WHERE r.bill_id = bp.bill_id AND r.user_id = bp.user_id)
        AND NOT EXISTS (SELECT 1 FROM payments p WHERE p.bill_id = bp.bill_id AND p.user_id = bp.user_id)`,
    [utilityId, memberId],
  );
}

/**
 * The manager marks a member as view-only (a family member: sees everything, pays nothing) or
 * as sharing the bills again. View-only: they leave the bills where they have no reading and no
 * payment yet (older, settled bills keep them). Sharing again: they join the bills from
 * `fromMonth` ("YYYY-MM") on.
 */
export async function setMemberViewOnly(
  db: Db,
  utilityId: number,
  user: PluginUser,
  memberId: number,
  viewOnly: boolean,
  fromMonth: string,
) {
  await requireOwner(db, utilityId, user.id);
  const { affectedRows } = await db.execute(
    "UPDATE utility_members SET view_only = ? WHERE utility_id = ? AND user_id = ? AND role = 'member'",
    [viewOnly ? 1 : 0, utilityId, memberId],
  );
  if (affectedRows === 0) throw new HttpError(404, 'memberNotFound');
  if (viewOnly) {
    await db.execute(
      `DELETE bp FROM bill_participants bp JOIN bills b ON b.id = bp.bill_id
        WHERE b.utility_id = ? AND bp.user_id = ?
          AND NOT EXISTS (SELECT 1 FROM readings r WHERE r.bill_id = bp.bill_id AND r.user_id = bp.user_id)
          AND NOT EXISTS (SELECT 1 FROM payments p WHERE p.bill_id = bp.bill_id AND p.user_id = bp.user_id)`,
      [utilityId, memberId],
    );
  } else {
    await db.execute(
      `INSERT IGNORE INTO bill_participants (bill_id, user_id, display_name)
       SELECT b.id, m.user_id, m.display_name FROM bills b
         JOIN utility_members m ON m.utility_id = b.utility_id AND m.user_id = ?
        WHERE b.utility_id = ? AND b.period >= ?`,
      [memberId, utilityId, `${fromMonth}-01`],
    );
  }
}

export interface PaymentEmail {
  billId: number;
  userId: number;
  utilityName: string;
  category: string;
  currency: string;
  unit: string | null;
  period: string;
  total: number;
  billConsumption: number | null;
  unitPrice: number | null;
  consumption: number | null;
  share: number | null;
  carry: number;
  due: number | null;
  paid: number;
  difference: number | null;
  method: PaymentMethod;
  hasPdf: boolean;
}

/**
 * Confirmed payments whose email is still to send (at most `limit`), with everything the email
 * shows: the bill, and the person's consumption, share, carry-over, amount due and paid. Marks
 * them as sent first, so an email goes out once even with several server processes.
 */
export async function takePaymentEmails(db: Db, limit: number): Promise<PaymentEmail[]> {
  const pending = await db.query<{ bill_id: number; user_id: number; utility_id: number }>(
    `SELECT p.bill_id, p.user_id, b.utility_id FROM payments p JOIN bills b ON b.id = p.bill_id
      WHERE p.email_sent_at IS NULL ORDER BY p.updated_at LIMIT ${Math.max(1, Math.min(limit, 100))}`,
  );
  const emails: PaymentEmail[] = [];
  for (const row of pending) {
    const { affectedRows } = await db.execute(
      'UPDATE payments SET email_sent_at = UTC_TIMESTAMP() WHERE bill_id = ? AND user_id = ? AND email_sent_at IS NULL',
      [row.bill_id, row.user_id],
    );
    if (affectedRows === 0) continue; // another process took it
    const [utility] = await db.query<{
      name: string;
      category: string;
      currency: string;
      unit: string | null;
      meter_required: number;
      owner_user_id: number;
    }>(
      'SELECT name, category, currency, unit, meter_required, owner_user_id FROM utilities WHERE id = ?',
      [row.utility_id],
    );
    if (!utility) continue;
    const ownerId = Number(utility.owner_user_id);
    const bills = await loadBills(db, [row.utility_id]);
    const splits = splitUtility(
      bills.map((b) => toSplitBill(b, ownerId)),
      ownerId,
      Number(utility.meter_required) === 1,
    );
    const bill = bills.find((b) => b.id === row.bill_id);
    const line = splits.get(row.bill_id)?.lines.find((l) => l.userId === Number(row.user_id));
    const payment = bill?.payments.get(Number(row.user_id));
    if (!bill || !line || !payment) continue;
    emails.push({
      billId: bill.id,
      userId: Number(row.user_id),
      utilityName: utility.name,
      category: utility.category,
      currency: utility.currency,
      unit: utility.unit,
      period: bill.period,
      total: bill.total,
      billConsumption: bill.consumption,
      unitPrice: splits.get(bill.id)!.unitPrice,
      consumption: line.consumption,
      share: line.share,
      carry: line.carry,
      due: line.due,
      paid: payment.amount,
      difference: line.difference,
      method: payment.method,
      hasPdf: bill.fileName !== null,
    });
  }
  return emails;
}
