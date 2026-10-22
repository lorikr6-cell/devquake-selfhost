import type { PluginPageProps } from '@devquake/plugin-sdk';
import { LOCALE_TAGS, Link, buttonClass } from '@devquake/ui';
import { orgScope } from '../components/guard';
import { MyLicenceNotice } from '../components/licence';
import { MyRoute } from '../components/my-route';
import { OrgNav } from '../components/org-nav';
import { localeOf, translator } from '../i18n';
import { addDays, isIsoDate } from '../lib/dates';
import { myLicence } from '../lib/licence-data';
import { myRoute, packagesOf } from '../lib/routes-data';

export async function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('orgNav.myRoute') };
}

/** The signed-in driver's route of the day, on their phone. */
export default async function MyRoutePage({ ctx, params, searchParams }: PluginPageProps) {
  const scope = await orgScope(ctx, params, 'route.own');
  if (!scope.ok) return scope.notice;
  const t = translator(scope.locale);
  const asked = (await searchParams).day;
  const day = typeof asked === 'string' && isIsoDate(asked) ? asked : scope.today;
  const [route, packages, me] = await Promise.all([
    myRoute(scope.db, scope.org.id, scope.user.id, day),
    packagesOf(scope.db, scope.org.id, scope.user.id, day),
    myLicence(scope.db, scope.org.id, scope.user.id),
  ]);
  const title = new Date(`${day}T12:00:00Z`).toLocaleDateString(LOCALE_TAGS[scope.locale], {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  });
  const base = `/orgs/${scope.org.id}/my-route`;
  return (
    <>
      <OrgNav
        orgId={scope.org.id}
        orgName={scope.org.name}
        current="myRoute"
        can={scope.can}
        t={t}
      />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold capitalize">{title}</h1>
        <div className="flex gap-2">
          <Link href={`${base}?day=${addDays(day, -1)}`} className={buttonClass('ghost')}>
            ←
          </Link>
          <Link href={base} className={buttonClass('ghost')}>
            {t('kitchen.today')}
          </Link>
          <Link href={`${base}?day=${addDays(day, 1)}`} className={buttonClass('ghost')}>
            →
          </Link>
        </div>
      </div>
      {me ? (
        <MyLicenceNotice
          orgId={scope.org.id}
          driverId={me.driverId}
          driverName={me.name}
          expiresOn={me.licence?.expiresOn ?? null}
          today={scope.today}
        />
      ) : null}
      {route && route.stops.length ? (
        <MyRoute orgId={scope.org.id} day={day} route={route} packages={packages} />
      ) : (
        <p className="text-sm text-ink/70 dark:text-paper/70">{t('myRoute.none')}</p>
      )}
    </>
  );
}
