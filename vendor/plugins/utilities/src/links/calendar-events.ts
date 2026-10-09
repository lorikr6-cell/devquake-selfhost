import { calendarRange, type PluginLinkHandlerModule } from '@devquake/plugin-sdk';
import { translator } from '../i18n';
import { overviewForUser } from '../lib/data';

/**
 * Link point "calendar.events" (read, ADR 0035): the due dates of the member's bills that are
 * not paid yet, from `from` to `to` (at most 62 days), as all-day items for a connected app's
 * calendar. Only the utility's name leaves the app, no amounts.
 */
const handler: PluginLinkHandlerModule['default'] = async (input, ctx) => {
  if (!ctx.db) return { ok: false, error: 'not-found' };
  const range = calendarRange(input);
  if (!range) return { ok: false, error: 'invalid-input' };
  const t = translator(ctx.locale, 'linkedEvents');
  const { bills } = await overviewForUser(ctx.db, ctx.user.id);
  const events = bills
    .filter((b) => b.status !== 'paid' && b.dueOn && b.dueOn >= range.from && b.dueOn <= range.to)
    .map((b) => ({
      id: String(b.billId),
      title: t('billDue', { name: b.utilityName }),
      day: b.dueOn!,
      startsAt: null,
      target: 'bill',
      params: { id: String(b.billId) },
    }));
  return { ok: true, data: { events } };
};

export default handler;
