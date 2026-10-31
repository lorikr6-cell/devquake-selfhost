import { cookies } from 'next/headers';
import type { PluginPageProps } from '@devquake/plugin-sdk';
import { Link } from '@devquake/ui';
import { StationScreen } from '../components/station-screen';
import { TabletStaff } from '../components/tablet-staff';
import { localeOf, translator } from '../i18n';
import { staffList } from '../lib/floor';
import { floorActor } from '../lib/floor-api';
import { TABLET_COOKIE } from '../lib/secure';
import { STATION_SCREENS, isStation, stationTickets } from '../lib/station';

export async function generateMetadata({ ctx, params }: PluginPageProps) {
  const t = translator(localeOf(ctx));
  const s = isStation(params.station) ? params.station : 'kitchen';
  return { title: t(`menu.stations.${s}`), robots: { index: false } };
}

/**
 * A station's screen (/station/kitchen, /bar, /coffee): the owner signed in, or a tablet with a
 * staff member on it (an open route like /tablet; nobody else sees it).
 */
export default async function StationPage({ ctx, params }: PluginPageProps) {
  const t = translator(localeOf(ctx));
  const station = params.station;
  if (!isStation(station)) return <p>{t('station.unknown')}</p>;
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
        <h1 className="font-display text-3xl font-bold">{t(`menu.stations.${station}`)}</h1>
        <nav className="flex flex-wrap gap-3 text-sm">
          {STATION_SCREENS.filter((s) => s !== station).map((s) => (
            <Link key={s} href={`/station/${s}`} className="underline">
              {t(`menu.stations.${s}`)}
            </Link>
          ))}
          <Link href={found.tabletId !== null ? '/tablet' : '/floor'} className="underline">
            {t('nav.floor')}
          </Link>
        </nav>
      </header>
      <StationScreen
        station={station}
        initial={await stationTickets(ctx.db, found.venue.id, station)}
      />
    </div>
  );
}
