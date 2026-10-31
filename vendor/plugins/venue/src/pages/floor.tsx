import { cookies } from 'next/headers';
import type { PluginPageProps } from '@devquake/plugin-sdk';
import { FloorView } from '../components/floor-view';
import { TabletStaff } from '../components/tablet-staff';
import { localeOf, translator } from '../i18n';
import { listTables, staffList } from '../lib/floor';
import { floorActor } from '../lib/floor-api';
import { TABLET_COOKIE } from '../lib/secure';

export async function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('nav.floor'), robots: { index: false } };
}

/**
 * The floor: the owner (signed in) or the staff member on an enabled tablet (/tablet opens the
 * same page without a DevQuake account). Nobody else sees it.
 */
export default async function Floor({ ctx }: PluginPageProps) {
  const t = translator(localeOf(ctx));
  const found = await floorActor(ctx, (await cookies()).get(TABLET_COOKIE)?.value);
  if (!found || !ctx.db)
    return (
      <section className="space-y-3">
        <h1 className="font-display text-3xl font-bold">{t('floor.title')}</h1>
        <p>{t('floor.notTablet')}</p>
      </section>
    );
  if (!found.actor)
    return (
      <section className="space-y-4">
        <h1 className="font-display text-3xl font-bold">{found.venue.name}</h1>
        <TabletStaff staff={await staffList(ctx.db, found.venue.id)} />
      </section>
    );
  const tables = await listTables(ctx.db, found.venue.id);
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold">
        {t('floor.title')} · {found.venue.name}
      </h1>
      <FloorView
        initial={tables.map((x) => ({
          ...x,
          bill: x.bill
            ? {
                id: x.bill.id,
                code: x.bill.code,
                openedBy: x.bill.openedBy,
                pending: x.bill.pending,
                ready: x.bill.ready,
                gross: x.bill.gross,
              }
            : null,
        }))}
        currency={found.venue.currency}
        decimals={found.venue.decimals}
        actorName={found.actor.name}
        onTablet={found.tabletId !== null}
      />
    </div>
  );
}
