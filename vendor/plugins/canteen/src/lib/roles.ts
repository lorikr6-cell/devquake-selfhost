// Who may do what in an organisation (docs/plugins/ideas/canteen.md). Each role sees only what
// it needs; every page and API call checks can() on the server.

export const ROLES = ['organiser', 'coordinator', 'kitchen', 'driver', 'medical'] as const;
export type Role = (typeof ROLES)[number];

export const isRole = (v: unknown): v is Role => ROLES.includes(v as Role);

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
  | 'route.own';

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
};

export function can(role: Role, action: Action): boolean {
  return ALLOWED[action].includes(role);
}
