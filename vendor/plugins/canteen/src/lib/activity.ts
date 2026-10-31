// Activity reports (migration 0020): every change a staff member makes through the API is one
// row of canteen_activity, named here from the route it went through. Pure: tested in
// activity.test.ts.

export const AREAS = ['people', 'social', 'meals', 'routes', 'medical', 'staff', 'org'] as const;
export type Area = (typeof AREAS)[number];
export const isArea = (v: unknown): v is Area => AREAS.includes(v as Area);

/** "METHOD pattern" → activity. Patterns use the route's own `:names`. */
const ACTIVITIES: Record<string, string> = {
  'POST /orgs/:id/people': 'people.add',
  'PATCH /orgs/:id/people/:personId': 'people.edit',
  'DELETE /orgs/:id/people/:personId': 'people.delete',
  'PUT /orgs/:id/people/:personId/identity': 'people.identity',
  'PUT /orgs/:id/people/:personId/documents/:kind': 'people.document',
  'DELETE /orgs/:id/people/:personId/documents/:kind': 'people.document',
  'POST /orgs/:id/people/:personId/incidents': 'people.incident',
  'DELETE /orgs/:id/people/:personId/incidents/:incidentId': 'people.incident',
  'POST /orgs/:id/import': 'people.import',

  'PUT /orgs/:id/social/limits': 'social.limits',
  'POST /orgs/:id/social/applicants': 'social.applicant',
  'PUT /orgs/:id/social/people/:personId': 'social.service',
  'POST /orgs/:id/visits': 'social.visitPlan',
  'PATCH /orgs/:id/visits/:visitId': 'social.visitUpdate',
  'DELETE /orgs/:id/visits/:visitId': 'social.visitUpdate',
  'POST /orgs/:id/people/:personId/social': 'social.assessment',

  'POST /orgs/:id/meal-times': 'meals.mealTime',
  'PATCH /orgs/:id/meal-times/:mealTimeId': 'meals.mealTime',
  'DELETE /orgs/:id/meal-times/:mealTimeId': 'meals.mealTime',
  'PUT /orgs/:id/menus': 'meals.menu',
  'POST /orgs/:id/menus/copy': 'meals.menu',
  'POST /orgs/:id/dishes': 'meals.dish',
  'DELETE /orgs/:id/dishes/:dishId': 'meals.dish',
  'POST /orgs/:id/shopping': 'meals.shopping',

  'PUT /orgs/:id/areas': 'routes.areas',
  'POST /orgs/:id/areas/build': 'routes.plan',
  'POST /orgs/:id/drivers': 'routes.driver',
  'PATCH /orgs/:id/drivers/:driverId': 'routes.driver',
  'DELETE /orgs/:id/drivers/:driverId': 'routes.driver',
  'PUT /orgs/:id/drivers/:driverId/licence': 'routes.licence',
  'DELETE /orgs/:id/drivers/:driverId/licence': 'routes.licence',
  'PUT /orgs/:id/route-settings': 'routes.settings',
  'PUT /orgs/:id/routes/:day': 'routes.plan',
  'POST /orgs/:id/routes/:day/copy': 'routes.plan',
  'POST /orgs/:id/routes/:day/optimise': 'routes.plan',
  'PUT /orgs/:id/routes/:day/stops/:personId': 'routes.delivery',
  'DELETE /orgs/:id/routes/:day/stops/:personId': 'routes.delivery',

  'PUT /orgs/:id/doses': 'medical.dose',
  'PUT /orgs/:id/people/:personId/medical': 'medical.profile',
  'POST /orgs/:id/people/:personId/medications': 'medical.medication',
  'PATCH /orgs/:id/people/:personId/medications/:medicationId': 'medical.medication',
  'DELETE /orgs/:id/people/:personId/medications/:medicationId': 'medical.medication',
  'POST /orgs/:id/people/:personId/med-notes': 'medical.note',
  'DELETE /orgs/:id/people/:personId/med-notes/:noteId': 'medical.note',
  'POST /orgs/:id/people/:personId/hospital-stays': 'medical.stay',
  'PATCH /orgs/:id/people/:personId/hospital-stays/:stayId': 'medical.stay',
  'POST /orgs/:id/people/:personId/med-papers': 'medical.paper',
  'DELETE /orgs/:id/people/:personId/med-papers/:paperId': 'medical.paper',

  'PATCH /orgs/:id/staff/:staffId': 'staff.role',
  'PUT /orgs/:id/staff/:staffId/social': 'staff.role',
  'DELETE /orgs/:id/staff/:staffId': 'staff.remove',
  'POST /orgs/:id/invites': 'staff.invite',
  'DELETE /orgs/:id/invites/:inviteId': 'staff.invite',
  'POST /orgs/:id/invites/:inviteId/email': 'staff.invite',

  'PATCH /orgs/:id': 'org.settings',
  'PUT /orgs/:id/page': 'org.page',
  'PUT /orgs/:id/logo': 'org.page',
  'DELETE /orgs/:id/logo': 'org.page',
  'PUT /orgs/:id/header': 'org.page',
  'PUT /orgs/:id/header-image': 'org.page',
  'DELETE /orgs/:id/header-image': 'org.page',
};

/** Every activity name, for the catalog test and the report's filters. */
export const ACTIVITY_NAMES = [...new Set(Object.values(ACTIVITIES))].sort();

export const areaOf = (activity: string): Area => activity.split('.')[0] as Area;

/** Segments kept as written (the route's word, not an id): `/areas/:action`. */
const LITERAL_PARAMS = new Set(['action']);

/**
 * The activity of an API call: its path with each parameter's value put back as `:name`, looked
 * up with the method. Null for reads, for calls outside an organisation and for routes that are
 * not activities (demo role switch, map lookups).
 */
export function activityOf(
  method: string,
  pathname: string,
  params: Record<string, string>,
): string | null {
  if (method === 'GET' || method === 'HEAD' || !params.id) return null;
  const at = pathname.indexOf('/orgs/');
  if (at < 0) return null;
  const byValue = new Map<string, string>();
  for (const [name, value] of Object.entries(params)) {
    if (name !== 'id' && !LITERAL_PARAMS.has(name)) byValue.set(decodeURIComponent(value), name);
  }
  // ['', 'orgs', '7', …]: the organisation is always the third segment.
  const pattern = pathname
    .slice(at)
    .replace(/\/+$/, '')
    .split('/')
    .map((seg, i) => {
      if (i < 2) return seg;
      if (i === 2) return ':id';
      const name = byValue.get(decodeURIComponent(seg));
      return name ? `:${name}` : seg;
    })
    .join('/');
  return ACTIVITIES[`${method} ${pattern}`] ?? null;
}

/**
 * Whether a report may show whom an activity was about: never for the medical file (a name next
 * to "medication changed" would tell the reader more than their role allows).
 */
export const showsPerson = (activity: string) => areaOf(activity) !== 'medical';
