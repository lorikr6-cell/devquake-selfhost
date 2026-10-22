import { describe, expect, it } from 'vitest';
import { activeOn, dosesDue, isDoseStatus, parseTimes, timesText } from './medical';

describe('medication times', () => {
  it('reads a list of times of day', () => {
    expect(parseTimes('20:00, 08:00')).toEqual([480, 1200]);
    expect(parseTimes('8:00 8:00;12:30')).toEqual([480, 750]);
    expect(parseTimes('8:00, later')).toBeNull();
    expect(parseTimes('')).toBeNull();
    expect(parseTimes('1:00,2:00,3:00,4:00,5:00,6:00,7:00')).toBeNull();
    expect(timesText([480, 1200])).toBe('08:00, 20:00');
  });

  it('knows the statuses of a dose', () => {
    expect(isDoseStatus('given')).toBe(true);
    expect(isDoseStatus('lost')).toBe(false);
  });
});

describe('doses due', () => {
  const meds = [
    { id: 1, times: [1200], startsOn: '2026-10-01', endsOn: null },
    { id: 2, times: [480, 1200], startsOn: '2026-10-20', endsOn: '2026-10-22' },
  ];

  it('includes the first and last day of a course', () => {
    expect(activeOn(meds[1]!, '2026-10-20')).toBe(true);
    expect(activeOn(meds[1]!, '2026-10-22')).toBe(true);
    expect(activeOn(meds[1]!, '2026-10-23')).toBe(false);
    expect(activeOn(meds[1]!, '2026-10-19')).toBe(false);
  });

  it('lists every dose of the day in time order', () => {
    expect(dosesDue(meds, '2026-10-21')).toEqual([
      { medicationId: 2, timeMin: 480 },
      { medicationId: 1, timeMin: 1200 },
      { medicationId: 2, timeMin: 1200 },
    ]);
    expect(dosesDue(meds, '2026-10-25')).toEqual([{ medicationId: 1, timeMin: 1200 }]);
  });
});

describe('medical papers', async () => {
  const { sniffPaper } = await import('./med-papers');
  const bytes = (s: string) => new Uint8Array([...s].map((c) => c.charCodeAt(0)));

  it('accepts a PDF or a picture by its first bytes, nothing else', () => {
    expect(sniffPaper(bytes('%PDF-1.7\n...'))).toBe('application/pdf');
    expect(sniffPaper(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]))).toBe(
      'image/jpeg',
    );
    expect(sniffPaper(bytes('<html><script>alert(1)</script>'))).toBeNull();
  });
});
