import type { PluginDatabase, PluginPushMessage } from '@devquake/plugin-sdk';
import { describe, expect, it } from 'vitest';
import { changedDrivers, withRouteNotice } from './notify';

type Stop = {
  driver_id: number;
  person_id: number;
  delivered: number;
  delivery_note: string | null;
};

/** Route stops in memory; the drivers' table: driver 1 → user 10, 2 → user 20, 3 → no account. */
function fakeDb(stops: Stop[]) {
  const db = {
    stops,
    async query(sql: string, params: unknown[] = []) {
      if (sql.includes('FROM canteen_route_stops')) return db.stops.map((s) => ({ ...s }));
      const ids = params.slice(1).map(Number);
      const users: Record<number, number | null> = { 1: 10, 2: 20, 3: null };
      return ids.map((d) => ({ user_id: users[d] ?? null, org: 'Meals on wheels' }));
    },
    async execute() {
      return { affectedRows: 0, insertId: 0 };
    },
  };
  return db;
}

function recorder() {
  const sent: { userId: number; message: PluginPushMessage }[] = [];
  return {
    sent,
    push: {
      async send(userId: number, message: PluginPushMessage) {
        sent.push({ userId, message });
        return 1;
      },
    },
  };
}

const stop = (driver: number, person: number, delivered = 0, note: string | null = null): Stop => ({
  driver_id: driver,
  person_id: person,
  delivered,
  delivery_note: note,
});

describe('changedDrivers', () => {
  it('finds drivers who gained, lost, reordered or had a stop ticked', () => {
    const before = new Map([
      [1, 'a'],
      [2, 'b'],
      [3, 'c'],
    ]);
    const after = new Map([
      [1, 'a'],
      [2, 'b2'],
      [4, 'd'],
    ]);
    expect(changedDrivers(before, after)).toEqual([2, 3, 4]);
  });
});

describe('withRouteNotice', () => {
  const today = '2026-10-31';

  it('tells only the drivers whose route changed, never the person who changed it', async () => {
    const db = fakeDb([stop(1, 100), stop(2, 200)]);
    const { push, sent } = recorder();
    await withRouteNotice(
      { db: db as unknown as PluginDatabase, push, user: { id: 99 }, today },
      7,
      today,
      async () => {
        db.stops = [stop(1, 100), stop(2, 200, 0, 'Ring twice')];
      },
    );
    expect(sent).toEqual([
      {
        userId: 20,
        message: {
          kind: 'route_changed_today',
          args: ['Meals on wheels'],
          ref: `route:7:${today}`,
        },
      },
    ]);
  });

  it('tells both drivers when a stop moves from one route to another, tomorrow', async () => {
    const db = fakeDb([stop(1, 100), stop(2, 200)]);
    const { push, sent } = recorder();
    await withRouteNotice(
      { db: db as unknown as PluginDatabase, push, user: { id: 99 }, today },
      7,
      '2026-11-01',
      async () => {
        db.stops = [stop(1, 100), stop(1, 200)];
      },
    );
    expect(sent.map((s) => [s.userId, s.message.kind])).toEqual([
      [10, 'route_changed_tomorrow'],
      [20, 'route_changed_tomorrow'],
    ]);
  });

  it("tells nobody about the driver's own tick, later days, or drivers without an account", async () => {
    const { push, sent } = recorder();
    const own = fakeDb([stop(1, 100)]);
    await withRouteNotice(
      { db: own as unknown as PluginDatabase, push, user: { id: 10 }, today },
      7,
      today,
      async () => {
        own.stops = [stop(1, 100, 1)];
      },
    );
    const later = fakeDb([stop(1, 100)]);
    await withRouteNotice(
      { db: later as unknown as PluginDatabase, push, user: { id: 99 }, today },
      7,
      '2026-11-05',
      async () => {
        later.stops = [];
      },
    );
    const none = fakeDb([stop(3, 100)]);
    await withRouteNotice(
      { db: none as unknown as PluginDatabase, push, user: { id: 99 }, today },
      7,
      today,
      async () => {
        none.stops = [];
      },
    );
    expect(sent).toEqual([]);
  });
});
