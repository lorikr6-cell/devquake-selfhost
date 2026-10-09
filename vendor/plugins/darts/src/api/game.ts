import { api } from '../lib/api';
import { deleteGame, gameVersion, gameView } from '../lib/data/games';
import { HttpError } from '../lib/http';
import { id } from '../lib/validate';

// GET /api/games/:id?v=<version>: the game, for its players and a tournament's organiser and
// players; { changed: false } while the version is still the one the screen has.
export const GET = api(async ({ params, db, user, url }) => {
  const gameId = id(params.id);
  const known = url.searchParams.get('v');
  if (known !== null) {
    const version = await gameVersion(db, gameId);
    if (version === null) throw new HttpError(404, 'notFound');
    if (String(version) === known) {
      // Access is still checked, so nobody else learns that the game exists.
      await gameView(db, gameId, user.id);
      return { changed: false };
    }
  }
  const { view } = await gameView(db, gameId, user.id);
  return { changed: true, game: view };
});

// DELETE /api/games/:id: the owner deletes a practice or casual game.
export const DELETE = api(async ({ params, db, user }) => {
  await deleteGame(db, id(params.id), user.id);
});
