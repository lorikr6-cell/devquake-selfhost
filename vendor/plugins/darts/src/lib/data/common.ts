import type { PluginDatabase } from '@devquake/plugin-sdk';
import { dartsToText, textToDarts } from '../engine/darts';
import { play, type GameSetup, type GameState, type Visit } from '../engine/engine';
import { isGameType, normalizeOptions, type GameType, type Mode } from '../engine/games';
import { HttpError } from '../http';
import { newCode, type GameStatus } from '../model';

/** Shared helpers of the data layer (the app's OWN database, ADR 0007). */

export type Db = Omit<PluginDatabase, 'transaction'>;
export { HttpError };

export const iso = (v: Date | string | null | undefined): string | null =>
  v === null || v === undefined ? null : new Date(v).toISOString();

export function parseJson<T>(text: string | null | undefined, fallback: T): T {
  try {
    return text ? (JSON.parse(text) as T) : fallback;
  } catch {
    return fallback;
  }
}

export const notFound = () => new HttpError(404, 'notFound');
export const forbidden = (key = 'notAllowed') => new HttpError(403, key);
export const conflict = (key: string, params?: Record<string, string | number>) =>
  new HttpError(409, key, params);

/** A code no game, tournament or board uses yet. */
export async function uniqueCode(db: Db): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = newCode();
    const [row] = await db.query<{ n: number | string }>(
      `SELECT (SELECT COUNT(*) FROM games WHERE join_code = ? OR watch_code = ?)
            + (SELECT COUNT(*) FROM tournaments WHERE join_code = ?)
            + (SELECT COUNT(*) FROM boards WHERE code = ?) AS n`,
      [code, code, code, code],
    );
    if (!Number(row?.n)) return code;
  }
  throw new Error('darts: no free code');
}

export { dartsToText, textToDarts };

// ---- game rows ----------------------------------------------------------------------------------

export interface GameRow {
  id: number;
  mode: Mode;
  game_type: string;
  options: string;
  owner_user_id: number | null;
  status: GameStatus;
  join_code: string | null;
  watch_code: string;
  tournament_id: number | null;
  round: number | null;
  board_id: number | null;
  drill_id: number | null;
  winner_player_id: number | null;
  version: number;
  created_at: Date;
  started_at: Date | null;
  finished_at: Date | null;
}

export interface PlayerRow {
  id: number;
  game_id: number;
  user_id: number | null;
  display_name: string;
  seat: number;
  number: number | null;
  tournament_player_id: number | null;
}

export interface VisitRow {
  game_id: number;
  player_id: number;
  seq: number;
  darts: string;
}

export const GAME_COLUMNS = `id, mode, game_type, options, owner_user_id, status, join_code,
  watch_code, tournament_id, round, board_id, drill_id, winner_player_id, version, created_at,
  started_at, finished_at`;

export interface LoadedGame {
  game: GameRow;
  players: PlayerRow[];
  visits: VisitRow[];
}

export function gameType(row: { game_type: string }): GameType {
  // Stored by the app itself; an unknown type would be a bug.
  if (!isGameType(row.game_type)) throw new Error(`darts: unknown game type ${row.game_type}`);
  return row.game_type;
}

export function setupOf(game: GameRow, players: PlayerRow[]): GameSetup {
  const type = gameType(game);
  return {
    type,
    options: normalizeOptions(type, parseJson(game.options, {})),
    seats: [...players]
      .sort((a, b) => a.seat - b.seat)
      .map((p) => ({ id: p.id, name: p.display_name, number: p.number })),
  };
}

export const visitsOf = (rows: VisitRow[]): Visit[] =>
  [...rows]
    .sort((a, b) => a.seq - b.seq)
    .map((v) => ({ playerId: v.player_id, darts: textToDarts(v.darts) }));

export function stateOf(loaded: LoadedGame): GameState {
  return play(setupOf(loaded.game, loaded.players), visitsOf(loaded.visits));
}

const placeholders = (n: number) => Array.from({ length: n }, () => '?').join(',');

/** Games with their players and visits (in the order of `ids`). */
export async function loadGames(db: Db, ids: number[]): Promise<LoadedGame[]> {
  if (ids.length === 0) return [];
  const list = placeholders(ids.length);
  const [games, players, visits] = await Promise.all([
    db.query<GameRow>(`SELECT ${GAME_COLUMNS} FROM games WHERE id IN (${list})`, ids),
    db.query<PlayerRow>(
      `SELECT id, game_id, user_id, display_name, seat, number, tournament_player_id
         FROM game_players WHERE game_id IN (${list}) ORDER BY seat, id`,
      ids,
    ),
    db.query<VisitRow>(
      `SELECT game_id, player_id, seq, darts FROM visits WHERE game_id IN (${list}) ORDER BY seq`,
      ids,
    ),
  ]);
  const byId = new Map(games.map((g) => [g.id, g]));
  return ids
    .filter((id) => byId.has(id))
    .map((id) => ({
      game: byId.get(id)!,
      players: players.filter((p) => p.game_id === id),
      visits: visits.filter((v) => v.game_id === id),
    }));
}

export async function loadGame(db: Db, id: number): Promise<LoadedGame> {
  const [loaded] = await loadGames(db, [id]);
  if (!loaded) throw notFound();
  return loaded;
}

export async function bumpGame(db: Db, id: number) {
  await db.execute('UPDATE games SET version = version + 1 WHERE id = ?', [id]);
}

export async function bumpTournament(db: Db, id: number) {
  await db.execute('UPDATE tournaments SET version = version + 1 WHERE id = ?', [id]);
}

export { placeholders };
