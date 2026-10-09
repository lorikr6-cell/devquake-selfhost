/**
 * Tournament rules that need no database: pairing players of similar strength, the rounds of a
 * knock-out, and splitting the entry fees. Pure.
 */

export interface Entrant {
  /** The tournament player's id. */
  id: number;
  rating: number;
  /** Already went through a round without playing. */
  hadBye: boolean;
}

export interface Pairing {
  pairs: [number, number][];
  /** The player who goes to the next round without playing (odd numbers). */
  bye: number | null;
}

/**
 * The suggested matches of a round: players sorted by rating and paired with the one closest
 * to them. With an odd number, the strongest player who has not had a bye yet skips the round.
 */
export function suggestPairs(entrants: Entrant[]): Pairing {
  const sorted = [...entrants].sort((a, b) => b.rating - a.rating || a.id - b.id);
  let bye: number | null = null;
  if (sorted.length % 2 === 1) {
    const i = sorted.findIndex((e) => !e.hadBye);
    const [skipped] = sorted.splice(i < 0 ? 0 : i, 1);
    bye = skipped!.id;
  }
  const pairs: [number, number][] = [];
  for (let i = 0; i + 1 < sorted.length; i += 2) pairs.push([sorted[i]!.id, sorted[i + 1]!.id]);
  return { pairs, bye };
}

/**
 * Checks a round the organiser changed: every player exactly once, in a pair or as the bye
 * (which must exist exactly when the number is odd). Returns an error key, or null.
 */
export function checkPairing(playerIds: number[], pairing: Pairing): string | null {
  const used = [...pairing.pairs.flat(), ...(pairing.bye === null ? [] : [pairing.bye])];
  if (used.length !== playerIds.length || new Set(used).size !== used.length) return 'pairing';
  const ids = new Set(playerIds);
  if (!used.every((id) => ids.has(id))) return 'pairing';
  if ((playerIds.length % 2 === 1) !== (pairing.bye !== null)) return 'pairing';
  return null;
}

/** How many rounds a knock-out of `players` needs (1 for two players). */
export function roundsFor(players: number): number {
  return players < 2 ? 0 : Math.ceil(Math.log2(players));
}

/** Players left in each round (round 1 = all), for drawing the rounds not played yet. */
export function playersPerRound(players: number): number[] {
  const out: number[] = [];
  for (let n = players; n >= 2; n = Math.ceil(n / 2)) out.push(n);
  return out;
}

/**
 * The name of a round by the number of players still in it: 'final' (2), 'semi' (≤ 4),
 * 'quarter' (≤ 8), otherwise 'round' (the screens show "Round N").
 */
export function roundName(playersInRound: number): 'final' | 'semi' | 'quarter' | 'round' {
  if (playersInRound <= 2) return 'final';
  if (playersInRound <= 4) return 'semi';
  if (playersInRound <= 8) return 'quarter';
  return 'round';
}

export interface Pot {
  /** All entry fees, in cents. */
  total: number;
  organizer: number;
  prize: number;
}

/** The entry fees of `players`, the organiser's percentage and what is left as the prize. */
export function pot(feeCents: number, players: number, organizerPct: number): Pot {
  const total = Math.max(0, feeCents) * Math.max(0, players);
  const organizer = Math.round((total * Math.min(100, Math.max(0, organizerPct))) / 100);
  return { total, organizer, prize: total - organizer };
}

export const MAX_TOURNAMENT_PLAYERS = 64;
export const MAX_BOARDS = 32;
