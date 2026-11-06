import type { PluginDatabase, PluginUser } from '@devquake/plugin-sdk';
import type { Locale } from '@devquake/ui';
import { translator } from '../i18n';
import { addGuest, createExpense, createGroup, createPayment } from './data';
import { addDays, type IsoDate } from './dates';
import type { Category } from './model';
import type { SplitMode } from './split';

/**
 * The visitor's demo group, made now unless they have one already; returns its id. A weekend
 * trip with three friends added by name, expenses in every split mode and category, comments
 * and a payment, in the visitor's language. It is an ordinary group otherwise (deletable).
 */
export async function createDemoGroup(
  db: PluginDatabase,
  user: PluginUser,
  today: IsoDate,
  locale: Locale,
): Promise<number> {
  const [mine] = await db.query<{ id: number }>(
    `SELECT g.id FROM expense_groups g
       JOIN group_members m ON m.group_id = g.id AND m.user_id = ? AND m.left_at IS NULL
      WHERE g.is_demo = 1 AND g.owner_user_id = ? ORDER BY g.id LIMIT 1`,
    [user.id, user.id],
  );
  if (mine) return Number(mine.id);
  const t = translator(locale, 'home.demo');
  const groupId = await createGroup(db, user, {
    name: t('group'),
    kind: 'trip',
    currency: 'EUR',
  });
  await db.execute('UPDATE expense_groups SET is_demo = 1 WHERE id = ?', [groupId]);
  const [owner] = await db.query<{ id: number }>(
    'SELECT id FROM group_members WHERE group_id = ? AND user_id = ?',
    [groupId, user.id],
  );
  const me = Number(owner!.id);
  const ana = await addGuest(db, groupId, user.id, 'Ana');
  const mihai = await addGuest(db, groupId, user.id, 'Mihai');
  const lena = await addGuest(db, groupId, user.id, 'Lena');
  const everyone = [me, ana, mihai, lena];

  const expense = (
    item: string,
    amount: number,
    paidBy: number,
    category: Category,
    daysAgo: number,
    splitMode: SplitMode,
    entries: [number, number][],
    note: string | null = null,
  ) =>
    createExpense(db, groupId, user.id, {
      title: t(`items.${item}`),
      amount,
      paidBy,
      splitMode,
      entries: entries.map(([memberId, value]) => ({ memberId, value })),
      category,
      spentOn: addDays(today, -daysAgo),
      note,
    });
  const equal = (ids: number[]): [number, number][] => ids.map((id) => [id, 1]);

  await expense('flights', 480, me, 'transport', 9, 'equal', equal(everyone));
  await expense(
    'apartment',
    360,
    ana,
    'accommodation',
    8,
    'shares',
    [
      [me, 1],
      [ana, 1],
      [mihai, 2],
      [lena, 1],
    ],
    t('note'),
  );
  const dinner = await expense('dinner', 126.4, mihai, 'food', 7, 'exact', [
    [me, 32.5],
    [ana, 28.9],
    [mihai, 35],
    [lena, 30],
  ]);
  await expense('groceries', 54.3, lena, 'groceries', 7, 'percent', [
    [me, 25],
    [ana, 25],
    [mihai, 30],
    [lena, 20],
  ]);
  await expense('taxi', 38, me, 'transport', 7, 'equal', equal([me, ana, mihai]));
  await expense('museum', 60, ana, 'entertainment', 6, 'equal', equal(everyone));
  await expense('gift', 45, me, 'gifts', 6, 'equal', equal([me, ana, mihai]));
  await expense('coffee', 18.6, lena, 'food', 5, 'equal', equal(everyone));

  // A short conversation on the dinner: a friend (by name) and the visitor.
  await db.execute('INSERT INTO expense_comments (expense_id, member_id, body) VALUES (?, ?, ?)', [
    dinner,
    mihai,
    t('comment1'),
  ]);
  await db.execute('INSERT INTO expense_comments (expense_id, member_id, body) VALUES (?, ?, ?)', [
    dinner,
    me,
    t('comment2'),
  ]);
  await createPayment(db, groupId, user.id, {
    from: lena,
    to: me,
    amount: 50,
    paidOn: addDays(today, -2),
    note: t('payment'),
  });
  return groupId;
}
