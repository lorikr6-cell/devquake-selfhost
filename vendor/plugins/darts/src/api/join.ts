import { api } from '../lib/api';
import { joinGame, resolveCode } from '../lib/data/games';
import { requireProfile } from '../lib/data/profiles';
import { joinTournament } from '../lib/data/tournaments';
import { HttpError } from '../lib/http';
import { CODE_PATTERN, cleanCode } from '../lib/model';
import { readBody } from '../lib/validate';

// POST /api/join { code }: joins the casual game or tournament behind a code (a board's code
// joins its tournament on that board) and answers where to go next.
export const POST = api(async ({ request, db, user }) => {
  const code = cleanCode((await readBody(request)).code);
  if (!CODE_PATTERN.test(code)) throw new HttpError(400, 'code');
  const target = await resolveCode(db, code);
  if (!target) throw new HttpError(404, 'codeUnknown');
  if (target.kind === 'watch') return { href: `/watch/${target.code}` };
  const profile = await requireProfile(db, user.id);
  if (target.kind === 'game') {
    return { href: `/games/${await joinGame(db, target.id, user, profile)}` };
  }
  const tournamentId = target.kind === 'tournament' ? target.id : target.tournamentId;
  const boardId = target.kind === 'board' ? target.boardId : null;
  await joinTournament(db, tournamentId, user, profile, boardId);
  return { href: `/tournaments/${tournamentId}` };
});
