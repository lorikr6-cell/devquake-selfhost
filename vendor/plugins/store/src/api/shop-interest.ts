import { shopApi } from '../lib/api';
import { HttpError } from '../lib/http';
import { cleanChoices, INTEREST_LIMITS } from '../lib/interest';
import {
  castVote,
  interestEnabled,
  optionsOf,
  voterKey,
  voteState,
  withdrawVote,
} from '../lib/interest-data';
import { productBySlug } from '../lib/data';
import { parseCents } from '../lib/pricing';
import { readBody } from '../lib/validate';

const price = (value: unknown) => {
  if (value === undefined || value === null || value === '') return null;
  const cents = parseCents(value, INTEREST_LIMITS.maxPrice * 100);
  if (cents === null || cents === 0) throw new HttpError(400, 'amount', { field: 'price' });
  return cents;
};

/** The product to vote on and who votes: a DevQuake member or the shop's signed-in buyer. */
async function target(scope: Parameters<Parameters<typeof shopApi>[0]>[0]) {
  const { db, store, params, ctx, buyer } = scope;
  if (!(await interestEnabled(ctx))) throw new HttpError(404, 'productNotFound');
  const product = await productBySlug(db, store.id, params.product ?? '');
  if (!product || !product.published || !product.interest)
    throw new HttpError(404, 'productNotFound');
  const voter = voterKey(ctx.user?.id, ctx.user ? null : (await buyer())?.id);
  if (!voter) throw new HttpError(401, 'voteSignIn');
  return { product, voter };
}

// POST /api/s/:slug/p/:product/interest { interested, priceMin?, priceMax?, choices? }: a vote on
// a product before it is sold (ADR 0060), one per person; voting again changes it.
export const POST = shopApi(
  async (scope) => {
    const { product, voter } = await target(scope);
    const body = await readBody(scope.request, 4096);
    if (typeof body.interested !== 'boolean') throw new HttpError(400, 'invalidRequest');
    const minCents = body.interested ? price(body.priceMin) : null;
    const maxCents = body.interested ? price(body.priceMax) : null;
    const options = await optionsOf(scope.db, scope.store.id, product);
    await castVote(scope.db, scope.store.id, product.id, voter, {
      interested: body.interested,
      minCents: minCents !== null && maxCents !== null ? Math.min(minCents, maxCents) : minCents,
      maxCents: minCents !== null && maxCents !== null ? Math.max(minCents, maxCents) : maxCents,
      choices: body.interested ? cleanChoices(body.choices, options) : {},
    });
    return voteState(scope.db, scope.store.id, product.id, voter);
  },
  { limit: 30, sameSite: true },
);

// DELETE /api/s/:slug/p/:product/interest: takes the vote back.
export const DELETE = shopApi(
  async (scope) => {
    const { product, voter } = await target(scope);
    await withdrawVote(scope.db, scope.store.id, product.id, voter);
    return voteState(scope.db, scope.store.id, product.id, voter);
  },
  { limit: 30, sameSite: true },
);
