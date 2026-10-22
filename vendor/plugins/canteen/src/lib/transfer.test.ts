import { describe, expect, it } from 'vitest';
import type { Person } from './data';
import {
  buildSheets,
  cellDate,
  cellDays,
  cellTime,
  dietCode,
  isYes,
  kindCode,
  mealOf,
  parseSheets,
  statusCode,
} from './transfer';
import { exportFileName } from './transfer-data';
import { readXlsx, writeXlsx } from './xlsx';

const person: Person = {
  id: 7,
  firstName: 'Maria',
  lastName: 'Popescu',
  birthDate: '1957-09-17',
  kind: 'delivery',
  status: 'active',
  address: 'Str. Lalelelor 12',
  phone: null,
  contactName: null,
  contactPhone: null,
  diet: 'diabetic',
  allergies: null,
  observation: 'Sunați de două ori',
  idSeries: null,
  deliveryDays: [1, 3, 5],
  windowFromMin: 660,
  windowToMin: 780,
  documents: {},
  incomplete: true,
  inHospital: false,
  updatedAt: '2026-10-22T10:00:00.000Z',
};

const data = {
  name: 'Casa Speranța',
  description: 'Cantina din cartier',
  people: [person],
  mealTimes: [{ id: 3, name: 'Prânz', startsMin: 750, endsMin: 795 }],
  menus: [{ day: '2026-10-22', meal: 0, dishes: 'Supă\nPui cu orez', variants: { soft: 'Piure' } }],
  drivers: [],
  staff: [{ name: 'Ana', role: 'organiser' }],
  routes: [],
};

describe('organisation workbook', () => {
  it('round-trips through Excel, found by the keys row whatever the titles say', () => {
    const sheets = buildSheets(data, 'ro', '2026-10-22');
    // Someone renames a column title and the sheet: the keys row still identifies them.
    sheets[1]!.rows[1]![1] = 'NUME DE FAMILIE';
    sheets[1]!.name = 'Beneficiari';
    const parsed = parseSheets(readXlsx(writeXlsx(sheets)));
    expect(parsed.map((s) => s.id)).toEqual(['org', 'people', 'mealTimes', 'menus', 'drivers']);
    const people = parsed.find((s) => s.id === 'people')!;
    expect(people.label).toBe('Beneficiari');
    expect(people.rows).toEqual([
      {
        row: 3,
        values: expect.objectContaining({
          id: '7',
          lastName: 'Popescu',
          birthDate: '1957-09-17',
          kind: 'Livrare la domiciliu',
          diet: 'Diabetic',
          deliveryDays: '1,3,5',
          windowFrom: '11:00',
        }),
      },
    ]);
    const menus = parsed.find((s) => s.id === 'menus')!;
    expect(menus.rows[0]!.values).toEqual(
      expect.objectContaining({ dishes: 'Supă\nPui cu orez', variant_soft: 'Piure' }),
    );
  });

  it('ignores the read-only sheets (routes, staff, calendar)', () => {
    const sheets = buildSheets(data, 'en', '2026-10-22');
    expect(sheets.map((s) => s.name)).toContain('Calendar 2026');
    const calendar = sheets.find((s) => s.name === 'Calendar 2026')!;
    expect(calendar.rows.flat().some((c) => String(c).includes('🎂 Maria Popescu (69)'))).toBe(
      true,
    );
    expect(parseSheets(readXlsx(writeXlsx(sheets.slice(5))))).toEqual([]);
  });

  it('reads labels of any language and the codes', () => {
    expect(dietCode('Diabetisch')).toBe('diabetic');
    expect(dietCode('PURÉED')).toBe('pureed');
    expect(kindCode('Rezident în cămin')).toBe('resident');
    expect(statusCode('paused')).toBe('paused');
    expect(dietCode('unknown')).toBe('unknown'); // left for the validator to refuse
    expect([isYes('igen'), isYes('sí'), isYes('no'), isYes('')]).toEqual([
      true,
      true,
      false,
      false,
    ]);
  });

  it('understands dates and times Excel rewrote as numbers', () => {
    expect(cellDate('21080')).toBe('1957-09-17');
    expect(cellDate('1957-09-17')).toBe('1957-09-17');
    expect(cellTime('0.4583333333')).toBe('11:00');
    expect(cellTime('11:00')).toBe('11:00');
    expect(cellDays('1, 3;5')).toEqual([1, 3, 5]);
  });

  it('finds a menu meal by the delivered label in any language or a meal time name', () => {
    const times = [{ id: 3, name: 'Prânz', startsMin: 750, endsMin: 795 }];
    expect(mealOf('Gelieferte Mahlzeit', times)).toBe(0);
    expect(mealOf('prânz', times)).toBe(3);
    expect(mealOf('Cină', times)).toBeNull();
  });

  it('names the file with the local date and time', () => {
    expect(
      exportFileName('Casa Speranța!', new Date('2026-10-22T11:05:00Z'), 'Europe/Bucharest'),
    ).toBe('Casa-Speranta_2026-10-22_14-05.xlsx');
  });
});
