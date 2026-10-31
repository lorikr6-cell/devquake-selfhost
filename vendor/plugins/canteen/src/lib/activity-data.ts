import type { PluginDatabase } from '@devquake/plugin-sdk';
import { localDateTimeToUtc } from '@devquake/ui';
import { activityOf, areaOf, isArea, showsPerson, type Area } from './activity';
import { requireCan } from './data';
import { addDays, type IsoDate } from './dates';
import { HttpError } from './http';
import { isRole, rolesOf, type Role } from './roles';

type Db = Omit<PluginDatabase, 'transaction'>;

/** How long activity is kept (pruned when a report is opened: no background work). */
export const KEEP_DAYS = 730;
/** The longest span one report covers, and the most lines it lists. */
export const MAX_REPORT_DAYS = 366;
export const MAX_ENTRIES = 500;

/**
 * Records one API call as activity when it is one (see `activityOf`). Never fails the call: a
 * missing table (migration not yet applied) or a gone person only loses the row.
 */
export async function recordActivity(
  db: Db,
  request: Request,
  params: Record<string, string>,
  userId: number,
) {
  try {
    const action = activityOf(request.method, new URL(request.url).pathname, params);
    if (!action) return;
    const person =
      action !== 'people.delete' && /^\d+$/.test(params.personId ?? '')
        ? Number(params.personId)
        : null;
    await db.execute(
      `INSERT INTO canteen_activity (org_id, user_id, action, person_id, created_at)
       VALUES (?, ?, ?, ?, UTC_TIMESTAMP())`,
      [Number(params.id), userId, action, person],
    );
  } catch {
    // Reports are a convenience; the change itself is saved.
  }
}

/** Whose activity: everyone, a role, the social workers or one account. */
export type ReportGroup = 'all' | Role | 'social' | `user:${number}`;

export function reportGroup(v: unknown): ReportGroup {
  if (typeof v !== 'string' || v === 'all') return 'all';
  if (v === 'social' || isRole(v)) return v;
  const m = /^user:(\d{1,10})$/.exec(v);
  return m ? `user:${Number(m[1])}` : 'all';
}

export const reportArea = (v: unknown): Area | 'all' => (isArea(v) ? v : 'all');

export interface ReportMember {
  userId: number | null;
  /** Null: someone no longer on the staff. */
  name: string | null;
  roles: Role[];
  socialWorker: boolean;
  counts: Partial<Record<Area, number>>;
  total: number;
}

export interface ReportEntry {
  at: string;
  name: string | null;
  action: string;
  /** "Last First", when the report may name them (never for the medical file). */
  person: string | null;
}

export interface ActivityReport {
  members: ReportMember[];
  entries: ReportEntry[];
  /** More lines than MAX_ENTRIES: the list shows the newest. */
  truncated: boolean;
}

const iso = (v: Date | string) =>
  v instanceof Date ? v.toISOString() : `${String(v).replace(' ', 'T')}Z`;

/**
 * Activity of the organisation's staff from `from` to `to` (days in the reader's time zone),
 * per person and area, and the newest lines. Organisers only.
 */
export async function activityReport(
  db: Db,
  orgId: number,
  userId: number,
  q: { from: IsoDate; to: IsoDate; group: ReportGroup; area: Area | 'all'; timeZone: string },
): Promise<ActivityReport> {
  await requireCan(db, orgId, userId, 'org.manage');
  const start = localDateTimeToUtc(`${q.from}T00:00`, q.timeZone);
  const end = localDateTimeToUtc(`${addDays(q.to, 1)}T00:00`, q.timeZone);
  if (!start || !end || end <= start || q.to > addDays(q.from, MAX_REPORT_DAYS)) {
    throw new HttpError(400, 'reportSpan', { max: MAX_REPORT_DAYS });
  }
  await db.execute(
    'DELETE FROM canteen_activity WHERE org_id = ? AND created_at < UTC_TIMESTAMP() - INTERVAL ? DAY',
    [orgId, KEEP_DAYS],
  );

  const where = ['a.org_id = ?', 'a.created_at >= ?', 'a.created_at < ?'];
  const args: unknown[] = [orgId, start, end];
  if (q.area !== 'all') {
    where.push('a.action LIKE ?');
    args.push(`${q.area}.%`);
  }
  if (q.group.startsWith('user:')) {
    where.push('a.user_id = ?');
    args.push(Number(q.group.slice(5)));
  } else if (q.group === 'social') {
    where.push('s.social_worker = 1');
  } else if (q.group !== 'all') {
    where.push('FIND_IN_SET(?, s.roles)');
    args.push(q.group);
  }
  // sql-safe: `where` holds fixed fragments only; every value is a ? param.
  const joins = `FROM canteen_activity a
    LEFT JOIN canteen_staff s ON s.org_id = a.org_id AND s.user_id = a.user_id`;
  const filter = `WHERE ${where.join(' AND ')}`;

  const sums = await db.query<{
    user_id: number | null;
    display_name: string | null;
    role: Role | null;
    roles: string | null;
    social_worker: number | null;
    action: string;
    n: number;
  }>(
    `SELECT a.user_id, s.display_name, s.role, s.roles, s.social_worker, a.action, COUNT(*) AS n
     ${joins} ${filter}
     GROUP BY a.user_id, s.display_name, s.role, s.roles, s.social_worker, a.action`,
    args,
  );
  const members = new Map<string, ReportMember>();
  for (const r of sums) {
    const gone = r.display_name === null;
    const key = gone ? 'former' : String(r.user_id);
    let m = members.get(key);
    if (!m) {
      m = {
        userId: gone ? null : Number(r.user_id),
        name: r.display_name,
        roles: gone ? [] : rolesOf(r.roles, r.role ?? undefined),
        socialWorker: Number(r.social_worker ?? 0) === 1,
        counts: {},
        total: 0,
      };
      members.set(key, m);
    }
    const area = areaOf(r.action);
    m.counts[area] = (m.counts[area] ?? 0) + Number(r.n);
    m.total += Number(r.n);
  }

  // sql-safe: limit — a number constant of this file.
  const limit = MAX_ENTRIES + 1;
  const rows = await db.query<{
    created_at: Date | string;
    display_name: string | null;
    action: string;
    first_name: string | null;
    last_name: string | null;
  }>(
    `SELECT a.created_at, s.display_name, a.action, p.first_name, p.last_name
     ${joins}
     LEFT JOIN canteen_people p ON p.id = a.person_id AND p.org_id = a.org_id
     ${filter}
     ORDER BY a.created_at DESC, a.id DESC LIMIT ${limit}`,
    args,
  );
  return {
    members: [...members.values()].sort(
      (a, b) => b.total - a.total || (a.name ?? '~').localeCompare(b.name ?? '~'),
    ),
    entries: rows.slice(0, MAX_ENTRIES).map((r) => ({
      at: iso(r.created_at),
      name: r.display_name,
      action: r.action,
      person:
        showsPerson(r.action) && r.last_name !== null ? `${r.last_name} ${r.first_name}` : null,
    })),
    truncated: rows.length > MAX_ENTRIES,
  };
}
