import type { PluginDatabase, PluginUser } from '@devquake/plugin-sdk';
import type { Dart } from '../engine/darts';
import { play } from '../engine/engine';
import {
  PLAYER_LIMITS,
  isGameType,
  normalizeOptions,
  type GameOptions,
  type GameType,
  type Mode,
} from '../engine/games';
import type { DrillReason } from '../drills';
import type { Profile } from '../model';
import type { GameRecord } from '../stats';
import type { GameSummary, GameView } from '../views';
import {
  GAME_COLUMNS,
  bumpGame,
  conflict,
  dartsToText,
  forbidden,
  gameType,
  iso,
  loadGame,
  loadGames,
  notFound,
  parseJson,
  placeholders,
  setupOf,
  uniqueCode,
  visitsOf,
  type Db,
  type GameRow,
  type LoadedGame,
  type PlayerRow,
  type VisitRow,
} from './common';
import { matchFinished } from './tournaments';

/**
 * Games on the app's own database. Rules: practice games have one player and start at once;
 * casual games wait for players who join with the code, and their owner starts them, removes
 * players, or deletes them; tournament matches belong to the tournament (see tournaments.ts).
 * Only a game's players throw, only the player whose turn it is, and every visit is checked by
 * replaying the game with the rules (src/lib/engine).
 */

export interface NewGame {
  mode: Extract<Mode, 'practice' | 'casual'>;
  type: GameType;
  options: GameOptions;
  drillId?: number | null;
}

export async function createGame(
  db: PluginDatabase,
  user: PluginUser,
  profile: Profile,
  input: NewGame,
): Promise<number> {
  return db.transaction(async (tx) => {
    const watch = await uniqueCode(tx);
    const join = input.mode === 'casual' ? await uniqueCode(tx) : null;
    const practice = input.mode === 'practice';
    const { insertId } = await tx.execute(
      `INSERT INTO games (mode, game_type, options, owner_user_id, status, join_code, watch_code,
                          drill_id, started_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ${practice ? 'UTC_TIMESTAMP()' : 'NULL'})`,
      [
        input.mode,
        input.type,
        JSON.stringify(input.options),
        user.id,
        practice ? 'playing' : 'waiting',
        join,
        watch,
        input.drillId ?? null,
      ],
    );
    await tx.execute(
      'INSERT INTO game_players (game_id, user_id, display_name, seat) VALUES (?, ?, ?, 0)',
      [insertId, user.id, profile.nickname],
    );
    if (input.drillId) {
      await tx.execute(
        `UPDATE drills SET played = played + 1, last_played_at = UTC_TIMESTAMP()
          WHERE id = ? AND user_id = ?`,
        [input.drillId, user.id],
      );
    }
    return insertId;
  });
}

/** Joins the casual game behind a join code; returns its id (also when already a player). */
export async function joinGame(
  db: PluginDatabase,
  gameId: number,
  user: PluginUser,
  profile: Profile,
): Promise<number> {
  return db.transaction(async (tx) => {
    const [game] = await tx.query<GameRow>(
      `SELECT ${GAME_COLUMNS} FROM games WHERE id = ? FOR UPDATE`,
      [gameId],
    );
    if (!game || game.mode !== 'casual') throw notFound();
    const players = await tx.query<PlayerRow>(
      'SELECT id, user_id, seat FROM game_players WHERE game_id = ? ORDER BY seat',
      [gameId],
    );
    if (players.some((p) => p.user_id === user.id)) return gameId;
    if (game.status !== 'waiting') throw conflict('alreadyStarted');
    const { max } = PLAYER_LIMITS[gameType(game)];
    if (players.length >= max) throw conflict('gameFull', { max });
    const seat = Math.max(-1, ...players.map((p) => p.seat)) + 1;
    await tx.execute(
      'INSERT INTO game_players (game_id, user_id, display_name, seat) VALUES (?, ?, ?, ?)',
      [gameId, user.id, profile.nickname, seat],
    );
    await bumpGame(tx, gameId);
    return gameId;
  });
}

function shuffle<T>(list: T[]): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = crypto.getRandomValues(new Uint32Array(1))[0]! % (i + 1);
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/** The owner starts a casual game (Killer numbers are drawn now). */
export async function startGame(
  db: PluginDatabase,
  gameId: number,
  userId: number,
  randomOrder: boolean,
) {
  await db.transaction(async (tx) => {
    const [game] = await tx.query<GameRow>(
      `SELECT ${GAME_COLUMNS} FROM games WHERE id = ? FOR UPDATE`,
      [gameId],
    );
    if (!game || game.mode !== 'casual') throw notFound();
    if (game.owner_user_id !== userId) throw forbidden();
    if (game.status !== 'waiting') throw conflict('alreadyStarted');
    const type = gameType(game);
    const players = await tx.query<PlayerRow>(
      'SELECT id, seat FROM game_players WHERE game_id = ? ORDER BY seat',
      [gameId],
    );
    const { min } = PLAYER_LIMITS[type];
    if (players.length < min) throw conflict('needPlayers', { min });
    const order = randomOrder ? shuffle(players) : players;
    const numbers = shuffle(Array.from({ length: 20 }, (_, i) => i + 1));
    for (const [seat, p] of order.entries()) {
      await tx.execute('UPDATE game_players SET seat = ?, number = ? WHERE id = ?', [
        seat,
        type === 'killer' ? numbers[seat]! : null,
        p.id,
      ]);
    }
    await tx.execute(
      `UPDATE games SET status = 'playing', started_at = UTC_TIMESTAMP(), join_code = NULL,
              version = version + 1 WHERE id = ?`,
      [gameId],
    );
  });
}

/**
 * The owner removes a player, or a player leaves. A game already being played starts over
 * without them (it waits for players again), so someone else can join.
 */
export async function removePlayer(
  db: PluginDatabase,
  gameId: number,
  userId: number,
  playerId: number,
) {
  await db.transaction(async (tx) => {
    const [game] = await tx.query<GameRow>(
      `SELECT ${GAME_COLUMNS} FROM games WHERE id = ? FOR UPDATE`,
      [gameId],
    );
    if (!game || game.mode !== 'casual') throw notFound();
    const [target] = await tx.query<PlayerRow>(
      'SELECT id, user_id FROM game_players WHERE id = ? AND game_id = ?',
      [playerId, gameId],
    );
    if (!target) throw notFound();
    const isOwner = game.owner_user_id === userId;
    const isSelf = target.user_id === userId;
    if (target.user_id === game.owner_user_id) throw forbidden('ownerStays');
    if (!isOwner && !isSelf) throw forbidden();
    if (game.status === 'finished') throw conflict('gameOver');
    await tx.execute('DELETE FROM visits WHERE game_id = ?', [gameId]);
    await tx.execute('DELETE FROM game_players WHERE id = ?', [playerId]);
    await tx.execute('UPDATE game_players SET number = NULL WHERE game_id = ?', [gameId]);
    const code = game.join_code ?? (await uniqueCode(tx));
    await tx.execute(
      `UPDATE games SET status = 'waiting', started_at = NULL, join_code = ?,
              version = version + 1 WHERE id = ?`,
      [code, gameId],
    );
  });
}

/** The owner deletes a practice or casual game (with everything thrown in it). */
export async function deleteGame(db: Db, gameId: number, userId: number) {
  const [game] = await db.query<GameRow>(`SELECT ${GAME_COLUMNS} FROM games WHERE id = ?`, [
    gameId,
  ]);
  if (!game || game.tournament_id !== null) throw notFound();
  if (game.owner_user_id !== userId) throw forbidden();
  await db.execute('DELETE FROM games WHERE id = ?', [gameId]);
}

/**
 * A visit by the signed-in player. `seq` is the number of visits they saw: if someone else
 * threw in the meantime the visit is refused (errors.outOfDate) instead of counted twice.
 */
export async function addVisit(
  db: PluginDatabase,
  gameId: number,
  userId: number,
  darts: Dart[],
  seq: number,
) {
  await db.transaction(async (tx) => {
    const [game] = await tx.query<GameRow>(
      `SELECT ${GAME_COLUMNS} FROM games WHERE id = ? FOR UPDATE`,
      [gameId],
    );
    if (!game) throw notFound();
    const players = await tx.query<PlayerRow>(
      `SELECT id, game_id, user_id, display_name, seat, number, tournament_player_id
         FROM game_players WHERE game_id = ? ORDER BY seat`,
      [gameId],
    );
    const me = players.find((p) => p.user_id === userId);
    if (!me) throw forbidden('notPlayer');
    if (game.status === 'waiting') throw conflict('notStarted');
    if (game.status === 'finished') throw conflict('gameOver');
    if (game.tournament_id !== null && game.board_id === null) throw conflict('waitingBoard');
    const visits = await tx.query<VisitRow>(
      'SELECT game_id, player_id, seq, darts FROM visits WHERE game_id = ? ORDER BY seq',
      [gameId],
    );
    if (seq !== visits.length) throw conflict('outOfDate');
    // Throws EngineError (not your turn, a dart after a bust...) and rolls back.
    const state = play(setupOf(game, players), [...visitsOf(visits), { playerId: me.id, darts }]);
    await tx.execute('INSERT INTO visits (game_id, player_id, seq, darts) VALUES (?, ?, ?, ?)', [
      gameId,
      me.id,
      seq,
      dartsToText(darts),
    ]);
    if (!state.finished) {
      await bumpGame(tx, gameId);
      return;
    }
    await tx.execute(
      `UPDATE games SET status = 'finished', winner_player_id = ?, finished_at = UTC_TIMESTAMP(),
              version = version + 1 WHERE id = ?`,
      [state.winner, gameId],
    );
    if (game.tournament_id !== null) await matchFinished(tx, game, players, state.winner);
  });
}

/** Takes back the player's own last visit, while the game is still being played. */
export async function undoVisit(db: PluginDatabase, gameId: number, userId: number) {
  await db.transaction(async (tx) => {
    const [game] = await tx.query<GameRow>(
      `SELECT ${GAME_COLUMNS} FROM games WHERE id = ? FOR UPDATE`,
      [gameId],
    );
    if (!game) throw notFound();
    if (game.status !== 'playing') throw conflict('cannotUndo');
    const [last] = await tx.query<VisitRow & { user_id: number | null }>(
      `SELECT v.seq, v.player_id, p.user_id FROM visits v
         JOIN game_players p ON p.id = v.player_id
        WHERE v.game_id = ? ORDER BY v.seq DESC LIMIT 1`,
      [gameId],
    );
    if (!last || last.user_id !== userId) throw conflict('cannotUndo');
    await tx.execute('DELETE FROM visits WHERE game_id = ? AND seq = ?', [gameId, last.seq]);
    await bumpGame(tx, gameId);
  });
}

// ---- views --------------------------------------------------------------------------------------

async function tournamentInfo(db: Db, game: GameRow) {
  if (game.tournament_id === null) return null;
  const [row] = await db.query<{ name: string; board: string | null }>(
    `SELECT t.name, b.name AS board FROM tournaments t
       LEFT JOIN boards b ON b.id = ? WHERE t.id = ?`,
    [game.board_id, game.tournament_id],
  );
  return row
    ? { id: game.tournament_id, name: row.name, round: game.round ?? 0, board: row.board }
    : null;
}

function toView(
  loaded: LoadedGame,
  userId: number | null,
  tournament: GameView['tournament'],
  canShare: boolean,
): GameView {
  const { game, players, visits } = loaded;
  const type = gameType(game);
  const me = players.find((p) => userId !== null && p.user_id === userId) ?? null;
  const isOwner = userId !== null && game.owner_user_id === userId;
  return {
    id: game.id,
    mode: game.mode,
    type,
    options: setupOf(game, players).options,
    status: game.status,
    version: game.version,
    isOwner,
    me: me?.id ?? null,
    players: [...players]
      .sort((a, b) => a.seat - b.seat)
      .map((p) => ({
        id: p.id,
        name: p.display_name,
        isMe: me?.id === p.id,
        number: p.number,
      })),
    visits: [...visits]
      .sort((a, b) => a.seq - b.seq)
      .map((v) => ({
        playerId: v.player_id,
        darts: v.darts,
      })),
    joinCode: isOwner && game.status === 'waiting' ? game.join_code : null,
    watchCode: canShare ? game.watch_code : null,
    tournament,
    drillId: game.drill_id,
    winnerPlayerId: game.winner_player_id,
    createdAt: iso(game.created_at)!,
    finishedAt: iso(game.finished_at),
  };
}

export type GameAccess = 'player' | 'spectator' | null;

/** Who may see a game by its id: its players, and a tournament's organiser and players. */
export async function gameAccess(db: Db, loaded: LoadedGame, userId: number): Promise<GameAccess> {
  if (loaded.players.some((p) => p.user_id === userId)) return 'player';
  const tid = loaded.game.tournament_id;
  if (tid === null) return null;
  const [row] = await db.query<{ ok: number | string }>(
    `SELECT (SELECT COUNT(*) FROM tournaments WHERE id = ? AND owner_user_id = ?)
          + (SELECT COUNT(*) FROM tournament_players WHERE tournament_id = ? AND user_id = ?) AS ok`,
    [tid, userId, tid, userId],
  );
  return Number(row?.ok) ? 'spectator' : null;
}

/** The game for its players and (read-only) for the tournament's organiser and players. */
export async function gameView(
  db: Db,
  gameId: number,
  userId: number,
): Promise<{ view: GameView; access: Exclude<GameAccess, null> }> {
  const loaded = await loadGame(db, gameId);
  const access = await gameAccess(db, loaded, userId);
  if (!access) throw notFound();
  const view = toView(loaded, userId, await tournamentInfo(db, loaded.game), true);
  return { view, access };
}

/** A game opened with its watch code: anyone signed in may watch (read-only). */
export async function watchView(db: Db, code: string): Promise<GameView> {
  const [row] = await db.query<{ id: number }>('SELECT id FROM games WHERE watch_code = ?', [code]);
  if (!row) throw notFound();
  const loaded = await loadGame(db, row.id);
  return toView(loaded, null, await tournamentInfo(db, loaded.game), true);
}

/** Only the version, for the screens' polling. */
export async function gameVersion(db: Db, gameId: number): Promise<number | null> {
  const [row] = await db.query<{ version: number }>('SELECT version FROM games WHERE id = ?', [
    gameId,
  ]);
  return row ? row.version : null;
}

interface SummaryRow {
  id: number;
  mode: Mode;
  game_type: string;
  options: string;
  status: GameRow['status'];
  winner_player_id: number | null;
  me: number;
  darts: number | string;
  drill_reason: DrillReason | null;
  tournament_name: string | null;
  created_at: Date;
  finished_at: Date | null;
}

/** The signed-in player's games, newest first. */
export async function myGames(
  db: Db,
  userId: number,
  filter: { mode?: Mode; active?: boolean; limit?: number },
): Promise<GameSummary[]> {
  const where: string[] = ['me.user_id = ?'];
  const params: unknown[] = [userId];
  if (filter.mode) {
    where.push('g.mode = ?');
    params.push(filter.mode);
  }
  if (filter.active !== undefined) {
    where.push(filter.active ? "g.status <> 'finished'" : "g.status = 'finished'");
  }
  const rows = await db.query<SummaryRow>(
    `SELECT g.id, g.mode, g.game_type, g.options, g.status, g.winner_player_id, me.id AS me,
            (SELECT COALESCE(SUM(LENGTH(v.darts) - LENGTH(REPLACE(v.darts, ',', '')) + 1), 0)
               FROM visits v WHERE v.player_id = me.id) AS darts,
            d.reason AS drill_reason, t.name AS tournament_name, g.created_at, g.finished_at
       FROM games g
       JOIN game_players me ON me.game_id = g.id
       LEFT JOIN drills d ON d.id = g.drill_id
       LEFT JOIN tournaments t ON t.id = g.tournament_id
      WHERE ${where.join(' AND ')}
      ORDER BY COALESCE(g.finished_at, g.updated_at) DESC, g.id DESC
      LIMIT ${Math.min(100, filter.limit ?? 20)}`,
    params,
  );
  if (rows.length === 0) return [];
  const players = await db.query<PlayerRow>(
    `SELECT id, game_id, display_name, seat FROM game_players
      WHERE game_id IN (${placeholders(rows.length)}) ORDER BY seat`,
    rows.map((r) => r.id),
  );
  return rows.map((r) => {
    const mine = players.filter((p) => p.game_id === r.id);
    const winner = mine.find((p) => p.id === r.winner_player_id);
    const type = isGameType(r.game_type) ? r.game_type : 'x01';
    return {
      id: r.id,
      mode: r.mode,
      type,
      options: normalizeOptions(type, parseJson(r.options, {})),
      status: r.status,
      players: mine.map((p) => p.display_name),
      winner: winner ? winner.display_name : null,
      won: r.winner_player_id === r.me,
      darts: Number(r.darts),
      drillReason: r.drill_reason,
      tournamentName: r.tournament_name,
      createdAt: iso(r.created_at)!,
      finishedAt: iso(r.finished_at),
    };
  });
}

/** Everything needed for the statistics page (the most recent 300 games). */
export async function statsGames(db: Db, userId: number): Promise<GameRecord[]> {
  const rows = await db.query<{ id: number }>(
    `SELECT g.id FROM games g JOIN game_players p ON p.game_id = g.id
      WHERE p.user_id = ? AND g.status <> 'waiting'
      ORDER BY g.id DESC LIMIT 300`,
    [userId],
  );
  const loaded = await loadGames(
    db,
    rows.map((r) => r.id),
  );
  return loaded.map(({ game, players, visits }) => ({
    id: game.id,
    mode: game.mode,
    type: gameType(game),
    options: parseJson(game.options, {}),
    status: game.status as GameRecord['status'],
    finishedAt: iso(game.finished_at),
    winnerPlayerId: game.winner_player_id,
    seats: [...players]
      .sort((a, b) => a.seat - b.seat)
      .map((p) => ({ id: p.id, name: p.display_name, number: p.number, userId: p.user_id })),
    visits: visitsOf(visits),
    tournamentId: game.tournament_id,
  }));
}

/** What a join code (or a watch code typed in the same field) opens. */
export type CodeTarget =
  | { kind: 'game'; id: number }
  | { kind: 'watch'; code: string }
  | { kind: 'tournament'; id: number }
  | { kind: 'board'; tournamentId: number; boardId: number };

export async function resolveCode(db: Db, code: string): Promise<CodeTarget | null> {
  const [game] = await db.query<{ id: number; join_code: string | null }>(
    'SELECT id, join_code FROM games WHERE join_code = ? OR watch_code = ? LIMIT 1',
    [code, code],
  );
  if (game)
    return game.join_code === code ? { kind: 'game', id: game.id } : { kind: 'watch', code };
  const [t] = await db.query<{ id: number }>('SELECT id FROM tournaments WHERE join_code = ?', [
    code,
  ]);
  if (t) return { kind: 'tournament', id: t.id };
  const [b] = await db.query<{ id: number; tournament_id: number }>(
    'SELECT id, tournament_id FROM boards WHERE code = ?',
    [code],
  );
  if (b) return { kind: 'board', tournamentId: b.tournament_id, boardId: b.id };
  return null;
}

/** Casual games waiting for players with no visit for two weeks are removed (scheduled). */
export async function removeStaleGames(db: Db) {
  await db.execute(
    `DELETE FROM games WHERE mode = 'casual' AND status = 'waiting'
        AND updated_at < UTC_TIMESTAMP() - INTERVAL 14 DAY`,
  );
}

/**
 * The player's most frequent three-dart visits in scoring games (X01, Count-Up), most frequent
 * first, as stored text ("T20,20,5"): for the one-click visits on the keypad.
 */
export async function habitVisits(db: Db, userId: number, limit = 6): Promise<string[]> {
  const rows = await db.query<{ darts: string }>(
    `SELECT v.darts FROM visits v
       JOIN game_players p ON p.id = v.player_id
       JOIN games g ON g.id = v.game_id
      WHERE p.user_id = ? AND g.game_type IN ('x01', 'countup')
      ORDER BY v.id DESC LIMIT 500`,
    [userId],
  );
  const counts = new Map<string, number>();
  for (const { darts } of rows) {
    const parts = darts.split(',');
    if (parts.length !== 3) continue;
    // The same darts in any order are the same visit.
    const key = [...parts].sort().join(',');
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([k]) => k);
}
