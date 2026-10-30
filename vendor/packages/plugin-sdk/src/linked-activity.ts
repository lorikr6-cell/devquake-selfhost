import { calendarRange, type CalendarFeedInput } from './linked-calendar';
import type { PluginLinksApi } from './types';

/**
 * What a member did in other apps (ADR 0081): an app offers the read link point `activity.day`
 * with the things the member did there on each day (a finished workout, a pet's care, a cooked
 * meal, what they bought, a darts game); an app like the habits journal shows them, each with a
 * link back to its page in that app.
 */

/** The link point every app that records what members do offers (read). */
export const ACTIVITY_POINT = 'activity.day';

/** Input of `activity.day`: the same range as `calendar.events` (at most 62 days). */
export const activityRange = (input: unknown): CalendarFeedInput | null => calendarRange(input);

/** At most this many items per reply (the host also caps a reply at 64 KB). */
export const ACTIVITY_MAX_ITEMS = 200;

/** One thing the member did, in an `activity.day` reply. */
export interface ActivityFeedItem {
  /** Unique within the app, e.g. "session:41". */
  id: string;
  /** "YYYY-MM-DD" in the member's time zone. */
  day: string;
  /** One emoji, e.g. "🏋️". */
  icon?: string;
  /** Short, in the member's language, e.g. "Upper body". */
  title: string;
  /** A few words more, e.g. "42 min · 310 kcal". */
  detail?: string;
  /** A deep-link target of the providing app and its parameters, to open it there. */
  target?: string;
  params?: Record<string, string>;
}

/** An item of a connected app, ready to show in this app. */
export interface LinkedActivity {
  app: string;
  appName: string;
  id: string;
  day: string;
  icon: string;
  title: string;
  detail: string;
  /** Opens it in that app, with a way back here; null when it cannot be opened. */
  url: string | null;
}

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** The member's calendar day ("YYYY-MM-DD") of a UTC instant, in their time zone. */
export function localDayOf(at: Date, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(at);
  } catch {
    return at.toISOString().slice(0, 10);
  }
}

/**
 * The UTC instants to search between so that every local day from `range.from` to `range.to` is
 * covered in any time zone (a day more on each side; handlers then keep the items whose
 * `localDayOf` is in the range).
 */
export function utcSearchWindow(range: CalendarFeedInput): { start: Date; end: Date } {
  return {
    start: new Date(Date.parse(`${range.from}T00:00:00Z`) - 86_400_000),
    end: new Date(Date.parse(`${range.to}T00:00:00Z`) + 2 * 86_400_000),
  };
}

/** A string trimmed to at most `max` characters (titles and details stay short). */
const short = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/**
 * What the member did in every connected app that offers `activity.day`, from `from` to `to`,
 * each with a link into its app (and back to `returnTo` here). Empty without links; an app that
 * fails is left out.
 */
export async function linkedActivity(
  links: PluginLinksApi | undefined,
  range: CalendarFeedInput,
  returnTo: string,
): Promise<LinkedActivity[]> {
  if (!links) return [];
  const partners = (await links.list().catch(() => [])).filter((a) => a.state === 'connected');
  const replies = await Promise.all(
    partners.map(async (partner) => ({
      partner,
      result: await links
        .call<{ items?: ActivityFeedItem[] }>(partner.app, ACTIVITY_POINT, range)
        .catch(() => null),
    })),
  );
  const out: LinkedActivity[] = [];
  for (const { partner, result } of replies) {
    if (!result?.ok || !Array.isArray(result.data?.items)) continue;
    for (const item of result.data.items.slice(0, ACTIVITY_MAX_ITEMS)) {
      if (typeof item?.title !== 'string' || typeof item.day !== 'string' || !DAY.test(item.day))
        continue;
      if (item.day < range.from || item.day > range.to) continue;
      out.push({
        app: partner.app,
        appName: partner.name,
        id: short(item.id, 80) || `${item.day}:${out.length}`,
        day: item.day,
        icon: short(item.icon, 12),
        title: short(item.title, 120),
        detail: short(item.detail, 160),
        url: item.target
          ? links.deepLink(partner.app, item.target, item.params ?? {}, { returnTo })
          : null,
      });
    }
  }
  return out.sort((a, b) => a.day.localeCompare(b.day) || a.app.localeCompare(b.app));
}
