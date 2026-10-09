import { api } from '../lib/api';
import { generateDrills } from '../lib/drills';
import { saveDrills } from '../lib/data/drills';
import { statsGames } from '../lib/data/games';
import { analyze } from '../lib/stats';

// POST /api/drills: new practice drills from the player's weak spots (replaces unplayed ones).
export const POST = api(async ({ db, user }) => {
  const plans = generateDrills(analyze(await statsGames(db, user.id), user.id));
  await saveDrills(db, user.id, plans);
  return { count: plans.length };
});
