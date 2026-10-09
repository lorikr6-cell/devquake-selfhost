import type { PluginDatabase, PluginUser } from '@devquake/plugin-sdk';
import { hasLegs, type GameOptions, type GameType } from '../engine/games';
import type { Profile, TournamentStatus } from '../model';
import { analyze, rating } from '../stats';
import {
  MAX_BOARDS,
  MAX_TOURNAMENT_PLAYERS,
  checkPairing,
  suggestPairs,
  type Pairing,
} from '../tournament';
import { progressOf, type ProgressMatch } from '../progress';
import type { BoardView, MatchView, TournamentSummary, TournamentView } from '../views';
import {
  bumpTournament,
  conflict,
  forbidden,
  gameType,
  iso,
  loadGames,
  notFound,
  parseJson,
  placeholders,
  stateOf,
  uniqueCode,
  type Db,
  type GameRow,
  type PlayerRow,
} from './common';
import { statsGames } from './games';

/**
 * Tournaments: a knock-out on the organiser's boards. Players join with the tournament's code or
 * a board's code (QR); each is placed on a board. The organiser draws one round at a time: the
 * app suggests pairs of similar strength, the organiser may swap players, then the round's
 * matches are created and put on free boards (the rest wait for a board). When a match ends,
 * its loser is out and its board goes to the next waiting match; the last player left wins.
 */

interface TournamentRow {
  id: number;
  owner_user_id: number;
  owner_name: string;
  name: string;
  game_type: string;
  options: string;
  fee_cents: number;
  currency: string;
  organizer_pct: number;
  status: TournamentStatus;
  join_code: string;
  round: number;
  champion_player_id: number | null;
  version: number;
  created_at: Date;
  started_at: Date | null;
  finished_at: Date | null;
}

interface TPlayerRow {
  id: number;
  user_id: number | null;
  display_name: string;
  board_id: number | null;
  rating: number | string;
  paid: number;
  bye_round: number | null;
  eliminated_round: number | null;
}

interface BoardRow {
  id: number;
  name: string;
  code: string;
  position: number;
}

export interface NewTournament {
  name: string;
  type: GameType;
  options: GameOptions;
  feeCents: number;
  currency: string;
  organizerPct: number;
  boards: number;
  /** The organiser plays too. */
  play: boolean;
}

async function tournamentRow(db: Db, id: number, lock = false): Promise<TournamentRow> {
  const [row] = await db.query<TournamentRow>(
    `SELECT * FROM tournaments WHERE id = ?${lock ? ' FOR UPDATE' : ''}`,
    [id],
  );
  if (!row) throw notFound();
  return row;
}

async function ownTournament(db: Db, id: number, userId: number, lock = false) {
  const t = await tournamentRow(db, id, lock);
  if (t.owner_user_id !== userId) throw forbidden();
  return t;
}

/** The player's strength for pairing: their X01 average so far, else their level. */
async function playerRating(db: Db, userId: number, profile: Profile): Promise<number> {
  const a = analyze(await statsGames(db, userId), userId);
  return rating(a.average, profile.level);
}

export async function createTournament(
  db: PluginDatabase,
  user: PluginUser,
  profile: Profile,
  input: NewTournament,
): Promise<number> {
  const myRating = input.play ? await playerRating(db, user.id, profile) : 0;
  return db.transaction(async (tx) => {
    const { insertId } = await tx.execute(
      `INSERT INTO tournaments (owner_user_id, owner_name, name, game_type, options, fee_cents,
                                currency, organizer_pct, join_code)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user.id,
        profile.nickname,
        input.name,
        input.type,
        JSON.stringify(input.options),
        input.feeCents,
        input.currency,
        input.organizerPct,
        await uniqueCode(tx),
      ],
    );
    for (let i = 1; i <= input.boards; i++) {
      await tx.execute(
        'INSERT INTO boards (tournament_id, name, code, position) VALUES (?, ?, ?, ?)',
        [insertId, String(i), await uniqueCode(tx), i],
      );
    }
    if (input.play) await addPlayer(tx, insertId, user.id, profile.nickname, myRating, null);
    return insertId;
  });
}

/** The board with the fewest players (the first one on a tie). */
async function quietestBoard(db: Db, tournamentId: number): Promise<number | null> {
  const [row] = await db.query<{ id: number }>(
    `SELECT b.id FROM boards b
       LEFT JOIN tournament_players p ON p.board_id = b.id
      WHERE b.tournament_id = ?
      GROUP BY b.id, b.position ORDER BY COUNT(p.id), b.position LIMIT 1`,
    [tournamentId],
  );
  return row?.id ?? null;
}

async function addPlayer(
  db: Db,
  tournamentId: number,
  userId: number,
  name: string,
  playerRating: number,
  boardId: number | null,
) {
  const board = boardId ?? (await quietestBoard(db, tournamentId));
  await db.execute(
    `INSERT IGNORE INTO tournament_players (tournament_id, user_id, display_name, board_id, rating)
     VALUES (?, ?, ?, ?, ?)`,
    [tournamentId, userId, name, board, playerRating],
  );
}

/** Joins a tournament during registration (with a board's code: on that board). */
export async function joinTournament(
  db: PluginDatabase,
  tournamentId: number,
  user: PluginUser,
  profile: Profile,
  boardId: number | null,
) {
  const myRating = await playerRating(db, user.id, profile);
  await db.transaction(async (tx) => {
    const t = await tournamentRow(tx, tournamentId, true);
    const [mine] = await tx.query<{ id: number }>(
      'SELECT id FROM tournament_players WHERE tournament_id = ? AND user_id = ?',
      [tournamentId, user.id],
    );
    if (mine) {
      if (boardId !== null && t.status === 'registration') {
        await tx.execute('UPDATE tournament_players SET board_id = ? WHERE id = ?', [
          boardId,
          mine.id,
        ]);
        await bumpTournament(tx, tournamentId);
      }
      return;
    }
    if (t.status !== 'registration') throw conflict('registrationClosed');
    const [count] = await tx.query<{ n: number | string }>(
      'SELECT COUNT(*) AS n FROM tournament_players WHERE tournament_id = ?',
      [tournamentId],
    );
    if (Number(count?.n) >= MAX_TOURNAMENT_PLAYERS) {
      throw conflict('tournamentFull', { max: MAX_TOURNAMENT_PLAYERS });
    }
    await addPlayer(tx, tournamentId, user.id, profile.nickname, myRating, boardId);
    await bumpTournament(tx, tournamentId);
  });
}

// ---- organiser: settings, boards, players --------------------------------------------------------

export interface TournamentSettings {
  name: string;
  feeCents: number;
  currency: string;
  organizerPct: number;
}

/** The name can always change; the fee and its split only before the first round. */
export async function updateTournament(
  db: Db,
  tournamentId: number,
  userId: number,
  s: TournamentSettings,
) {
  const t = await ownTournament(db, tournamentId, userId);
  if (t.status === 'registration') {
    await db.execute(
      `UPDATE tournaments SET name = ?, fee_cents = ?, currency = ?, organizer_pct = ?,
              version = version + 1 WHERE id = ?`,
      [s.name, s.feeCents, s.currency, s.organizerPct, tournamentId],
    );
  } else {
    await db.execute('UPDATE tournaments SET name = ?, version = version + 1 WHERE id = ?', [
      s.name,
      tournamentId,
    ]);
  }
}

export async function deleteTournament(db: Db, tournamentId: number, userId: number) {
  await ownTournament(db, tournamentId, userId);
  await db.execute('DELETE FROM tournaments WHERE id = ?', [tournamentId]);
}

export async function addBoard(db: PluginDatabase, tournamentId: number, userId: number) {
  await db.transaction(async (tx) => {
    const t = await ownTournament(tx, tournamentId, userId, true);
    if (t.status === 'finished') throw conflict('tournamentOver');
    const boards = await tx.query<BoardRow>(
      'SELECT id, position FROM boards WHERE tournament_id = ?',
      [tournamentId],
    );
    if (boards.length >= MAX_BOARDS) throw conflict('boards', { max: MAX_BOARDS });
    const position = Math.max(0, ...boards.map((b) => b.position)) + 1;
    const { insertId } = await tx.execute(
      'INSERT INTO boards (tournament_id, name, code, position) VALUES (?, ?, ?, ?)',
      [tournamentId, String(position), await uniqueCode(tx), position],
    );
    // A new board takes the first match waiting for one.
    await assignWaitingMatches(tx, tournamentId, [insertId]);
    await bumpTournament(tx, tournamentId);
  });
}

export async function renameBoard(
  db: Db,
  tournamentId: number,
  userId: number,
  boardId: number,
  name: string,
) {
  await ownTournament(db, tournamentId, userId);
  const { affectedRows } = await db.execute(
    'UPDATE boards SET name = ? WHERE id = ? AND tournament_id = ?',
    [name, boardId, tournamentId],
  );
  if (!affectedRows) throw notFound();
  await bumpTournament(db, tournamentId);
}

/** A board without a match on it can be removed; its players move to the other boards. */
export async function deleteBoard(db: Db, tournamentId: number, userId: number, boardId: number) {
  await ownTournament(db, tournamentId, userId);
  const [busy] = await db.query<{ id: number }>(
    "SELECT id FROM games WHERE board_id = ? AND status = 'playing' LIMIT 1",
    [boardId],
  );
  if (busy) throw conflict('boardBusy');
  const [count] = await db.query<{ n: number | string }>(
    'SELECT COUNT(*) AS n FROM boards WHERE tournament_id = ?',
    [tournamentId],
  );
  if (Number(count?.n) <= 1) throw conflict('lastBoard');
  const { affectedRows } = await db.execute(
    'DELETE FROM boards WHERE id = ? AND tournament_id = ?',
    [boardId, tournamentId],
  );
  if (!affectedRows) throw notFound();
  const moved = await db.query<{ id: number }>(
    'SELECT id FROM tournament_players WHERE tournament_id = ? AND board_id IS NULL',
    [tournamentId],
  );
  for (const p of moved) {
    await db.execute('UPDATE tournament_players SET board_id = ? WHERE id = ?', [
      await quietestBoard(db, tournamentId),
      p.id,
    ]);
  }
  await bumpTournament(db, tournamentId);
}

/** The organiser marks the entry fee as paid, or moves a player to another board. */
export async function updateTournamentPlayer(
  db: Db,
  tournamentId: number,
  userId: number,
  playerId: number,
  change: { paid?: boolean; boardId?: number },
) {
  await ownTournament(db, tournamentId, userId);
  if (change.boardId !== undefined) {
    const [board] = await db.query<{ id: number }>(
      'SELECT id FROM boards WHERE id = ? AND tournament_id = ?',
      [change.boardId, tournamentId],
    );
    if (!board) throw notFound();
  }
  const { affectedRows } = await db.execute(
    `UPDATE tournament_players SET paid = COALESCE(?, paid), board_id = COALESCE(?, board_id)
      WHERE id = ? AND tournament_id = ?`,
    [
      change.paid === undefined ? null : change.paid ? 1 : 0,
      change.boardId ?? null,
      playerId,
      tournamentId,
    ],
  );
  if (!affectedRows) throw notFound();
  await bumpTournament(db, tournamentId);
}

/** Before the first round the organiser removes a player, or a player leaves. */
export async function removeTournamentPlayer(
  db: Db,
  tournamentId: number,
  userId: number,
  playerId: number,
) {
  const t = await tournamentRow(db, tournamentId);
  const [p] = await db.query<TPlayerRow>(
    'SELECT id, user_id FROM tournament_players WHERE id = ? AND tournament_id = ?',
    [playerId, tournamentId],
  );
  if (!p) throw notFound();
  if (t.owner_user_id !== userId && p.user_id !== userId) throw forbidden();
  if (t.status !== 'registration') throw conflict('registrationClosed');
  await db.execute('DELETE FROM tournament_players WHERE id = ?', [playerId]);
  await bumpTournament(db, tournamentId);
}

// ---- rounds ---------------------------------------------------------------------------------------

async function alivePlayers(db: Db, tournamentId: number) {
  return db.query<TPlayerRow>(
    `SELECT id, user_id, display_name, board_id, rating, paid, bye_round, eliminated_round
       FROM tournament_players WHERE tournament_id = ? AND eliminated_round IS NULL
      ORDER BY id`,
    [tournamentId],
  );
}

async function openMatches(db: Db, tournamentId: number): Promise<number> {
  const [row] = await db.query<{ n: number | string }>(
    "SELECT COUNT(*) AS n FROM games WHERE tournament_id = ? AND status <> 'finished'",
    [tournamentId],
  );
  return Number(row?.n ?? 0);
}

/**
 * Ratings for the next round: a player's three-dart average in this tournament's X01 matches
 * once they have thrown enough, otherwise the rating they joined with.
 */
async function currentRatings(db: Db, t: TournamentRow, players: TPlayerRow[]) {
  const out = new Map(players.map((p) => [p.id, Number(p.rating)]));
  if (t.game_type !== 'x01') return out;
  const games = await db.query<{ id: number }>(
    "SELECT id FROM games WHERE tournament_id = ? AND status = 'finished'",
    [t.id],
  );
  const loaded = await loadGames(
    db,
    games.map((g) => g.id),
  );
  const totals = new Map<number, { points: number; darts: number }>();
  for (const l of loaded) {
    const state = stateOf(l);
    for (const v of state.visits) {
      const tp = l.players.find((p) => p.id === v.playerId)?.tournament_player_id;
      if (!tp) continue;
      const acc = totals.get(tp) ?? { points: 0, darts: 0 };
      acc.points += v.scored;
      acc.darts += v.darts.length;
      totals.set(tp, acc);
    }
  }
  for (const [tp, acc] of totals) {
    if (acc.darts >= 9 && out.has(tp)) out.set(tp, Math.round((acc.points / acc.darts) * 30) / 10);
  }
  return out;
}

export interface RoundSuggestion {
  round: number;
  pairing: Pairing;
  players: { id: number; name: string; rating: number }[];
}

/** The organiser's next round: suggested pairs of the players still in. */
export async function suggestRound(
  db: Db,
  tournamentId: number,
  userId: number,
): Promise<RoundSuggestion> {
  const t = await ownTournament(db, tournamentId, userId);
  if (t.status === 'finished') throw conflict('tournamentOver');
  if (await openMatches(db, tournamentId)) throw conflict('roundOpen');
  const players = await alivePlayers(db, tournamentId);
  if (players.length < 2) throw conflict('notEnoughPlayers');
  const ratings = await currentRatings(db, t, players);
  const pairing = suggestPairs(
    players.map((p) => ({
      id: p.id,
      rating: ratings.get(p.id) ?? 0,
      hadBye: p.bye_round !== null,
    })),
  );
  return {
    round: t.round + 1,
    pairing,
    players: players.map((p) => ({
      id: p.id,
      name: p.display_name,
      rating: ratings.get(p.id) ?? 0,
    })),
  };
}

/** Starts the next round with the organiser's pairs (suggested, maybe with players swapped). */
export async function startRound(
  db: PluginDatabase,
  tournamentId: number,
  userId: number,
  pairing: Pairing,
) {
  await db.transaction(async (tx) => {
    const t = await ownTournament(tx, tournamentId, userId, true);
    if (t.status === 'finished') throw conflict('tournamentOver');
    if (await openMatches(tx, tournamentId)) throw conflict('roundOpen');
    const players = await alivePlayers(tx, tournamentId);
    if (players.length < 2) throw conflict('notEnoughPlayers');
    const error = checkPairing(
      players.map((p) => p.id),
      pairing,
    );
    if (error) throw conflict(error);
    const round = t.round + 1;
    const byId = new Map(players.map((p) => [p.id, p]));
    const boards = await tx.query<BoardRow>(
      'SELECT id, name, code, position FROM boards WHERE tournament_id = ? ORDER BY position',
      [tournamentId],
    );
    const free = new Set(boards.map((b) => b.id));
    for (const [a, b] of pairing.pairs) {
      const pa = byId.get(a)!;
      const pb = byId.get(b)!;
      // The board one of them is on, else any free board, else the match waits for one.
      const board =
        [pa.board_id, pb.board_id].find((id) => id !== null && free.has(id)) ??
        free.values().next().value ??
        null;
      if (board !== null) free.delete(board);
      const { insertId } = await tx.execute(
        `INSERT INTO games (mode, game_type, options, owner_user_id, status, watch_code,
                            tournament_id, round, board_id, started_at)
         VALUES ('tournament', ?, ?, NULL, 'playing', ?, ?, ?, ?, UTC_TIMESTAMP())`,
        [t.game_type, t.options, await uniqueCode(tx), tournamentId, round, board],
      );
      for (const [seat, p] of [pa, pb].entries()) {
        await tx.execute(
          `INSERT INTO game_players (game_id, user_id, display_name, seat, tournament_player_id)
           VALUES (?, ?, ?, ?, ?)`,
          [insertId, p.user_id, p.display_name, seat, p.id],
        );
      }
    }
    if (pairing.bye !== null) {
      await tx.execute('UPDATE tournament_players SET bye_round = ? WHERE id = ?', [
        round,
        pairing.bye,
      ]);
    }
    await tx.execute(
      `UPDATE tournaments SET round = ?, status = 'running',
              started_at = COALESCE(started_at, UTC_TIMESTAMP()), version = version + 1
        WHERE id = ?`,
      [round, tournamentId],
    );
  });
}

/** Puts matches waiting for a board on the given free boards. */
async function assignWaitingMatches(db: Db, tournamentId: number, boardIds: number[]) {
  for (const boardId of boardIds) {
    const [next] = await db.query<{ id: number }>(
      `SELECT id FROM games WHERE tournament_id = ? AND status = 'playing' AND board_id IS NULL
        ORDER BY id LIMIT 1`,
      [tournamentId],
    );
    if (!next) return;
    await db.execute('UPDATE games SET board_id = ?, version = version + 1 WHERE id = ?', [
      boardId,
      next.id,
    ]);
  }
}

/**
 * A tournament match has just ended (inside its transaction): the loser is out, the board goes
 * to the next waiting match, and when only one player is left the tournament is over.
 */
export async function matchFinished(
  db: Db,
  game: GameRow,
  players: PlayerRow[],
  winnerPlayerId: number | null,
) {
  const tournamentId = game.tournament_id!;
  for (const p of players) {
    if (p.id !== winnerPlayerId && p.tournament_player_id !== null) {
      await db.execute('UPDATE tournament_players SET eliminated_round = ? WHERE id = ?', [
        game.round,
        p.tournament_player_id,
      ]);
    }
  }
  if (game.board_id !== null) await assignWaitingMatches(db, tournamentId, [game.board_id]);
  if ((await openMatches(db, tournamentId)) === 0) {
    const alive = await alivePlayers(db, tournamentId);
    if (alive.length === 1) {
      await db.execute(
        `UPDATE tournaments SET status = 'finished', champion_player_id = ?,
                finished_at = UTC_TIMESTAMP() WHERE id = ?`,
        [alive[0]!.id, tournamentId],
      );
    }
  }
  await bumpTournament(db, tournamentId);
}

// ---- views ------------------------------------------------------------------------------------------

/** The tournament for its organiser and players (null for anyone else). */
export async function tournamentView(
  db: Db,
  tournamentId: number,
  userId: number,
): Promise<TournamentView | null> {
  const t = await tournamentRow(db, tournamentId);
  const [players, boards, games] = await Promise.all([
    db.query<TPlayerRow>(
      `SELECT id, user_id, display_name, board_id, rating, paid, bye_round, eliminated_round
         FROM tournament_players WHERE tournament_id = ? ORDER BY display_name, id`,
      [tournamentId],
    ),
    db.query<BoardRow>(
      'SELECT id, name, code, position FROM boards WHERE tournament_id = ? ORDER BY position',
      [tournamentId],
    ),
    db.query<{ id: number }>('SELECT id FROM games WHERE tournament_id = ? ORDER BY round, id', [
      tournamentId,
    ]),
  ]);
  const isOrganizer = t.owner_user_id === userId;
  const mine = players.find((p) => p.user_id === userId) ?? null;
  if (!isOrganizer && !mine) return null;
  const type = gameType(t);
  const loaded = await loadGames(
    db,
    games.map((g) => g.id),
  );
  const boardName = new Map(boards.map((b) => [b.id, b.name]));
  const progress: ProgressMatch[] = [];
  const matches: MatchView[] = loaded.map((l) => {
    const state = stateOf(l);
    progress.push({
      ...progressOf(state, String(l.game.id)),
      round: l.game.round ?? undefined,
      board: l.game.board_id === null ? null : (boardName.get(l.game.board_id) ?? null),
    });
    const seats = [...l.players].sort((a, b) => a.seat - b.seat);
    const legs = hasLegs(type) && (state.options as { legs: number }).legs > 1;
    const side = (i: number) => {
      const s = state.players[i];
      return s ? String(legs ? s.legs : s.score) : '';
    };
    const tp = (i: number) => seats[i]?.tournament_player_id ?? 0;
    const winner = seats.find((s) => s.id === l.game.winner_player_id);
    return {
      gameId: l.game.id,
      round: l.game.round ?? 0,
      sides: [tp(0), tp(1)],
      names: [seats[0]?.display_name ?? '', seats[1]?.display_name ?? ''],
      score: [side(0), side(1)],
      winner: winner?.tournament_player_id ?? null,
      status: l.game.status,
      board: l.game.board_id === null ? null : (boardName.get(l.game.board_id) ?? null),
      watchCode: l.game.watch_code,
      mine: seats.some((s) => s.user_id === userId),
    };
  });
  const busy = new Map(
    loaded
      .filter((l) => l.game.status === 'playing' && l.game.board_id !== null)
      .map((l) => [l.game.board_id!, l.game.id]),
  );
  const boardViews: BoardView[] = boards.map((b) => ({
    id: b.id,
    name: b.name,
    code: isOrganizer ? b.code : null,
    gameId: busy.get(b.id) ?? null,
    players: players.filter((p) => p.board_id === b.id).length,
  }));
  return {
    id: t.id,
    name: t.name,
    ownerName: t.owner_name,
    isOrganizer,
    status: t.status,
    type,
    options: parseJson(t.options, {}) as GameOptions,
    feeCents: t.fee_cents,
    currency: t.currency,
    organizerPct: t.organizer_pct,
    joinCode: isOrganizer ? t.join_code : null,
    round: t.round,
    version: t.version,
    championId: t.champion_player_id,
    boards: boardViews,
    players: players.map((p) => ({
      id: p.id,
      name: p.display_name,
      isMe: p.user_id === userId,
      paid: Boolean(p.paid),
      boardId: p.board_id,
      rating: Number(p.rating),
      byeRound: p.bye_round,
      eliminatedRound: p.eliminated_round,
    })),
    matches,
    progress,
    myPlayerId: mine?.id ?? null,
    createdAt: iso(t.created_at)!,
    startedAt: iso(t.started_at),
    finishedAt: iso(t.finished_at),
  };
}

export async function tournamentVersion(db: Db, id: number): Promise<number | null> {
  const [row] = await db.query<{ version: number }>(
    'SELECT version FROM tournaments WHERE id = ?',
    [id],
  );
  return row ? row.version : null;
}

/** The tournament a join code or board code belongs to, for the join screen. */
export async function tournamentPreview(db: Db, id: number) {
  const t = await tournamentRow(db, id);
  const [count] = await db.query<{ n: number | string }>(
    'SELECT COUNT(*) AS n FROM tournament_players WHERE tournament_id = ?',
    [id],
  );
  return {
    id: t.id,
    name: t.name,
    ownerName: t.owner_name,
    status: t.status,
    type: gameType(t),
    feeCents: t.fee_cents,
    currency: t.currency,
    players: Number(count?.n ?? 0),
  };
}

/** The match being played on a board right now. */
export async function matchOnBoard(db: Db, boardId: number) {
  const [row] = await db.query<{ id: number; watch_code: string }>(
    "SELECT id, watch_code FROM games WHERE board_id = ? AND status = 'playing' LIMIT 1",
    [boardId],
  );
  return row ?? null;
}

export async function isTournamentPlayer(db: Db, tournamentId: number, userId: number) {
  const [row] = await db.query<{ id: number }>(
    'SELECT id FROM tournament_players WHERE tournament_id = ? AND user_id = ?',
    [tournamentId, userId],
  );
  return Boolean(row);
}

/** Tournaments the person organises or plays in, running ones first. */
export async function myTournaments(db: Db, userId: number): Promise<TournamentSummary[]> {
  const rows = await db.query<
    TournamentRow & { players: number | string; champion: string | null; mine: number | null }
  >(
    `SELECT t.*, (SELECT COUNT(*) FROM tournament_players x WHERE x.tournament_id = t.id) AS players,
            c.display_name AS champion, me.id AS mine
       FROM tournaments t
       LEFT JOIN tournament_players me ON me.tournament_id = t.id AND me.user_id = ?
       LEFT JOIN tournament_players c ON c.id = t.champion_player_id
      WHERE t.owner_user_id = ? OR me.id IS NOT NULL
      ORDER BY FIELD(t.status, 'running', 'registration', 'finished'), t.created_at DESC
      LIMIT 50`,
    [userId, userId],
  );
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const current = await db.query<{ tournament_id: number; id: number; board: string | null }>(
    `SELECT g.tournament_id, g.id, b.name AS board FROM games g
       JOIN game_players p ON p.game_id = g.id AND p.user_id = ?
       LEFT JOIN boards b ON b.id = g.board_id
      WHERE g.tournament_id IN (${placeholders(ids.length)}) AND g.status = 'playing'`,
    [userId, ...ids],
  );
  return rows.map((r) => {
    const game = current.find((c) => c.tournament_id === r.id);
    return {
      id: r.id,
      name: r.name,
      status: r.status,
      type: gameType(r),
      isOrganizer: r.owner_user_id === userId,
      players: Number(r.players),
      round: r.round,
      champion: r.champion,
      myGameId: game?.id ?? null,
      myBoard: game?.board ?? null,
      createdAt: iso(r.created_at)!,
    };
  });
}
