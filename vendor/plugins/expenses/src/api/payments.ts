import { api } from '../lib/api';
import { createPayment, groupById, requireMember } from '../lib/data';
import { amountText, memberName, notifyMembers } from '../lib/notify';
import { id, paymentInput, readBody } from '../lib/validate';

// POST /api/groups/:id/payments { from, to, amount, paidOn, note }: someone paid someone back.
// The two people it is between are told (ADR 0084), not the one who wrote it down.
export const POST = api(async ({ request, params, db, user, push }) => {
  const groupId = id(params.id);
  const input = paymentInput(await readBody(request));
  const paymentId = await createPayment(db, groupId, user.id, input);
  const me = await requireMember(db, groupId, user.id);
  const group = await groupById(db, groupId);
  await notifyMembers(
    { db, push, groupId, actorMemberId: me.memberId },
    [input.from, input.to],
    'payment_added',
    [
      `${await memberName(db, input.from)} → ${await memberName(db, input.to)}`,
      amountText(input.amount, group!.currency),
    ],
    `group:${groupId}`,
  );
  return { id: paymentId };
});
