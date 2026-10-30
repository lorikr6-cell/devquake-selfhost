import { describe, expect, it } from 'vitest';
import { linkedActivity, localDayOf, utcSearchWindow } from './linked-activity';
import type { PluginLinkedApp, PluginLinksApi } from './types';

const app = (id: string, state: PluginLinkedApp['state']): PluginLinkedApp => ({
  app: id,
  name: id.toUpperCase(),
  iconUrl: '',
  benefit: '',
  state,
  openUrl: '',
  connectUrl: '',
});

describe('localDayOf', () => {
  it('gives the member’s own calendar day', () => {
    const lateEvening = new Date('2026-10-05T22:30:00Z');
    expect(localDayOf(lateEvening, 'Europe/Bucharest')).toBe('2026-10-06');
    expect(localDayOf(lateEvening, 'America/New_York')).toBe('2026-10-05');
    expect(localDayOf(lateEvening, 'Not/AZone')).toBe('2026-10-05');
  });

  it('searches a day more on each side', () => {
    expect(utcSearchWindow({ from: '2026-10-05', to: '2026-10-05' })).toEqual({
      start: new Date('2026-10-04T00:00:00Z'),
      end: new Date('2026-10-07T00:00:00Z'),
    });
  });
});

describe('linkedActivity', () => {
  it('reads connected apps, keeps the range, trims and links each item', async () => {
    const links = {
      list: async () => [app('workout', 'connected'), app('darts', 'needs-access')],
      call: async (other: string) => ({
        ok: true,
        data: {
          items: [
            {
              id: 's:1',
              day: '2026-10-05',
              icon: '🏋️',
              title: 'Legs',
              detail: '40 min',
              target: 'session',
              params: { id: '1' },
            },
            { id: 's:2', day: '2026-09-30', title: 'Outside the range' },
            { id: 's:3', day: '2026-10-04', title: 'x'.repeat(500) },
            { id: 's:4', day: '2026-10-04', title: 7 },
          ],
          other,
        },
      }),
      deepLink: (other: string, target: string, params: Record<string, string>) =>
        `https://${other}.example/${target}/${params.id}`,
    } as unknown as PluginLinksApi;
    const items = await linkedActivity(links, { from: '2026-10-01', to: '2026-10-31' }, '/journal');
    expect(items.map((i) => [i.day, i.title.length, i.url])).toEqual([
      ['2026-10-04', 120, null],
      ['2026-10-05', 4, 'https://workout.example/session/1'],
    ]);
    expect(items[1]).toMatchObject({ appName: 'WORKOUT', icon: '🏋️', detail: '40 min' });
  });

  it('is empty without links or when a call fails', async () => {
    expect(await linkedActivity(undefined, { from: '2026-10-01', to: '2026-10-02' }, '/')).toEqual(
      [],
    );
    const failing = {
      list: async () => [app('workout', 'connected')],
      call: async () => {
        throw new Error('down');
      },
      deepLink: () => null,
    } as unknown as PluginLinksApi;
    expect(await linkedActivity(failing, { from: '2026-10-01', to: '2026-10-02' }, '/')).toEqual(
      [],
    );
  });
});
