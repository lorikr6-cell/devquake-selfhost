import type { PluginDatabase } from '@devquake/plugin-sdk';
import { isGameType, normalizeOptions } from '../engine/games';
import type { DrillPlan, DrillReason } from '../drills';
import type { DrillView } from '../views';
import { iso, notFound, parseJson, type Db } from './common';

/** Practice drills made from a player's statistics. Only their owner sees or plays them. */

interface DrillRow {
  id: number;
  reason: DrillReason;
  game_type: string;
  options: string;
  params: string;
  played: number;
  created_at: Date;
}

function toView(r: DrillRow): DrillView | null {
  if (!isGameType(r.game_type)) return null;
  return {
    id: r.id,
    reason: r.reason,
    type: r.game_type,
    options: normalizeOptions(r.game_type, parseJson(r.options, {})),
    params: parseJson(r.params, {}),
    played: r.played,
    createdAt: iso(r.created_at)!,
  };
}

export async function listDrills(db: Db, userId: number): Promise<DrillView[]> {
  const rows = await db.query<DrillRow>(
    `SELECT id, reason, game_type, options, params, played, created_at
       FROM drills WHERE user_id = ? ORDER BY created_at DESC, id`,
    [userId],
  );
  return rows.map(toView).filter((d): d is DrillView => d !== null);
}

export async function getDrill(db: Db, id: number, userId: number): Promise<DrillView> {
  const [row] = await db.query<DrillRow>(
    `SELECT id, reason, game_type, options, params, played, created_at
       FROM drills WHERE id = ? AND user_id = ?`,
    [id, userId],
  );
  const view = row ? toView(row) : null;
  if (!view) throw notFound();
  return view;
}

/** New drills replace the ones never played; played drills stay until deleted. */
export async function saveDrills(db: PluginDatabase, userId: number, plans: DrillPlan[]) {
  await db.transaction(async (tx) => {
    await tx.execute('DELETE FROM drills WHERE user_id = ? AND played = 0', [userId]);
    for (const p of plans) {
      await tx.execute(
        'INSERT INTO drills (user_id, reason, game_type, options, params) VALUES (?, ?, ?, ?, ?)',
        [userId, p.reason, p.type, JSON.stringify(p.options), JSON.stringify(p.params)],
      );
    }
  });
}

export async function deleteDrill(db: Db, id: number, userId: number) {
  const { affectedRows } = await db.execute('DELETE FROM drills WHERE id = ? AND user_id = ?', [
    id,
    userId,
  ]);
  if (!affectedRows) throw notFound();
}
