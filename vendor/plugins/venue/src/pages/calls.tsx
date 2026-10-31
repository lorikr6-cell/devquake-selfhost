import { cookies } from 'next/headers';
import type { PluginPageProps } from '@devquake/plugin-sdk';
import { Link } from '@devquake/ui';
import { CallHistory } from '../components/call-history';
import { TabletStaff } from '../components/tablet-staff';
import { localeOf, translator } from '../i18n';
import { callHistory } from '../lib/calls';
import { staffList } from '../lib/floor';
import { floorActor } from '../lib/floor-api';
import { TABLET_COOKIE } from '../lib/secure';

export async function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('call.historyTitle'), robots: { index: false } };
}

/** The calls of the last 30 days (the notification history): the owner or a tablet's staff. */
export default async function Calls({ ctx }: PluginPageProps) {
  const t = translator(localeOf(ctx));
  const found = await floorActor(ctx, (await cookies()).get(TABLET_COOKIE)?.value);
  if (!found || !ctx.db) return <p>{t('floor.notTablet')}</p>;
  if (!found.actor)
    return (
      <section className="space-y-4">
        <h1 className="font-display text-3xl font-bold">{found.venue.name}</h1>
        <TabletStaff staff={await staffList(ctx.db, found.venue.id)} />
      </section>
    );
  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="font-display text-3xl font-bold">{t('call.historyTitle')}</h1>
        <Link href={found.tabletId !== null ? '/tablet' : '/floor'} className="text-sm underline">
          {t('nav.floor')}
        </Link>
      </header>
      <CallHistory
        calls={await callHistory(ctx.db, found.venue.id)}
        timeZone={ctx.timeZone || 'UTC'}
      />
    </div>
  );
}
