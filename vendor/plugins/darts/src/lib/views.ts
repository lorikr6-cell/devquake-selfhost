import type { GameOptions, GameType, Mode } from './engine/games';
import type { DrillReason } from './drills';
import type { ProgressMatch } from './progress';
import type { GameStatus, TournamentStatus } from './model';

// What the API and the pages hand to the screens. Types only: safe to import in the browser.

export interface PlayerView {
  /** The game's player id (what visits refer to). */
  id: number;
  /** Empty for a deleted account (the screens show "Former player"). */
  name: string;
  isMe: boolean;
  /** Killer: the player's number. */
  number: number | null;
}

/**
 * A game as the scoring and watching screens need it: the setup and every visit. The browser
 * replays it with the same rules as the server (src/lib/engine).
 */
export interface GameView {
  id: number;
  mode: Mode;
  type: GameType;
  options: GameOptions;
  status: GameStatus;
  version: number;
  isOwner: boolean;
  /** My player id; null when watching. */
  me: number | null;
  players: PlayerView[];
  /** Visits in order; darts as labels ("T20,1,D20"). */
  visits: { playerId: number; darts: string }[];
  /** Casual games waiting for players (owner only). */
  joinCode: string | null;
  /** For sharing with people who only watch (players, owner, organiser). */
  watchCode: string | null;
  tournament: { id: number; name: string; round: number; board: string | null } | null;
  drillId: number | null;
  winnerPlayerId: number | null;
  createdAt: string;
  finishedAt: string | null;
}

/** A line in the lists of games (practice, casual, recent). */
export interface GameSummary {
  id: number;
  mode: Mode;
  type: GameType;
  options: GameOptions;
  status: GameStatus;
  players: string[];
  /** The winner's name ('' for a former player), or null. */
  winner: string | null;
  won: boolean;
  darts: number;
  drillReason: DrillReason | null;
  tournamentName: string | null;
  createdAt: string;
  finishedAt: string | null;
}

export interface TournamentPlayerView {
  id: number;
  name: string;
  isMe: boolean;
  paid: boolean;
  boardId: number | null;
  rating: number;
  byeRound: number | null;
  eliminatedRound: number | null;
}

export interface MatchView {
  gameId: number;
  round: number;
  /** Tournament player ids, in throwing order. */
  sides: [number, number];
  names: [string, string];
  /** What each side has: legs won, points, or the score left (X01 with one leg). */
  score: [string, string];
  winner: number | null;
  status: GameStatus;
  board: string | null;
  watchCode: string;
  mine: boolean;
}

export interface BoardView {
  id: number;
  name: string;
  /** Organiser only. */
  code: string | null;
  /** The match on the board right now. */
  gameId: number | null;
  players: number;
}

export interface TournamentView {
  id: number;
  name: string;
  ownerName: string;
  isOrganizer: boolean;
  status: TournamentStatus;
  type: GameType;
  options: GameOptions;
  feeCents: number;
  currency: string;
  organizerPct: number;
  /** Organiser only. */
  joinCode: string | null;
  round: number;
  version: number;
  championId: number | null;
  boards: BoardView[];
  players: TournamentPlayerView[];
  matches: MatchView[];
  /** Every match visit by visit, for the scores section. */
  progress: ProgressMatch[];
  myPlayerId: number | null;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
}

export interface TournamentSummary {
  id: number;
  name: string;
  status: TournamentStatus;
  type: GameType;
  isOrganizer: boolean;
  players: number;
  round: number;
  champion: string | null;
  /** The signed-in player's match being played right now, if any. */
  myGameId: number | null;
  myBoard: string | null;
  createdAt: string;
}

export interface DrillView {
  id: number;
  reason: DrillReason;
  type: GameType;
  options: GameOptions;
  params: Record<string, string | number>;
  played: number;
  createdAt: string;
}
