import { describe, expect, it } from 'vitest';
import { calendarRange, linkedCalendarEvents, nextDays } from './linked-calendar';
import type { PluginLinkedApp, PluginLinksApi } from './types';

describe('calendarRange', () => {
  it('accepts up to 62 days', () => {
    expect(calendarRange({ from: '2026-10-01', to: '2026-12-02' })).toEqual({
      from: '2026-10-01',
      to: '2026-12-02',
    });
    expect(calendarRange({ from: '2026-10-01', to: '2026-10-01' })).not.toBeNull();
  });

  it('refuses longer, reversed or malformed ranges', () => {
    expect(calendarRange({ from: '2026-10-01', to: '2026-12-03' })).toBeNull();
    expect(calendarRange({ from: '2026-10-02', to: '2026-10-01' })).toBeNull();
    expect(calendarRange({ from: '2026-10-1', to: '2026-10-05' })).toBeNull();
    expect(calendarRange(null)).toBeNull();
  });
});

describe('nextDays', () => {
  it('counts today in', () => {
    expect(nextDays('2026-10-03')).toEqual({ from: '2026-10-03', to: '2026-11-02' });
    expect(nextDays('2026-12-31', 1)).toEqual({ from: '2026-12-31', to: '2026-12-31' });
  });
});

const app = (id: string, state: PluginLinkedApp['state']): PluginLinkedApp => ({
  app: id,
  name: id.toUpperCase(),
  iconUrl: '',
  benefit: '',
  state,
  openUrl: '',
  connectUrl: '',
});

describe('linkedCalendarEvents', () => {
  it('reads connected apps only, drops malformed events and sorts by day and time', async () => {
    const called: string[] = [];
    const links = {
      list: async () => [app('family', 'connected'), app('utilities', 'available')],
      call: async (other: string) => {
        called.push(other);
        return {
          ok: true,
          data: {
            events: [
              { id: '2', title: 'Late', day: '2026-10-05', startsAt: '2026-10-05T18:00:00Z' },
              { id: '1', title: 'Early', day: '2026-10-05', startsAt: null, target: 'calendar' },
              { id: '3', title: 42, day: '2026-10-05', startsAt: null },
              { id: '4', title: 'Bad day', day: 'tomorrow', startsAt: null },
            ],
          },
        };
      },
      deepLink: (other: string, target: string) => `https://${other}.example/${target}`,
    } as unknown as PluginLinksApi;
    const events = await linkedCalendarEvents(links, { from: '2026-10-01', to: '2026-10-31' }, '/');
    expect(called).toEqual(['family']);
    expect(events.map((e) => [e.title, e.appName, e.url])).toEqual([
      ['Early', 'FAMILY', 'https://family.example/calendar'],
      ['Late', 'FAMILY', null],
    ]);
  });

  it('is empty without links or when a call fails', async () => {
    expect(await linkedCalendarEvents(undefined, nextDays('2026-10-03'), '/')).toEqual([]);
    const failing = {
      list: async () => [app('family', 'connected')],
      call: async () => ({ ok: false, error: 'not-declared' }),
      deepLink: () => null,
    } as unknown as PluginLinksApi;
    expect(await linkedCalendarEvents(failing, nextDays('2026-10-03'), '/')).toEqual([]);
  });
});
