import { cookies } from 'next/headers';
import type { PluginPageProps } from '@devquake/plugin-sdk';
import { GuestCall } from '../components/guest-call';
import { TableView } from '../components/table-view';
import { TabletStaff } from '../components/tablet-staff';
import { localeOf, translator } from '../i18n';
import { TABLE_CODE } from '../lib/bill';
import { billView } from '../lib/bill-view';
import { menuOf, venueById } from '../lib/data';
import { lastCallOfTable, waiterFor } from '../lib/calls';
import { openBill, openBillOfTable, staffList, tableByCode } from '../lib/floor';
import { floorActor } from '../lib/floor-api';
import { TABLET_COOKIE } from '../lib/secure';
import { DesignedMenu } from './public-menu';

export async function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('appName'), robots: { index: false, follow: false } };
}

/**
 * A table's sticker (/t/:code): on the venue's own staff device (the owner signed in, or an
 * enabled tablet) the table's order; for anyone else the venue's menu (when it is public).
 */
export default async function TablePage({ ctx, params }: PluginPageProps) {
  const t = translator(localeOf(ctx));
  const code = params.code ?? '';
  const table = ctx.db && TABLE_CODE.test(code) ? await tableByCode(ctx.db, code) : null;
  if (!ctx.db || !table)
    return (
      <section className="space-y-3">
        <h1 className="font-display text-3xl font-bold">{t('table.goneTitle')}</h1>
        <p>{t('table.goneBody')}</p>
      </section>
    );
  const found = await floorActor(ctx, (await cookies()).get(TABLET_COOKIE)?.value);
  const staffHere = found && found.venue.id === table.venueId;
  if (staffHere && !found.actor)
    return (
      <section className="space-y-4">
        <h1 className="font-display text-3xl font-bold">{table.name}</h1>
        <TabletStaff staff={await staffList(ctx.db, table.venueId)} />
      </section>
    );
  if (!staffHere) {
    const venue = await venueById(ctx.db, table.venueId);
    if (!venue?.menuPublic)
      return (
        <section className="space-y-3">
          <h1 className="font-display text-3xl font-bold">{venue?.name ?? t('appName')}</h1>
          <p>{t('table.askStaff')}</p>
        </section>
      );
    // Guests at the table get its waiter at once (owner's rule: the section's waiter on shift,
    // else the least busy one), and can call them (raise a hand).
    const bill = await openBill(
      ctx.db,
      venue.id,
      table.id,
      t('call.guest'),
      await waiterFor(ctx.db, venue.id, table.id),
    );
    const last = await lastCallOfTable(ctx.db, venue.id, table.id);
    return (
      <>
        <DesignedMenu db={ctx.db} venue={venue} intro={t('table.guestIntro')} t={t} />
        <GuestCall
          code={code}
          waiterName={bill?.waiterName ?? null}
          initial={last ? { status: last.status, at: last.createdAt, by: last.answeredBy } : null}
        />
      </>
    );
  }
  const venue = found.venue;
  const [bill, menu] = await Promise.all([
    openBillOfTable(ctx.db, venue.id, table.id),
    menuOf(ctx.db, venue.id),
  ]);
  const categories = new Map(menu.categories.map((c) => [c.id, c.name]));
  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-bold">
        {table.name}
        <span className="ml-3 text-base font-normal text-ink/60 dark:text-paper/60">
          {found.actor!.name}
        </span>
      </h1>
      <TableView
        table={{ id: table.id, name: table.name }}
        initial={bill ? billView(bill, venue) : null}
        menu={menu.items.map((i) => ({
          id: i.id,
          name: i.name,
          category: categories.get(i.categoryId) ?? '',
          priceMinor: i.priceMinor,
          available: i.available && i.short.length === 0,
          short: i.short,
        }))}
        currency={venue.currency}
        decimals={venue.decimals}
        tips={venue.tips}
        baseUrl={ctx.baseUrl}
      />
    </div>
  );
}
