import { describe, expect, it } from 'vitest';
import {
  DELIVERY_MEAL,
  countByDiet,
  dishLines,
  formatTime,
  overlaps,
  parseTime,
  portionsFor,
  weekdayOfDay,
  type Eater,
} from './meals';

const eater = (over: Partial<Eater>): Eater => ({
  id: 1,
  firstName: 'Ana',
  lastName: 'Pop',
  kind: 'delivery',
  status: 'active',
  diet: 'normal',
  allergies: null,
  deliveryDays: [1, 3, 5],
  ...over,
});

describe('meal times', () => {
  it('reads and writes times of day', () => {
    expect(parseTime('08:30')).toBe(510);
    expect(parseTime('8:05')).toBe(485);
    expect(parseTime('24:00')).toBeNull();
    expect(parseTime('12:60')).toBeNull();
    expect(parseTime('noon')).toBeNull();
    expect(formatTime(510)).toBe('08:30');
  });

  it('finds overlapping meal times', () => {
    const list = [{ id: 1, name: 'Breakfast', startsMin: 480, endsMin: 510 }];
    expect(overlaps(list, 500, 540)?.id).toBe(1);
    expect(overlaps(list, 510, 540)).toBeNull(); // starts when breakfast ends
    expect(overlaps(list, 470, 520, 1)).toBeNull(); // changing breakfast itself
  });
});

describe('portions', () => {
  // 2026-10-19 is a Monday.
  const monday = '2026-10-19';
  const tuesday = '2026-10-20';

  it('knows the weekday', () => {
    expect(weekdayOfDay(monday)).toBe(1);
    expect(weekdayOfDay('2026-10-25')).toBe(7);
  });

  it('delivers only on the chosen days, to active people at home', () => {
    const people = [
      eater({ id: 1 }),
      eater({ id: 2, firstName: 'Ion', status: 'paused' }),
      eater({ id: 3, firstName: 'Eva', kind: 'resident' }),
      eater({ id: 4, firstName: 'Dan', diet: 'diabetic', allergies: 'nuts' }),
    ];
    expect(portionsFor(people, monday, DELIVERY_MEAL).map((p) => p.label)).toEqual([
      'Dan P.',
      'Ana P.',
    ]);
    expect(portionsFor(people, tuesday, DELIVERY_MEAL)).toEqual([]);
  });

  it('feeds every active resident at every meal time', () => {
    const people = [
      eater({ id: 1, kind: 'resident', deliveryDays: [] }),
      eater({ id: 2, kind: 'resident', status: 'ended' }),
    ];
    expect(portionsFor(people, tuesday, 7)).toHaveLength(1);
  });

  it('counts portions per diet', () => {
    const people = [
      eater({ id: 1 }),
      eater({ id: 2, diet: 'soft' }),
      eater({ id: 3, diet: 'soft' }),
    ];
    expect(countByDiet(portionsFor(people, monday, DELIVERY_MEAL))).toEqual({
      normal: 1,
      soft: 2,
    });
  });

  it('splits dishes into lines', () => {
    expect(dishLines(' Soup \n\nChicken with rice\n')).toEqual(['Soup', 'Chicken with rice']);
  });
});
