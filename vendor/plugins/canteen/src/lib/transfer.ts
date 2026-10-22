import { LOCALES, LOCALE_TAGS, type Locale, type Translate } from '@devquake/ui';
import { translator } from '../i18n';
import { birthdayIn, monthGrid } from './calendar';
import type { Person } from './data';
import { formatTime, overlaps, parseTime, type MealTime } from './meals';
import type { Menu } from './meals-data';
import { DIETS, PERSON_KINDS, STATUSES, ageOn, type Diet } from './model';
import type { Driver } from './routes-data';
import type { Cell, Sheet } from './xlsx';

// The organisation as a workbook (export) and back (re-upload). Every editable sheet starts
// with a hidden row of keys ("people.id", "people.lastName", …) and a row of titles: people may
// rename titles and sheets, reorder nothing. Values use the page language's labels; reading
// accepts the labels of every language and the codes. Pure: tested in transfer.test.ts.

export const SHEETS = ['org', 'people', 'mealTimes', 'menus', 'drivers'] as const;
export type SheetId = (typeof SHEETS)[number];

const PEOPLE_KEYS = [
  'id',
  'lastName',
  'firstName',
  'birthDate',
  'kind',
  'status',
  'address',
  'phone',
  'contactName',
  'contactPhone',
  'diet',
  'allergies',
  'observation',
  'deliveryDays',
  'windowFrom',
  'windowTo',
] as const;
const MEAL_TIME_KEYS = ['id', 'name', 'starts', 'ends'] as const;
const DRIVER_KEYS = ['id', 'name', 'phone', 'weekdays', 'shiftFrom', 'shiftTo', 'active'] as const;
const VARIANT_DIETS = DIETS.filter((d) => d !== 'normal');
const MENU_KEYS = ['day', 'meal', 'dishes', ...VARIANT_DIETS.map((d) => `variant_${d}`)] as const;

export interface OrgData {
  name: string;
  description: string | null;
  people: Person[];
  mealTimes: MealTime[];
  menus: Menu[];
  drivers: Driver[];
  staff: { name: string; role: string }[];
  routes: { day: string; driver: string; position: number; person: string; delivered: boolean }[];
}

/** Column titles reuse the app's own labels; a few exist only in the file. */
const LABELS: Record<string, string> = {
  id: 'transfer.id',
  name: 'fields.orgName',
  description: 'fields.description',
  lastName: 'fields.lastName',
  firstName: 'fields.firstName',
  birthDate: 'transfer.birthDateColumn',
  kind: 'fields.kind',
  status: 'fields.status',
  address: 'fields.address',
  phone: 'fields.phone',
  contactName: 'fields.contactName',
  contactPhone: 'fields.contactPhone',
  diet: 'fields.diet',
  allergies: 'fields.allergies',
  observation: 'fields.observation',
  deliveryDays: 'transfer.daysColumn',
  windowFrom: 'fields.windowFrom',
  windowTo: 'fields.windowTo',
  starts: 'meals.from',
  ends: 'meals.to',
  day: 'transfer.dayColumn',
  meal: 'fields.mealName',
  dishes: 'fields.dishes',
  weekdays: 'transfer.daysColumn',
  shiftFrom: 'routes.shiftFrom',
  shiftTo: 'routes.shiftTo',
  active: 'routes.active',
};

const header = (id: SheetId, keys: readonly string[], t: Translate): Cell[][] => [
  keys.map((k) => `${id}.${k}`),
  keys.map((k) => {
    if (k.startsWith('variant_')) return t(`diets.${k.slice(8)}`);
    if (k === 'name' && id === 'mealTimes') return t('fields.mealName');
    if (k === 'name' && id === 'drivers') return t('fields.driverName');
    return t(LABELS[k] ?? k);
  }),
];

const time = (m: number | null) => (m === null ? '' : formatTime(m));

/** The workbook's sheets in the page language. `today` sets the calendar's year. */
export function buildSheets(data: OrgData, locale: Locale, today: string): Sheet[] {
  const t = translator(locale);
  const yes = t('transfer.yes');
  const no = t('transfer.no');
  const people: Sheet = {
    name: t('transfer.sheets.people'),
    rows: [
      ...header('people', PEOPLE_KEYS, t),
      ...data.people.map((p) => [
        p.id,
        p.lastName,
        p.firstName,
        p.birthDate ?? '',
        t(`kinds.${p.kind}`),
        t(`statuses.${p.status}`),
        p.address ?? '',
        p.phone ?? '',
        p.contactName ?? '',
        p.contactPhone ?? '',
        t(`diets.${p.diet}`),
        p.allergies ?? '',
        p.observation ?? '',
        p.deliveryDays.join(','),
        time(p.windowFromMin),
        time(p.windowToMin),
      ]),
    ],
    hiddenRows: [0],
    boldRows: [1],
    widths: [6, 16, 16, 12, 18, 10, 30, 14, 18, 14, 12, 18, 30, 12, 10, 10],
  };
  const mealName = (id: number) =>
    id === 0 ? t('meals.delivered') : (data.mealTimes.find((m) => m.id === id)?.name ?? '');
  const menus: Sheet = {
    name: t('transfer.sheets.menus'),
    rows: [
      ...header('menus', MENU_KEYS, t),
      ...[...data.menus]
        .sort((a, b) => a.day.localeCompare(b.day) || a.meal - b.meal)
        .map((m) => [
          m.day,
          mealName(m.meal),
          m.dishes,
          ...VARIANT_DIETS.map((d) => m.variants[d] ?? ''),
        ]),
    ],
    hiddenRows: [0],
    boldRows: [1],
    widths: [12, 22, 36, ...VARIANT_DIETS.map(() => 24)],
  };
  return [
    {
      name: t('transfer.sheets.org'),
      rows: [...header('org', ['name', 'description'], t), [data.name, data.description ?? '']],
      hiddenRows: [0],
      boldRows: [1],
      widths: [30, 80],
    },
    people,
    {
      name: t('transfer.sheets.mealTimes'),
      rows: [
        ...header('mealTimes', MEAL_TIME_KEYS, t),
        ...data.mealTimes.map((m) => [
          m.id,
          m.name,
          formatTime(m.startsMin),
          formatTime(m.endsMin),
        ]),
      ],
      hiddenRows: [0],
      boldRows: [1],
      widths: [6, 20, 10, 10],
    },
    menus,
    {
      name: t('transfer.sheets.drivers'),
      rows: [
        ...header('drivers', DRIVER_KEYS, t),
        ...data.drivers.map((d) => [
          d.id,
          d.name,
          d.phone ?? '',
          d.weekdays.join(','),
          formatTime(d.shiftFromMin),
          formatTime(d.shiftToMin),
          d.active ? yes : no,
        ]),
      ],
      hiddenRows: [0],
      boldRows: [1],
      widths: [6, 20, 14, 14, 10, 10, 8],
    },
    // Read-only sheets: they have no keys row and are ignored on re-upload.
    {
      name: t('transfer.sheets.routes'),
      rows: [
        [t('transfer.readOnly')],
        ['day', 'driver', 'position', 'person', 'delivered'].map((k) =>
          t(`transfer.routeColumns.${k}`),
        ),
        ...data.routes.map((r) => [r.day, r.driver, r.position, r.person, r.delivered ? yes : '']),
      ],
      boldRows: [1],
      widths: [12, 20, 8, 28, 10],
    },
    {
      name: t('transfer.sheets.staff'),
      rows: [
        [t('transfer.readOnly')],
        [t('fields.driverName'), t('staff.role')],
        ...data.staff.map((s) => [s.name, t(`roles.${s.role}`)]),
      ],
      boldRows: [1],
      widths: [28, 20],
    },
    calendarSheet(data.people, locale, today, t),
  ];
}

/** The year's months as in the app's calendar: weeks from Monday, birthdays in their days. */
function calendarSheet(people: Person[], locale: Locale, today: string, t: Translate): Sheet {
  const year = Number(today.slice(0, 4));
  const fmt = (d: Date, o: Intl.DateTimeFormatOptions) =>
    d.toLocaleDateString(LOCALE_TAGS[locale], { ...o, timeZone: 'UTC' });
  const weekdays = [0, 1, 2, 3, 4, 5, 6].map((i) =>
    fmt(new Date(Date.UTC(2026, 9, 19 + i)), { weekday: 'short' }),
  );
  const rows: Cell[][] = [[t('transfer.readOnly')]];
  const bold: number[] = [];
  for (let m = 1; m <= 12; m++) {
    const month = `${year}-${String(m).padStart(2, '0')}`;
    rows.push([]);
    bold.push(rows.length);
    rows.push([fmt(new Date(`${month}-15T12:00:00Z`), { month: 'long', year: 'numeric' })]);
    bold.push(rows.length);
    rows.push(weekdays);
    const cells = monthGrid(month).map((day) => {
      if (!day) return '';
      const born = people
        .filter((p) => p.status !== 'ended' && p.birthDate && birthdayIn(p.birthDate, year) === day)
        .map((p) => `🎂 ${p.firstName} ${p.lastName} (${ageOn(p.birthDate!, day)})`);
      return [String(Number(day.slice(8))), ...born].join('\n');
    });
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  }
  return {
    name: `${t('transfer.sheets.calendar')} ${year}`,
    rows,
    boldRows: bold,
    widths: [20, 20, 20, 20, 20, 20, 20],
  };
}

// ---------------------------------------------------------------------------------------------
// Reading an uploaded workbook

/** Label (any language, any case) or code → code, for one list of the catalog. */
function labelsOf(list: readonly string[], ns: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const code of list) {
    map.set(code.toLowerCase(), code);
    for (const locale of LOCALES) {
      const label = translator(locale)(`${ns}.${code}`);
      map.set(label.trim().toLowerCase(), code);
    }
  }
  return map;
}

const KINDS = labelsOf(PERSON_KINDS, 'kinds');
const STATUS = labelsOf(STATUSES, 'statuses');
const DIET = labelsOf(DIETS, 'diets');
const YES = new Set([
  '1',
  'true',
  'x',
  ...LOCALES.map((l) => translator(l)('transfer.yes').toLowerCase()),
]);

export const codeOf = (map: Map<string, string>, value: string) =>
  map.get(value.trim().toLowerCase()) ?? value.trim();
export const kindCode = (v: string) => codeOf(KINDS, v);
export const statusCode = (v: string) => codeOf(STATUS, v);
export const dietCode = (v: string) => codeOf(DIET, v);
export const isYes = (v: string) => YES.has(v.trim().toLowerCase());

/** A date cell: "1957-09-17", or the serial number Excel stores when someone retypes it. */
export function cellDate(value: string): string {
  const v = value.trim();
  if (/^\d+(\.\d+)?$/.test(v)) {
    const ms = Date.UTC(1899, 11, 30) + Math.floor(Number(v)) * 86_400_000;
    return new Date(ms).toISOString().slice(0, 10);
  }
  return v;
}

/** A time cell: "08:30", or the day fraction Excel stores when someone retypes it (0.3541…). */
export function cellTime(value: string): string {
  const v = value.trim();
  if (/^0?\.\d+$|^0$/.test(v)) return formatTime(Math.round(Number(v) * 1440) % 1440);
  return v;
}

/** "1, 3,5" → [1, 3, 5]; anything else is left for the validator to refuse. */
export const cellDays = (value: string): unknown =>
  value.trim() === ''
    ? []
    : value
        .split(/[,;\s]+/)
        .filter(Boolean)
        .map(Number);

export interface ParsedSheet {
  id: SheetId;
  /** The sheet's name as it is in the file (for messages). */
  label: string;
  /** Data rows (after the keys and titles), each with its Excel row number. */
  rows: { row: number; values: Record<string, string> }[];
}

/** The editable sheets of a workbook, found by their keys row; other sheets are ignored. */
export function parseSheets(sheets: { name: string; rows: string[][] }[]): ParsedSheet[] {
  const parsed: ParsedSheet[] = [];
  for (const sheet of sheets) {
    const keys = sheet.rows[0] ?? [];
    const id = (keys[0] ?? '').split('.')[0] as SheetId;
    if (!SHEETS.includes(id) || !keys.every((k) => !k || k.startsWith(`${id}.`))) continue;
    const names = keys.map((k) => k.slice(id.length + 1));
    const rows = sheet.rows
      .slice(2)
      .map((cells, i) => ({
        row: i + 3,
        values: Object.fromEntries(names.map((n, c) => [n, (cells[c] ?? '').trim()])),
      }))
      .filter((r) => Object.values(r.values).some(Boolean));
    parsed.push({ id, label: sheet.name, rows });
  }
  return parsed;
}

/** The meal of a menu row: the delivered meal's label in any language, or a meal time's name. */
export function mealOf(value: string, mealTimes: MealTime[]): number | null {
  const v = value.trim().toLowerCase();
  if (LOCALES.some((l) => translator(l)('meals.delivered').toLowerCase() === v)) return 0;
  return mealTimes.find((m) => m.name.trim().toLowerCase() === v)?.id ?? null;
}

/** Meal times after the upload's changes must not overlap; returns the clashing pair. */
export function mealTimeClash(list: MealTime[]): [MealTime, MealTime] | null {
  for (const m of list) {
    const other = overlaps(list, m.startsMin, m.endsMin, m.id);
    if (other) return [m, other];
  }
  return null;
}

export { parseTime };
export type { Diet };
