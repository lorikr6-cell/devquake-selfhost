// Who may do what in an organisation (docs/plugins/ideas/canteen.md). Each role sees only what
// it needs; every page and API call checks can() on the server.

export const ROLES = ['organiser', 'coordinator', 'kitchen', 'driver', 'medical'] as const;
export type Role = (typeof ROLES)[number];

export const isRole = (v: unknown): v is Role => ROLES.includes(v as Role);

/** A staff member's roles from the database's SET column ("organiser,driver"), in ROLES order. */
export function rolesOf(value: string | null | undefined, fallback?: Role): Role[] {
  const set = new Set((value ?? '').split(',').filter(isRole));
  if (set.size === 0 && fallback) set.add(fallback);
  return ROLES.filter((r) => set.has(r));
}

/** The main role among several: the first in ROLES order (organiser first). */
export const mainRole = (roles: readonly Role[]): Role =>
  ROLES.find((r) => roles.includes(r)) ?? 'driver';

export type Action =
  /** Open the organisation at all: its menu shows each role what it may use. */
  | 'org.view'
  /** Change the organisation, its staff and their roles. */
  | 'org.manage'
  /** See the list of people and their profiles (name, address, diet, observation). */
  | 'people.view'
  /** Add, change and remove people; their photo. */
  | 'people.edit'
  /** The personal numbers (CNP, ID card) and the ID card and other document pictures. */
  | 'identity.view'
  | 'identity.edit'
  /** The organisation's incident notes. */
  | 'incidents.view'
  | 'incidents.write'
  /** Who opened personal numbers and documents. */
  | 'access.view'
  /** Meal times, menus and diet variants. */
  | 'meals.edit'
  /** The menus and the kitchen sheet: portions per diet, allergies, box labels. */
  | 'kitchen.view'
  /** Drivers, delivery routes and the printed route sheets (names, addresses, phones). */
  | 'routes.edit'
  /** The medical file: medications and their administration, medical notes, hospital stays. */
  | 'medical.view'
  | 'medical.edit'
  /** A driver's own route on their phone: their stops only, ticked as delivered. */
  | 'route.own'
  /**
   * Social work: places, the waiting list (admit, remove), visits and the social assessment
   * questionnaire. Organisers, and every staff member ticked as the organisation's social worker.
   */
  | 'social.view'
  | 'social.edit';

const ALLOWED: Record<Action, readonly Role[]> = {
  'org.view': ROLES,
  'org.manage': ['organiser'],
  'people.view': ['organiser', 'coordinator', 'medical'],
  'people.edit': ['organiser', 'coordinator'],
  'identity.view': ['organiser'],
  'identity.edit': ['organiser'],
  'incidents.view': ['organiser', 'coordinator', 'medical'],
  'incidents.write': ['organiser', 'coordinator', 'medical'],
  'access.view': ['organiser'],
  'meals.edit': ['organiser', 'coordinator'],
  'kitchen.view': ['organiser', 'coordinator', 'kitchen'],
  'routes.edit': ['organiser', 'coordinator'],
  // Health data: the medical staff only (organisers see just that someone is in hospital).
  'medical.view': ['medical'],
  'medical.edit': ['medical'],
  'route.own': ['driver'],
  'social.view': ['organiser'],
  'social.edit': ['organiser'],
};

/** What being ticked as the social worker adds to any role. */
const SOCIAL_WORKER: readonly Action[] = [
  'social.view',
  'social.edit',
  'people.view',
  'incidents.view',
  'incidents.write',
];

/**
 * Can this staff member do it: by any of their roles (a person may have several, even all), or
 * as the organisation's social worker.
 */
export function staffCan(
  staff: { role: Role; roles?: readonly Role[]; socialWorker?: boolean },
  action: Action,
): boolean {
  const roles = staff.roles?.length ? staff.roles : [staff.role];
  return (
    roles.some((r) => can(r, action)) ||
    (Boolean(staff.socialWorker) && SOCIAL_WORKER.includes(action))
  );
}

export function can(role: Role, action: Action): boolean {
  return ALLOWED[action].includes(role);
}
