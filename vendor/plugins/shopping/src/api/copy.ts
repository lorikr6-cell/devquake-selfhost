import { api } from '../lib/api';
import { listsForUser } from '../lib/data';
import { isIsoDate } from '../lib/dates';
import { HttpError } from '../lib/http';
import { copyList } from '../lib/mutations';
import {
  MAX_COPIES,
  listTargets,
  monthToYear,
  weekToMonth,
  type Copy,
  type ListScope,
} from '../lib/replicate';
import { id, readBody } from '../lib/validate';

// POST /api/copy: copies shopping lists to other days (the "Copy lists" form).
//   { mode: 'list', listId, scope: 'day' | 'week' | 'month', date }  one list
//   { mode: 'week', date }                                          that week → the month's weeks
//   { mode: 'month', month: 'YYYY-MM' }                             that month → the year's months
// Answers { created, skipped } (skipped: already there with the same name and day).
export const POST = api(async ({ request, db, user }) => {
  const body = await readBody(request);
  let copies: Copy[];
  if (body.mode === 'list') {
    const listId = id(body.listId);
    const scope = body.scope as ListScope;
    if (!['day', 'week', 'month'].includes(scope) || !isIsoDate(body.date)) {
      throw new HttpError(400, 'date');
    }
    const source = (await listsForUser(db, user.id)).find((l) => l.id === listId);
    if (!source) throw new HttpError(404, 'listNotFound');
    copies = listTargets(source.shopDate, scope, body.date).map((date) => ({ listId, date }));
  } else if (body.mode === 'week') {
    if (!isIsoDate(body.date)) throw new HttpError(400, 'date');
    copies = weekToMonth(await listsForUser(db, user.id), body.date);
  } else if (body.mode === 'month') {
    const month = typeof body.month === 'string' ? body.month : '';
    if (!isIsoDate(`${month}-01`)) throw new HttpError(400, 'date');
    copies = monthToYear(await listsForUser(db, user.id), month);
  } else {
    throw new HttpError(400, 'invalidRequest');
  }
  if (copies.length === 0) throw new HttpError(400, 'nothingToCopy');
  if (copies.length > MAX_COPIES) throw new HttpError(400, 'tooManyCopies', { max: MAX_COPIES });
  let created = 0;
  for (const copy of copies) {
    if ((await copyList(db, copy.listId, copy.date, user)) !== null) created++;
  }
  return { created, skipped: copies.length - created };
});
