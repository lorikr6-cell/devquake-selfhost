import type { PluginPageProps } from '@devquake/plugin-sdk';
import { Link } from '@devquake/ui';
import { VenueForm } from '../components/venue-form';
import { localeOf, translator } from '../i18n';
import { listStaff, listTablets, menuOf, venueOfOwner } from '../lib/data';
import { syncDarts } from '../lib/links';

export async function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('appName') };
}

/** The venue's admin home: setting it up the first time, then the overview with its sections. */
export default async function Home({ ctx }: PluginPageProps) {
  const t = translator(localeOf(ctx));
  if (!ctx.user || !ctx.db)
    return (
      <section className="space-y-3">
        <h1 className="font-display text-3xl font-bold">{t('signIn.title')}</h1>
        <p>{ctx.db || !ctx.user ? t('signIn.body') : t('errors.unavailable')}</p>
        {ctx.user ? null : (
          <a href={`${ctx.hostUrl}/#account`} className="font-medium text-quake underline">
            {t('signIn.link')}
          </a>
        )}
      </section>
    );
  const venue = await venueOfOwner(ctx.db, ctx.user.id);
  if (!venue)
    return (
      <div className="space-y-6">
        <header className="space-y-2">
          <h1 className="font-display text-3xl font-bold">{t('home.setupTitle')}</h1>
          <p className="text-ink/70 dark:text-paper/70">{t('home.setupBody')}</p>
        </header>
        <VenueForm />
      </div>
    );
  // The darts copy for the public menu, refreshed while the owner uses Venue (ADR 0035).
  await syncDarts(ctx.db, venue.id, ctx.links).catch(() => undefined);
  const [menu, staff, tablets] = await Promise.all([
    menuOf(ctx.db, venue.id),
    listStaff(ctx.db, venue.id),
    listTablets(ctx.db, venue.id),
  ]);
  const cards = [
    {
      href: '/menu',
      title: t('nav.menu'),
      body: t('home.menuCount', { count: menu.items.length }),
    },
    { href: '/staff', title: t('nav.staff'), body: t('home.staffCount', { count: staff.length }) },
    {
      href: '/tablets',
      title: t('nav.tablets'),
      body: t('home.tabletCount', { count: tablets.length }),
    },
    {
      href: '/settings',
      title: t('nav.settings'),
      body: `${venue.country} · ${venue.currency} · ${venue.vatRates.map((r) => `${r / 100} %`).join(', ')}`,
    },
  ];
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-bold">{venue.name}</h1>
        <p className="text-sm text-ink/70 dark:text-paper/70">{t('home.adminOnly')}</p>
      </header>
      <ul className="grid gap-4 sm:grid-cols-2">
        {cards.map((c) => (
          <li key={c.href}>
            <Link
              href={c.href}
              className="block rounded-lg border border-ink/10 p-4 hover:border-quake dark:border-paper/10"
            >
              <span className="font-semibold">{c.title}</span>
              <span className="mt-1 block text-sm text-ink/70 dark:text-paper/70">{c.body}</span>
            </Link>
          </li>
        ))}
      </ul>
      <section className="space-y-2 rounded-lg border border-ink/10 p-4 dark:border-paper/10">
        <h2 className="font-semibold">{t('home.publicMenu')}</h2>
        {venue.menuPublic ? (
          <p className="text-sm">
            {t('home.publicMenuOn')}{' '}
            <Link href={`/m/${venue.slug}`} className="font-medium text-quake underline">
              {`${ctx.baseUrl}/m/${venue.slug}`}
            </Link>
          </p>
        ) : (
          <p className="text-sm">{t('home.publicMenuOff')}</p>
        )}
      </section>
      <p className="text-sm text-ink/60 dark:text-paper/60">{t('home.comingNext')}</p>
    </div>
  );
}
