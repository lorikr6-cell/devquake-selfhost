import { api } from '../lib/api';
import { snapshot } from '../lib/data';
import { boughtTotal, listAsExpense } from '../lib/expense-link';
import { HttpError } from '../lib/http';
import { id, readBody } from '../lib/validate';

// POST /api/lists/:id/expense { groupId }: what was bought on the list becomes an expense in a
// Shared expenses group, paid by the visitor, split equally between everyone on the list (link
// point expense.add, ADR 0035). Adding it again changes nothing ({ created: false }).
export const POST = api(async ({ request, params, db, user, links }) => {
  const listId = id(params.id);
  const list = await snapshot(db, listId, user.id);
  const groupId = id((await readBody(request)).groupId);
  const input = listAsExpense({
    groupId,
    listId,
    name: list.name,
    shopDate: list.shopDate,
    currency: list.currency,
    total: boughtTotal(list.items),
    userIds: list.members.map((m) => m.userId),
  });
  if (!input) throw new HttpError(400, 'expenseNothingBought');
  if (!links) throw new HttpError(503, 'expenseLinkFailed');
  const result = await links.call<{ groupId: number; expenseId: number; created: boolean }>(
    'expenses',
    'expense.add',
    input,
  );
  if (!result.ok) {
    const key =
      result.error === 'forbidden'
        ? 'expenseNotEveryone'
        : result.error === 'not-connected'
          ? 'expenseNotConnected'
          : 'expenseLinkFailed';
    throw new HttpError(result.error === 'forbidden' ? 400 : 502, key);
  }
  return {
    created: result.data.created,
    url: links.deepLink(
      'expenses',
      'expense',
      { id: String(result.data.groupId), expenseId: String(result.data.expenseId) },
      { returnTo: `/lists/${listId}` },
    ),
  };
});
