import { api } from '../lib/api';
import { HttpError } from '../lib/http';
import { deleteItem, updateItem } from '../lib/mutations';
import {
  id,
  optionalText,
  price,
  quantity,
  readBody,
  requiredText,
  storeRef,
} from '../lib/validate';

// PATCH /api/lists/:id/items/:itemId: any subset of the item's fields, and/or { done } (bought)
// and { dropped } (struck out as not needed).
export const PATCH = api(async ({ request, params, db, user }) => {
  const body = await readBody(request);
  for (const flag of ['done', 'dropped'] as const) {
    if (body[flag] !== undefined && typeof body[flag] !== 'boolean') {
      throw new HttpError(400, 'flag', { field: flag });
    }
  }
  await updateItem(db, id(params.id), id(params.itemId), user, {
    name: body.name === undefined ? undefined : requiredText(body.name, 'itemName', 120),
    quantity: body.quantity === undefined ? undefined : quantity(body.quantity),
    unit: body.unit === undefined ? undefined : requiredText(body.unit, 'unit', 16),
    price: body.price === undefined ? undefined : price(body.price),
    description:
      body.description === undefined
        ? undefined
        : optionalText(body.description, 'description', 255),
    storeId: body.storeId === undefined ? undefined : storeRef(body.storeId),
    done: body.done as boolean | undefined,
    dropped: body.dropped as boolean | undefined,
  });
});

export const DELETE = api(async ({ params, db, user }) => {
  await deleteItem(db, id(params.id), id(params.itemId), user);
});
