import type { PluginContext, PluginDatabase } from '@devquake/plugin-sdk';
import { fieldsOfTypes } from './catalog-data';
import type { Product } from './data';
import {
  interestOptions,
  interestReport,
  type InterestOption,
  type InterestReport,
  type InterestVote,
} from './interest';

// Interest votes (ADR 0060): storing votes, a voter's own vote and the owner's report. SQL with
// ? placeholders only; every query names the store.

type Db = Omit<PluginDatabase, 'transaction'>;
const num = (v: unknown) => Number(v ?? 0);

/** Whether the owner turned on interest votes in /admin-cp (DevQuake only; off elsewhere). */
export async function interestEnabled(ctx: PluginContext): Promise<boolean> {
  return ctx.settings ? ctx.settings.enabled('interestVotes').catch(() => false) : false;
}

/** Who votes: a DevQuake member ('u<id>'), else the shop's signed-in buyer ('b<id>'). */
export function voterKey(userId: number | null | undefined, buyerId: number | null | undefined) {
  if (userId) return `u${userId}`;
  if (buyerId) return `b${buyerId}`;
  return null;
}

const parseChoices = (v: unknown): Record<string, string> => {
  if (typeof v !== 'string' || !v) return {};
  try {
    const o = JSON.parse(v) as unknown;
    return o && typeof o === 'object' && !Array.isArray(o)
      ? Object.fromEntries(
          Object.entries(o as Record<string, unknown>).filter(
            (e): e is [string, string] => typeof e[1] === 'string',
          ),
        )
      : {};
  } catch {
    return {};
  }
};

const toVote = (r: Record<string, unknown>): InterestVote => ({
  interested: Boolean(num(r.interested)),
  minCents: r.min_cents == null ? null : num(r.min_cents),
  maxCents: r.max_cents == null ? null : num(r.max_cents),
  choices: parseChoices(r.choices),
});

/** The options a product offers to vote on (its multi-choice fields). */
export async function optionsOf(
  db: PluginDatabase,
  storeId: number,
  product: Pick<Product, 'typeId' | 'values'>,
): Promise<InterestOption[]> {
  if (!product.typeId) return [];
  const fields = (await fieldsOfTypes(db, storeId, [product.typeId])).get(product.typeId) ?? [];
  return interestOptions(fields, product.values);
}

/** The owner's settings for one product: vote instead of selling, and the costs for the ROI. */
export async function setInterest(
  db: Db,
  storeId: number,
  productId: number,
  input: { on: boolean; unitCents: number | null; setupCents: number | null },
): Promise<boolean> {
  const res = await db.execute(
    'UPDATE products SET interest_only = ?, unit_cost_cents = ?, setup_cost_cents = ? WHERE id = ? AND store_id = ?',
    [input.on ? 1 : 0, input.unitCents, input.setupCents, productId, storeId],
  );
  return res.affectedRows > 0;
}

export async function castVote(
  db: Db,
  storeId: number,
  productId: number,
  voter: string,
  vote: InterestVote,
): Promise<void> {
  await db.execute(
    `INSERT INTO interest_votes (store_id, product_id, voter_key, interested, min_cents, max_cents, choices)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE interested = VALUES(interested), min_cents = VALUES(min_cents),
       max_cents = VALUES(max_cents), choices = VALUES(choices)`,
    [
      storeId,
      productId,
      voter,
      vote.interested ? 1 : 0,
      vote.minCents,
      vote.maxCents,
      Object.keys(vote.choices).length ? JSON.stringify(vote.choices) : null,
    ],
  );
}

export async function withdrawVote(
  db: Db,
  storeId: number,
  productId: number,
  voter: string,
): Promise<void> {
  await db.execute(
    'DELETE FROM interest_votes WHERE store_id = ? AND product_id = ? AND voter_key = ?',
    [storeId, productId, voter],
  );
}

/** A voter's own vote on a product, and how many are interested so far. */
export async function voteState(
  db: Db,
  storeId: number,
  productId: number,
  voter: string | null,
): Promise<{ mine: InterestVote | null; interested: number }> {
  const [count] = await db.query<{ n: number }>(
    'SELECT COUNT(*) AS n FROM interest_votes WHERE store_id = ? AND product_id = ? AND interested = 1',
    [storeId, productId],
  );
  const [mine] = voter
    ? await db.query<Record<string, unknown>>(
        'SELECT * FROM interest_votes WHERE store_id = ? AND product_id = ? AND voter_key = ?',
        [storeId, productId, voter],
      )
    : [];
  return { mine: mine ? toVote(mine) : null, interested: num(count?.n) };
}

export interface InterestRow {
  productId: number;
  name: string;
  published: boolean;
  unitCents: number | null;
  setupCents: number | null;
  report: InterestReport;
}

/** Every product that asks for votes (or has votes), with its report, most interest first. */
export async function interestOverview(
  db: Db,
  storeId: number,
  storeVatRate: number,
): Promise<InterestRow[]> {
  const products = await db.query<Record<string, unknown>>(
    `SELECT p.id, p.name, p.published, p.vat_rate, p.unit_cost_cents, p.setup_cost_cents FROM products p
     WHERE p.store_id = ? AND (p.interest_only = 1 OR EXISTS (SELECT 1 FROM interest_votes iv WHERE iv.product_id = p.id))
     ORDER BY p.position, p.id LIMIT 200`,
    [storeId],
  );
  if (products.length === 0) return [];
  const votes = await db.query<Record<string, unknown>>(
    'SELECT product_id, interested, min_cents, max_cents, choices FROM interest_votes WHERE store_id = ?',
    [storeId],
  );
  return products
    .map((p) => {
      const id = num(p.id);
      const unitCents = p.unit_cost_cents == null ? null : num(p.unit_cost_cents);
      const setupCents = p.setup_cost_cents == null ? null : num(p.setup_cost_cents);
      const vat = p.vat_rate == null ? storeVatRate : num(p.vat_rate);
      return {
        productId: id,
        name: String(p.name),
        published: Boolean(num(p.published)),
        unitCents,
        setupCents,
        report: interestReport(
          votes.filter((v) => num(v.product_id) === id).map(toVote),
          { unitCents, setupCents },
          vat,
        ),
      };
    })
    .sort((a, b) => b.report.interested - a.report.interested);
}

/** A person's votes go with their DevQuake account or their buyer account. */
export async function deleteVotesOf(db: Db, voter: string): Promise<void> {
  await db.execute('DELETE FROM interest_votes WHERE voter_key = ?', [voter]);
}
