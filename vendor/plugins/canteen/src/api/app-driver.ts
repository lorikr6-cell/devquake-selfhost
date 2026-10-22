import { translator } from '../i18n';
import { api } from '../lib/api';
import { orgsOf } from '../lib/data';
import { dishLines } from '../lib/meals';
import { can } from '../lib/roles';
import { licenceState } from '../lib/licence';
import { myLicence } from '../lib/licence-data';
import { myRoute, packagesOf } from '../lib/routes-data';
import { routeDay } from '../lib/validate';

/** Versioned like Workout's app state (ADR 0066): a breaking change gets a new format. */
export const APP_DRIVER_FORMAT = 1;

// GET /api/app/driver?day=YYYY-MM-DD: what the native driver app shows (ADR 0062, signed in
// with the app's device session): for every organisation where the person drives, their route
// of the day in order, with each package's contents in the page language. Ticks and comments go
// to PUT /api/orgs/:id/routes/:day/stops/:personId; map positions to
// GET /api/orgs/:id/my-route/positions?day=.
export const GET = api(async ({ request, db, user, today, locale }) => {
  const day = routeDay(new URL(request.url).searchParams.get('day') ?? today);
  const t = translator(locale);
  const orgs = (await orgsOf(db, user.id)).filter((o) => can(o.role, 'route.own'));
  const routes = [];
  for (const org of orgs) {
    const [route, packages, me] = await Promise.all([
      myRoute(db, org.id, user.id, day),
      packagesOf(db, org.id, user.id, day),
      myLicence(db, org.id, user.id),
    ]);
    const state = licenceState(me?.licence?.expiresOn ?? null, today);
    routes.push({
      orgId: org.id,
      orgName: org.name,
      driver: route?.driver.name ?? null,
      // The driver's licence (format 1 addition, older apps ignore it): missing, soon (within
      // 90 days), expired or ok; the apps show a notice for the first three.
      licence: me
        ? {
            state: state.kind,
            expiresOn: state.kind === 'missing' ? null : state.expiresOn,
            daysLeft: state.kind === 'soon' ? state.daysLeft : null,
          }
        : null,
      stops: (route?.stops ?? []).map((s) => {
        const contents = packages.variants[s.diet] ?? packages.menu;
        return {
          personId: s.id,
          name: s.name,
          address: s.address,
          phone: s.phone,
          observation: s.observation,
          diet: t(`diets.${s.diet}`),
          allergies: s.allergies,
          package: contents ? dishLines(contents).join(' · ') : null,
          etaMin: s.etaMin,
          windowFromMin: s.window.fromMin,
          windowToMin: s.window.toMin,
          deliveredAt: s.deliveredAt,
          deliveryNote: s.deliveryNote,
        };
      }),
    });
  }
  return { format: APP_DRIVER_FORMAT, day, routes };
});
