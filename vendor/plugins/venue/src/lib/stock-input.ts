import { HttpError } from './http';
import { NAME_MAX } from './model';
import { isUnit, parseQty, type Unit } from './stock';

/** An ingredient's fields from a request body (name, unit, daily and weekly level). */
export function ingredientInput(body: Record<string, unknown>): {
  name: string;
  unit: Unit;
  dailyTarget: number;
  weeklyTarget: number;
} {
  const name = String(body.name ?? '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!name) throw new HttpError(400, 'required', { field: 'name' });
  if (name.length > NAME_MAX) throw new HttpError(400, 'tooLong', { field: 'name', max: NAME_MAX });
  if (!isUnit(body.unit)) throw new HttpError(400, 'unit');
  const daily = parseQty(body.dailyTarget ?? 0);
  const weekly = parseQty(body.weeklyTarget ?? 0);
  if (daily === null || weekly === null) throw new HttpError(400, 'qty');
  return { name, unit: body.unit, dailyTarget: daily, weeklyTarget: weekly };
}
