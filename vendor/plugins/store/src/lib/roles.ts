// The shop's team (ADR 0058): the owner and the members they invite, each with one or more
// roles. Pure and tested (growth.test.ts); the API and the pages ask `can` before anything else.

export const STAFF_ROLES = [
  'manager',
  'catalog',
  'marketing',
  'support',
  'shipping',
  'maintenance',
] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];
export type Role = 'owner' | StaffRole;
export const isStaffRole = (v: unknown): v is StaffRole => STAFF_ROLES.includes(v as StaffRole);

/** "catalog,shipping" (a MySQL SET) or a list → the known roles, in their usual order. */
export function parseRoles(value: unknown): StaffRole[] {
  const list = Array.isArray(value) ? value.map(String) : String(value ?? '').split(',');
  return STAFF_ROLES.filter((r) => list.includes(r));
}

export const AREAS = [
  'overview',
  'products',
  'orders',
  'messages',
  'reviews',
  'marketing',
  'stats',
  'settings',
  'design',
  'seo',
  'shipping',
  'payments',
  'team',
  // Scripts on the shop's pages run for every buyer: the owner's alone.
  'tracking',
] as const;
export type Area = (typeof AREAS)[number];

const ACCESS: Record<StaffRole, readonly Area[]> = {
  // Everything but the money's destination (payment secrets), tracking code and the team.
  manager: [
    'overview',
    'products',
    'orders',
    'messages',
    'reviews',
    'marketing',
    'stats',
    'settings',
    'design',
    'seo',
    'shipping',
  ],
  // Keeping the products up to date: texts, photos, types, vendors, stock, search engines.
  catalog: ['overview', 'products', 'seo'],
  // Promoting the products: campaigns, vouchers, rules, announcements, newsletters, reviews.
  marketing: ['overview', 'marketing', 'seo', 'design', 'reviews', 'stats'],
  // Helping buyers: their messages, reviews and orders.
  support: ['overview', 'messages', 'reviews', 'orders'],
  // Packing, shipping and delivering orders.
  shipping: ['overview', 'orders', 'shipping'],
  // Keeping the shop running: opening, maintenance mode, seller details, languages, design.
  maintenance: ['overview', 'settings', 'design'],
};

/** Whether any of the roles may use the area. */
export function can(roles: Role | readonly Role[], area: Area): boolean {
  const list: readonly Role[] = typeof roles === 'string' ? [roles] : roles;
  return list.some((r) => r === 'owner' || ACCESS[r].includes(area));
}

/** The task panels of the Overview, each for the roles that do that work. */
export const TASK_PANELS = ['shipping', 'support', 'catalog', 'marketing', 'maintenance'] as const;
export type TaskPanel = (typeof TASK_PANELS)[number];

export function taskPanels(roles: readonly Role[]): TaskPanel[] {
  if (roles.includes('owner') || roles.includes('manager')) return [...TASK_PANELS];
  return TASK_PANELS.filter((p) => roles.includes(p));
}

/** Invitation links last a week. */
export const INVITE_DAYS = 7;
export const TEAM_LIMIT = 20;
