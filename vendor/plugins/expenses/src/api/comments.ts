import { api } from '../lib/api';
import { addComment, expenseById, requireMember } from '../lib/data';
import { HttpError } from '../lib/http';
import { LIMITS } from '../lib/model';
import { commenters, expenseMembers, memberName, notifyMembers } from '../lib/notify';
import { id, longOptionalText, readBody } from '../lib/validate';

// POST /api/groups/:id/expenses/:expenseId/comments { body }. The expense's payer, the people in
// its split and earlier commenters are told (ADR 0084).
export const POST = api(async ({ request, params, db, user, push }) => {
  const body = longOptionalText((await readBody(request)).body, 'comment', LIMITS.comment);
  if (!body) throw new HttpError(400, 'required', { field: 'comment' });
  const groupId = id(params.id);
  const expenseId = id(params.expenseId);
  await addComment(db, groupId, expenseId, user.id, body);
  const me = await requireMember(db, groupId, user.id);
  const expense = await expenseById(db, groupId, expenseId);
  if (!expense) return;
  await notifyMembers(
    { db, push, groupId, actorMemberId: me.memberId },
    [...(await expenseMembers(db, expenseId)), ...(await commenters(db, expenseId))],
    'comment_added',
    [await memberName(db, me.memberId), expense.title],
    `expense:${groupId}:${expenseId}`,
  );
});
