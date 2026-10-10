import type { PluginDatabase } from '@devquake/plugin-sdk';
import { FIELD_LIMITS, type FieldDef, type FieldKind } from './fields';
import { HttpError } from './http';

// Product types with their fields, and vendors (ADR 0058). SQL with ? placeholders only; every
// query names the store.

type Db = Omit<PluginDatabase, 'transaction'>;
const num = (v: unknown) => Number(v ?? 0);
const placeholders = (n: number) => Array.from({ length: n }, () => '?').join(',');

// ---------------------------------------------------------------------------------------------
// Product types and fields

export interface ProductType {
  id: number;
  name: string;
  fields: FieldDef[];
  /** Products of this type. */
  products: number;
}

type FieldRow = {
  id: number;
  type_id: number;
  label: string;
  kind: FieldKind;
  unit: string | null;
  choices: string | null;
  required: number;
  in_compare: number;
};

const toField = (r: FieldRow): FieldDef => ({
  id: num(r.id),
  label: r.label,
  kind: r.kind,
  unit: r.unit,
  choices: (r.choices ?? '').split('\n').filter(Boolean),
  required: Boolean(r.required),
  inCompare: Boolean(r.in_compare),
});

export async function listTypes(db: Db, storeId: number): Promise<ProductType[]> {
  const types = await db.query<{ id: number; name: string; products: number | string }>(
    `SELECT t.id, t.name, (SELECT COUNT(*) FROM products p WHERE p.type_id = t.id) AS products
     FROM product_types t WHERE t.store_id = ? ORDER BY t.position, t.name`,
    [storeId],
  );
  if (types.length === 0) return [];
  const fields = await db.query<FieldRow>(
    `SELECT * FROM product_fields WHERE store_id = ? ORDER BY position, id`,
    [storeId],
  );
  return types.map((t) => ({
    id: num(t.id),
    name: t.name,
    products: num(t.products),
    fields: fields.filter((f) => num(f.type_id) === num(t.id)).map(toField),
  }));
}

/** The fields of these types (for product pages and the comparison). */
export async function fieldsOfTypes(
  db: Db,
  storeId: number,
  typeIds: number[],
): Promise<Map<number, FieldDef[]>> {
  const ids = [...new Set(typeIds)];
  if (ids.length === 0) return new Map();
  const rows = await db.query<FieldRow>(
    `SELECT * FROM product_fields WHERE store_id = ? AND type_id IN (${placeholders(ids.length)}) ORDER BY position, id`,
    [storeId, ...ids],
  );
  const out = new Map<number, FieldDef[]>(ids.map((id) => [id, []]));
  for (const r of rows) out.get(num(r.type_id))?.push(toField(r));
  return out;
}

export async function typeName(db: Db, storeId: number, typeId: number): Promise<string | null> {
  const [r] = await db.query<{ name: string }>(
    'SELECT name FROM product_types WHERE id = ? AND store_id = ?',
    [typeId, storeId],
  );
  return r?.name ?? null;
}

export interface FieldInput {
  /** An existing field to keep (its products' values stay); new fields have none. */
  id: number | null;
  label: string;
  kind: FieldKind;
  unit: string | null;
  choices: string[];
  required: boolean;
  inCompare: boolean;
}

async function typeNameTaken(db: Db, storeId: number, name: string, exceptId: number | null) {
  const rows = await db.query<{ id: number }>(
    'SELECT id FROM product_types WHERE store_id = ? AND name = ?',
    [storeId, name],
  );
  return rows.some((r) => num(r.id) !== exceptId);
}

async function writeFields(tx: Db, storeId: number, typeId: number, fields: FieldInput[]) {
  const existing = await tx.query<{ id: number }>(
    'SELECT id FROM product_fields WHERE type_id = ? AND store_id = ?',
    [typeId, storeId],
  );
  const known = new Set(existing.map((r) => num(r.id)));
  const kept = new Set<number>();
  let position = 0;
  for (const f of fields) {
    const values = [
      f.label,
      f.kind,
      f.unit,
      f.choices.length ? f.choices.join('\n') : null,
      f.required ? 1 : 0,
      f.inCompare ? 1 : 0,
      position++,
    ];
    if (f.id !== null && known.has(f.id)) {
      kept.add(f.id);
      await tx.execute(
        `UPDATE product_fields SET label = ?, kind = ?, unit = ?, choices = ?, required = ?, in_compare = ?, position = ?
         WHERE id = ? AND type_id = ?`,
        [...values, f.id, typeId],
      );
    } else {
      await tx.execute(
        `INSERT INTO product_fields (label, kind, unit, choices, required, in_compare, position, type_id, store_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [...values, typeId, storeId],
      );
    }
  }
  const gone = [...known].filter((id) => !kept.has(id));
  if (gone.length > 0) {
    await tx.execute(
      `DELETE FROM product_fields WHERE type_id = ? AND id IN (${placeholders(gone.length)})`,
      [typeId, ...gone],
    );
  }
}

export async function createType(
  db: PluginDatabase,
  storeId: number,
  input: { name: string; fields: FieldInput[] },
): Promise<number> {
  const [{ n } = { n: 0 }] = await db.query<{ n: number }>(
    'SELECT COUNT(*) AS n FROM product_types WHERE store_id = ?',
    [storeId],
  );
  if (num(n) >= FIELD_LIMITS.typesPerStore)
    throw new HttpError(409, 'tooManyTypes', { max: FIELD_LIMITS.typesPerStore });
  if (await typeNameTaken(db, storeId, input.name, null)) throw new HttpError(409, 'typeTaken');
  return db.transaction(async (tx) => {
    const res = await tx.execute(
      'INSERT INTO product_types (store_id, name, position) VALUES (?, ?, ?)',
      [storeId, input.name, num(n)],
    );
    await writeFields(tx, storeId, res.insertId, input.fields);
    return res.insertId;
  });
}

export async function updateType(
  db: PluginDatabase,
  storeId: number,
  typeId: number,
  input: { name: string; fields: FieldInput[] },
): Promise<void> {
  if (await typeNameTaken(db, storeId, input.name, typeId)) throw new HttpError(409, 'typeTaken');
  await db.transaction(async (tx) => {
    const [found] = await tx.query<{ id: number }>(
      'SELECT id FROM product_types WHERE id = ? AND store_id = ? FOR UPDATE',
      [typeId, storeId],
    );
    if (!found) throw new HttpError(404, 'notFound');
    await tx.execute('UPDATE product_types SET name = ? WHERE id = ?', [input.name, typeId]);
    await writeFields(tx, storeId, typeId, input.fields);
  });
}

/** Deletes the type and its fields; its products keep everything else. */
export async function deleteType(db: Db, storeId: number, typeId: number): Promise<void> {
  const res = await db.execute('DELETE FROM product_types WHERE id = ? AND store_id = ?', [
    typeId,
    storeId,
  ]);
  if (res.affectedRows === 0) throw new HttpError(404, 'notFound');
}

// ---------------------------------------------------------------------------------------------
// Vendors

export interface Vendor {
  id: number;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  notes: string | null;
  isBrand: boolean;
  products: number;
}

export type VendorInput = Omit<Vendor, 'id' | 'products'>;

export async function listVendors(db: Db, storeId: number): Promise<Vendor[]> {
  const rows = await db.query<{
    id: number;
    name: string;
    contact_name: string | null;
    email: string | null;
    phone: string | null;
    website: string | null;
    notes: string | null;
    is_brand: number;
    products: number | string;
  }>(
    `SELECT v.*, (SELECT COUNT(*) FROM products p WHERE p.vendor_id = v.id) AS products
     FROM vendors v WHERE v.store_id = ? ORDER BY v.name LIMIT 500`,
    [storeId],
  );
  return rows.map((r) => ({
    id: num(r.id),
    name: r.name,
    contactName: r.contact_name,
    email: r.email,
    phone: r.phone,
    website: r.website,
    notes: r.notes,
    isBrand: Boolean(r.is_brand),
    products: num(r.products),
  }));
}

async function vendorNameTaken(db: Db, storeId: number, name: string, exceptId: number | null) {
  const rows = await db.query<{ id: number }>(
    'SELECT id FROM vendors WHERE store_id = ? AND name = ?',
    [storeId, name],
  );
  return rows.some((r) => num(r.id) !== exceptId);
}

const vendorValues = (v: VendorInput) => [
  v.name,
  v.contactName,
  v.email,
  v.phone,
  v.website,
  v.notes,
  v.isBrand ? 1 : 0,
];

export async function createVendor(db: Db, storeId: number, input: VendorInput): Promise<number> {
  if (await vendorNameTaken(db, storeId, input.name, null)) throw new HttpError(409, 'vendorTaken');
  const res = await db.execute(
    `INSERT INTO vendors (name, contact_name, email, phone, website, notes, is_brand, store_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [...vendorValues(input), storeId],
  );
  return res.insertId;
}

export async function updateVendor(
  db: Db,
  storeId: number,
  vendorId: number,
  input: VendorInput,
): Promise<void> {
  if (await vendorNameTaken(db, storeId, input.name, vendorId))
    throw new HttpError(409, 'vendorTaken');
  const [found] = await db.query<{ id: number }>(
    'SELECT id FROM vendors WHERE id = ? AND store_id = ?',
    [vendorId, storeId],
  );
  if (!found) throw new HttpError(404, 'notFound');
  await db.execute(
    `UPDATE vendors SET name = ?, contact_name = ?, email = ?, phone = ?, website = ?, notes = ?, is_brand = ?
     WHERE id = ? AND store_id = ?`,
    [...vendorValues(input), vendorId, storeId],
  );
}

export async function deleteVendor(db: Db, storeId: number, vendorId: number): Promise<void> {
  const res = await db.execute('DELETE FROM vendors WHERE id = ? AND store_id = ?', [
    vendorId,
    storeId,
  ]);
  if (res.affectedRows === 0) throw new HttpError(404, 'notFound');
}

/** Whether the type and vendor a product names belong to the store (null is always fine). */
export async function checkProductLinks(
  db: Db,
  storeId: number,
  typeId: number | null,
  vendorId: number | null,
): Promise<void> {
  if (typeId !== null) {
    const [t] = await db.query<{ id: number }>(
      'SELECT id FROM product_types WHERE id = ? AND store_id = ?',
      [typeId, storeId],
    );
    if (!t) throw new HttpError(400, 'typeUnknown');
  }
  if (vendorId !== null) {
    const [v] = await db.query<{ id: number }>(
      'SELECT id FROM vendors WHERE id = ? AND store_id = ?',
      [vendorId, storeId],
    );
    if (!v) throw new HttpError(400, 'vendorUnknown');
  }
}
